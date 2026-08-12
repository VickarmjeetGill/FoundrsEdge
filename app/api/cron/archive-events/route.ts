import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEventArchivedAlertEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Security check: Verify Bearer token matches CRON_SECRET in production environment
    if (
      process.env.NODE_ENV === "production" && 
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate grace period cutoff date (2 days ago in America/Edmonton timezone)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2);
    const archiveCutoffStr = cutoffDate.toLocaleDateString("sv-SE", { timeZone: "America/Edmonton" });

    console.log(`[Cron Archive] Running auto-archive check. Cutoff date (2-day grace): ${archiveCutoffStr}`);

    // Retrieve events about to be archived for detailed logs
    const eventsToArchive = await (prisma.events as any).findMany({
      where: {
        status: "APPROVED",
        date: {
          lt: archiveCutoffStr,
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
        guest_email: true,
        guest_name: true,
        members: {
          select: {
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (eventsToArchive.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No past events to archive today.",
        archivedCount: 0,
      });
    }

    // Perform bulk database update to status='ARCHIVED' and featured=false
    const result = await prisma.events.updateMany({
      where: {
        status: "APPROVED",
        date: {
          lt: archiveCutoffStr,
        },
      },
      data: {
        status: "ARCHIVED",
        featured: false,
      },
    });

    // Send email alerts to event hosts
    for (const event of eventsToArchive) {
      const recipientEmail = event.members?.email || event.guest_email;
      if (recipientEmail) {
        const name = event.members
          ? [event.members.first_name, event.members.last_name === 'Member' ? '' : event.members.last_name].filter(Boolean).join(' ')
          : event.guest_name || 'Event Host';

        await sendEventArchivedAlertEmail({
          to: recipientEmail,
          name,
          eventTitle: event.title,
        });
      }
    }

    console.log(`[Cron Archive] Successfully archived ${result.count} past events and sent email alerts.`);

    return NextResponse.json({
      success: true,
      message: `Successfully archived ${result.count} past events and sent notifications.`,
      archivedCount: result.count,
      archivedEvents: eventsToArchive,
    });
  } catch (error: any) {
    console.error("[Cron Archive Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message || "" },
      { status: 500 }
    );
  }
}

// Support GET requests for easy manual triggers / browser testing in development
export async function GET(request: Request) {
  return POST(request);
}
