import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { sendApplicationStatusEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const dbStatus = String(status).toUpperCase(); // PENDING, APPROVED, REJECTED

    // Update business status associated with member ID or business ID
    await prisma.businesses.updateMany({
      where: {
        OR: [
          { member_id: id },
          { id: id },
        ],
      },
      data: {
        status: dbStatus,
      },
    });

    // Find associated member to send status notification email
    const member = await prisma.members.findFirst({
      where: {
        OR: [
          { id: id },
          { businesses: { some: { id: id } } },
        ],
      },
    });

    if (member && (dbStatus === 'APPROVED' || dbStatus === 'REJECTED')) {
      const recipientName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Applicant';
      const cleanEmail = member.email.toLowerCase().trim();

      if (dbStatus === 'APPROVED') {
        const existingUser = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (!existingUser) {
          const tempPassword = await bcrypt.hash(crypto.randomUUID(), 10);
          await prisma.user.create({
            data: {
              email: cleanEmail,
              name: recipientName,
              password: tempPassword,
              role: 'MEMBER',
              status: 'ACTIVE',
            },
          });
        }
      }

      await sendApplicationStatusEmail({
        to: member.email,
        name: recipientName,
        status: dbStatus as 'APPROVED' | 'REJECTED',
        notes: notes || undefined,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Delete member (cascades to businesses) or delete business directly
    await prisma.members.deleteMany({
      where: { id },
    });

    await prisma.businesses.deleteMany({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
