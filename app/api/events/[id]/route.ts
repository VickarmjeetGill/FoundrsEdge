import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/tokens"

export { getEventById as GET } from "../handlers"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    // TODO: A) Retrieve the user's email or member record
    let memberId: string | null = null
    let userEmail: string | null = null
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      userEmail = user?.email || null
      if (user?.email) {
        const member = await prisma.members.findUnique({
          where: { email: user.email }
        })
        memberId = member?.id || null
      }
    }

    const isAuthorized = userRole === "ADMIN" || 
      (memberId !== null && existingEvent.member_id === memberId) ||
      (userEmail !== null && existingEvent.guest_email && existingEvent.guest_email.toLowerCase() === userEmail.toLowerCase())

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: You don't own this event" }, { status: 403 })
    }

    //Parse & valid incoming data
    const body = await request.json()

    //TODO: Extract title, description, date, time, location, category, price, and host from body

    const { title, description, date, time, location, category, price, host } = body

    // 5. Update in database

    //TODO: Run prisma.events.update statement here

    const updatedEvent = await prisma.events.update({
      where: {
        id: id
      },
      data: {
        title,
        description,
        date,
        time,
        location,
        category,
        price: price !== undefined ? price : undefined,
        host: host !== undefined ? host : undefined,
      }
    })

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existingEvent = await prisma.events.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized " }, { status: 401 })
    }

    const decoded = await decrypt(sessionToken) as { userId: string, role: string }
    const userRole = decoded?.role
    const userId = decoded?.userId

    let memberId: string | null = null
    let userEmailDel: string | null = null
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      userEmailDel = user?.email || null
      if (user?.email) {
        const member = await prisma.members.findUnique({
          where: { email: user.email }
        })
        memberId = member?.id || null
      }
    }

    const isAuthorized = userRole === "ADMIN" || 
      (memberId !== null && existingEvent.member_id === memberId) ||
      (userEmailDel !== null && existingEvent.guest_email && existingEvent.guest_email.toLowerCase() === userEmailDel.toLowerCase())

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden, Not authorized to delete this event" }, { status: 403 })
    }

    const deletedEvent = await prisma.events.delete({
      where: {
        id: id
      }
    })

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
