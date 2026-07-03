import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/tokens"
import { invalidateCache } from "@/lib/redis"
import { rateLimit } from "@/lib/rate-limiter"
import { validateBody } from "@/lib/validate"
import {
  sendGuestEventApprovalEmail,
  sendGuestEventRejectionEmail,
} from "@/lib/email"
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @IsString()
  @IsNotEmpty({ message: 'Date is required' })
  date!: string;

  @IsString()
  @IsNotEmpty({ message: 'Time is required' })
  time!: string;

  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location!: string;

  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category!: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  capacity?: number | string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  tags?: string[] | string;

  @IsOptional()
  @IsString()
  hostName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestBusiness?: string;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsBoolean()
  agreeGuidelines?: boolean;
}

// Helper function to check if a string is a valid UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// ====================================================
// 1. GET /api/events (Get events list with filters)
// ====================================================
export async function getEvents(request: Request) {
  try {
    // Grab the query filters from the URL (like search, category, etc.)
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")
    const category = searchParams.get("category")
    const featured = searchParams.get("featured")
    const locationType = searchParams.get("locationType")
    const statusParam = searchParams.get("status")
    const mySubmissions = searchParams.get("mySubmissions") === "true"
    const adminView = searchParams.get("adminView") === "true"
    const isPaginated = searchParams.has("page")
    const page = isPaginated ? Math.max(1, parseInt(searchParams.get("page") || "1", 10)) : 1
    const limit = isPaginated ? Math.max(1, parseInt(searchParams.get("limit") || "12", 10)) : 12
    const skip = isPaginated ? (page - 1) * limit : undefined
    const take = isPaginated ? limit : undefined

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    let isAdmin = false
    let userId: string | null = null

    // Check if the user is logged in
    if (sessionToken) {
      try {
        const decoded = await decrypt(sessionToken) as { role: string; userId: string }
        userId = decoded?.userId || null
        if (decoded?.role === "ADMIN") {
          isAdmin = true
        }
      } catch (e) {
        console.error("Failed to decrypt session token")
      }
    }

    const andConditions: any[] = []

    // Security check: Only admins can view pending or rejected events in the review panel (adminView=true).
    // Regular visitors can ONLY see approved events, EXCEPT that logged-in users
    // can also see their own submitted events (even if they are PENDING or REJECTED) on their private dashboard (when mySubmissions=true).
    if (isAdmin && adminView) {
      if (statusParam) {
        andConditions.push({ status: statusParam as any })
      }
    } else if (userId && mySubmissions) {
      // Find the logged-in member to retrieve their member ID
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      let memberId: string | null = null
      if (user?.email) {
        const member = await prisma.members.findUnique({
          where: { email: user.email }
        })
        memberId = member?.id || null
      }

      if (memberId) {
        // Regular user: can see APPROVED events OR their own events
        andConditions.push({
          OR: [
            { status: "APPROVED" },
            { member_id: memberId }
          ]
        })
      } else {
        andConditions.push({ status: "APPROVED" })
      }
    } else {
      andConditions.push({ status: "APPROVED" })
    }

    // Search filter: Find keywords in title, description, or host name (case-insensitive)
    if (q) {
      andConditions.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { host: { contains: q, mode: "insensitive" } }
        ]
      })
    }

    // Category filter: e.g. "Networking" or "Workshop"
    if (category && category !== "All") {
      andConditions.push({ category })
    }

    // Featured filter: Get only highlighted events
    if (featured) {
      andConditions.push({ featured: featured === "true" })
    }

    // Location type filter: Decide if it is an Online event or In-Person
    if (locationType && locationType !== "All Locations") {
      if (locationType === "Online") {
        andConditions.push({
          OR: [
            { location: { contains: "online", mode: "insensitive" } },
            { location: { contains: "zoom", mode: "insensitive" } }
          ]
        })
      } else if (locationType === "In-Person") {
        andConditions.push({
          AND: [
            { NOT: { location: { contains: "online", mode: "insensitive" } } },
            { NOT: { location: { contains: "zoom", mode: "insensitive" } } }
          ]
        })
      }
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {}

    // Pull events from the database and pin featured events to the top
    const [total, eventsList] = await Promise.all([
      prisma.events.count({ where }),
      prisma.events.findMany({
        where,
        orderBy: [
          { featured: "desc" },
          { created_at: "desc" }
        ],
        skip,
        take,

        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          time: true,
          location: true,
          category: true,
          price: true,
          host: true,
          featured: true,
          source: true,
          status: true,
          capacity: true,
          attendees: true,
          guest_name: true,
          guest_email: true,
          guest_business: true,
        }
      })
    ])

    if (isPaginated) {
      return NextResponse.json({ events: eventsList, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }, { status: 200 })
    }

    return NextResponse.json(eventsList, { status: 200 })
  } catch (error: any) {
    console.error("Failed to fetch events with filters:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

// ====================================================
// 2. POST /api/events (Submit a new event)
// ====================================================
export async function createEvent(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = await rateLimit(ip, 10, 60);
    if (!success) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    let memberId: string | null = null

    let isAdmin = false

    // Find the logged-in member to associate this event submission with them
    if (sessionToken) {
      try {
        const decoded = await decrypt(sessionToken) as { userId: string; role: string }
        if (decoded?.role === "ADMIN") {
          isAdmin = true
        }
        if (decoded?.userId) {
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
          })
          if (user?.email) {
            const member = await prisma.members.findUnique({
              where: { email: user.email }
            })
            memberId = member?.id || null
          }
        }
      } catch (e) {
        console.error("Session verification failed:", e)
      }
    }

    const rawBody = await request.json()
    const { errors, data } = await validateBody(CreateEventDto, rawBody)
    if (errors) {
      return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
    }
    const body = data;
    const {
      title,
      description,
      date,
      time,
      location,
      category,
      price,
      host,
      tags,
      capacity,
      featured,
      duration,
      guestName,
      guestEmail,
      guestBusiness
    } = body;

    const normalizedGuestEmail = guestEmail?.toLowerCase()?.trim() || null;
    // Validation: Make sure they filled out all the required fields
    if (!body.title || !body.description || !body.date || !body.time || !body.location || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, date, time, location, category" },
        { status: 400 }
      )
    }

    if (!memberId && !normalizedGuestEmail) {
      return NextResponse.json(
        { success: false, error: "Guest email is required for guest event submissions." },
        { status: 400 }
      );
    }

    if (!memberId && normalizedGuestEmail) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentGuestSubmission = await prisma.events.findFirst({
        where: {
          guest_email: normalizedGuestEmail,
          created_at: {
            gte: thirtyDaysAgo,
          },
        },
      });

      if (recentGuestSubmission) {
        return NextResponse.json(
          {
            success: false,
            error: "This email has already used its free event submission in the last 30 days.",
          },
          { status: 429 }
        );
      }
    }

    // Save the new event in the database (sets status to APPROVED for admin, PENDING for others)
    const newEvent = await prisma.events.create({
      data: {
        title,
        description,
        date,
        time,
        location,
        category,
        price: price || "Free",
        host: host || "Member Submission",
        member_id: memberId,
        source: memberId ? "member" : "public",
        guest_name: guestName || null,
        guest_email: normalizedGuestEmail,
        guest_business: guestBusiness || null,
        status: isAdmin ? "APPROVED" : "PENDING",
        capacity: capacity ? Number(capacity) : 50,
        featured: typeof featured === "boolean" ? featured : false,
        duration: duration || "2 Hours",
        tags: Array.isArray(tags)
          ? tags
          : typeof tags === "string"
            ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
            : [],
      }
    })

    await invalidateCache();

    return NextResponse.json(
      { success: true, message: "Event submitted successfully", event: newEvent },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("API Error in POST /events:", error)
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message || "" },
      { status: 500 }
    )
  }
}

// ====================================================
// 3. GET /api/events/[id] (Get a single event's details)
// ====================================================
export async function getEventById(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify event ID is a valid UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
    }

    // Look up this specific event by its ID
    const event = await prisma.events.findUnique({
      where: { id }
    })

    // If it doesn't exist, tell them so
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event, { status: 200 })
  } catch (error: any) {
    console.error("Failed to fetch event:", error)
    return NextResponse.json(
      { error: `Failed to fetch event: ${error.message}` },
      { status: 500 }
    )
  }
}

// ====================================================
// 4. PUT /api/events/[id] (Edit an event)
// ====================================================
export async function updateEvent(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify event ID is a valid UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
    }

    const existingEvent = await prisma.events.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await decrypt(sessionToken) as { userId: string, role: string }
    const userRole = decoded?.role
    const userId = decoded?.userId

    let memberId: string | null = null

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (user?.email) {
        const member = await prisma.members.findUnique({
          where: { email: user.email }
        })
        memberId = member?.id || null
      }
    }

    // Ownership check: You must either be an Admin, or the user who submitted the event to edit it.
    const isAuthorized = userRole === "ADMIN" || (memberId !== null && existingEvent.member_id === memberId)

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: You don't own this event" }, { status: 403 })
    }

    // Lock check: Regular members are not allowed to edit events that are already APPROVED
    if (userRole !== "ADMIN" && existingEvent.status === "APPROVED") {
      return NextResponse.json({ error: "Forbidden: Approved events are locked for editing" }, { status: 400 })
    }

    const body = await request.json()
    const { title, description, date, time, location, category, price, host, tags, capacity, featured, duration } = body

    // Update the database record with the new edits
    const updatedEvent = await prisma.events.update({
      where: { id },
      data: {
        title,
        description,
        date,
        time,
        location,
        category,
        price: price !== undefined ? price : undefined,
        host: host !== undefined ? host : undefined,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        featured: typeof featured === "boolean" ? featured : undefined,
        duration: duration !== undefined ? duration : undefined,
        tags: tags !== undefined
          ? Array.isArray(tags)
            ? tags
            : typeof tags === "string"
              ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
              : []
          : undefined,
      }
    })

    await invalidateCache();

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent
    })
  } catch (error: any) {
    console.error("Put Event Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message || "" },
      { status: 500 }
    )
  }
}

// ====================================================
// 5. DELETE /api/events/[id] (Delete an event)
// ====================================================
export async function deleteEvent(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify event ID is a valid UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
    }

    const existingEvent = await prisma.events.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await decrypt(sessionToken) as { userId: string, role: string }
    const userRole = decoded?.role
    const userId = decoded?.userId

    let memberId: string | null = null
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (user?.email) {
        const member = await prisma.members.findUnique({
          where: { email: user.email }
        })
        memberId = member?.id || null
      }
    }

    // Ownership check: You must either be an Admin, or the user who submitted the event to delete it.
    const isAuthorized = userRole === "ADMIN" || (memberId !== null && existingEvent.member_id === memberId)

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden, Not authorized to delete this event" }, { status: 403 })
    }

    // Remove the event from the database
    const deletedEvent = await prisma.events.delete({
      where: { id }
    })

    await invalidateCache();

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
      event: deletedEvent
    })
  } catch (error: any) {
    console.error("DELETE Event Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message || "" },
      { status: 500 }
    )
  }
}

// ====================================================
// 6. PATCH /api/events/[id]/status (Approve or Reject status)
// ====================================================
export async function updateEventStatus(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify event ID is a valid UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await decrypt(sessionToken) as { role: string }
    const userRole = decoded?.role

    // Admin only guard: Only Admins can approve or reject event submissions
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only admins can approve or reject events." }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be APPROVED OR REJECTED" }, { status: 400 })
    }

    // Update status to either APPROVED or REJECTED
    const updatedEvent = await prisma.events.update({
      where: { id },
      data: {
        status: status as "APPROVED" | "REJECTED"
      }
    })

    console.log("Approval email debug:", {
      status,
      source: (updatedEvent as any).source,
      guest_email: (updatedEvent as any).guest_email,
      title: updatedEvent.title,
    });

    if (
      (updatedEvent as any).source === "public" &&
      (updatedEvent as any).guest_email
    ) {
      if (status === "APPROVED") {
        await sendGuestEventApprovalEmail({
          to: (updatedEvent as any).guest_email,
          guestName: (updatedEvent as any).guest_name,
          eventTitle: updatedEvent.title,
        });
      }

      if (status === "REJECTED") {
        await sendGuestEventRejectionEmail({
          to: (updatedEvent as any).guest_email,
          guestName: (updatedEvent as any).guest_name,
          eventTitle: updatedEvent.title,
        });
      }
    }

    await invalidateCache();

    return NextResponse.json({
      success: true,
      message: `Event status updated to ${status} successfully`,
      event: updatedEvent
    })
  } catch (error: any) {
    console.error("Failed to update event status:", error)
    return NextResponse.json(
      { error: `Failed to update event status: ${error.message}` },
      { status: 500 }
    )
  }
}

// ====================================================
// 7. PATCH /api/events/[id]/feature (Toggle Featured)
// ====================================================
export async function toggleEventFeature(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify event ID is a valid UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await decrypt(sessionToken) as { role: string }
    const userRole = decoded?.role

    // Admin only guard: Only Admins can feature/highlight events
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only admins can feature events." }, { status: 403 })
    }

    const body = await request.json()
    const { featured } = body

    if (typeof featured !== "boolean") {
      return NextResponse.json({ error: "Invalid featured value. Must be a boolean (true/false)" }, { status: 400 })
    }

    // Toggle the featured column in the database (true/false)
    const updatedEvent = await prisma.events.update({
      where: { id },
      data: { featured }
    })

    await invalidateCache();

    return NextResponse.json({
      success: true,
      message: `Event featured status updated successfully`,
      event: updatedEvent
    })
  } catch (error: any) {
    console.error("Failed to update event featured status:", error)
    return NextResponse.json(
      { error: `Failed to update featured status: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function rsvpEvent(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await decrypt(sessionToken) as { userId: string }
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.events.findUnique({
      where: { id }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.attendees >= event.capacity) {
      return NextResponse.json({ error: "Event is already full" }, { status: 400 })
    }

    const updatedEvent = await prisma.events.update({
      where: { id },
      data: {
        attendees: {
          increment: 1
        }
      }
    })

    await invalidateCache();

    return NextResponse.json({
      success: true,
      message: "Successfully RSVP'd for the event",
      event: updatedEvent
    })
  } catch (error: any) {
    console.error("Failed to RSVP event:", error)
    return NextResponse.json(
      { error: `Failed to RSVP: ${error.message}` },
      { status: 500 }
    )
  }
}


