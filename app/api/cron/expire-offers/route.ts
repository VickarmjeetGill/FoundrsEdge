import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOfferExpirationAlertEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    console.log(`[Cron Offers] Running auto-expire check. Now: ${now.toISOString()}`);

    const offersToExpire = await (prisma as any).offers.findMany({
      where: {
        status: {
          in: ["APPROVED", "approved"],
        },
        expiry_date: {
          lt: now,
        },
      },
      select: {
        id: true,
        title: true,
        expiry_date: true,
        members: {
          select: {
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (offersToExpire.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired offers found.",
        expiredCount: 0,
      });
    }

    const result = await (prisma as any).offers.updateMany({
      where: {
        status: {
          in: ["APPROVED", "approved"],
        },
        expiry_date: {
          lt: now,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Send email notifications to offer owners
    for (const offer of offersToExpire) {
      if (offer.members?.email) {
        const name = [offer.members.first_name, offer.members.last_name === 'Member' ? '' : offer.members.last_name].filter(Boolean).join(' ') || 'Member';
        await sendOfferExpirationAlertEmail({
          to: offer.members.email,
          name,
          offerTitle: offer.title,
        });
      }
    }

    console.log(`[Cron Offers] Successfully expired ${result.count} offers and sent email alerts.`);

    return NextResponse.json({
      success: true,
      message: `Successfully expired ${result.count} offers and sent notifications.`,
      expiredCount: result.count,
      expiredOffers: offersToExpire,
    });
  } catch (error: any) {
    console.error("[Cron Offers Error]:", error);

    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message || "" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}