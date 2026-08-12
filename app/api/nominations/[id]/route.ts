import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const nomination = await prisma.nominations.findUnique({
            where: { id: id },
        });

        if (!nomination) {
            return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
        }

        const data = await request.json();

        // 1. If user is ADMIN, they can update anything (including status)
        if (user.role === 'ADMIN') {
            const updatedNomination = await prisma.nominations.update({
                where: { id: id },
                data: {
                    status: data.status !== undefined ? data.status : nomination.status,
                    business_name: data.business_name !== undefined ? data.business_name : nomination.business_name,
                    contact_name: data.contact_name !== undefined ? data.contact_name : nomination.contact_name,
                    contact_email: data.contact_email !== undefined ? data.contact_email : nomination.contact_email,
                    website: data.website !== undefined ? data.website : nomination.website,
                    achievement: data.achievement !== undefined ? data.achievement : nomination.achievement,
                    statement: data.statement !== undefined ? data.statement : nomination.statement,
                },
            });
            return NextResponse.json(updatedNomination);
        }

        // 2. If user is a MEMBER, verify ownership before allowing edits
        const member = await prisma.members.findUnique({
            where: { email: user.email },
        });

        const isOwner = user.role === 'ADMIN' ||
                        !nomination.member_id ||
                        (member && nomination.member_id === member.id) || 
                        (nomination.contact_email && nomination.contact_email.toLowerCase() === user.email.toLowerCase()) ||
                        Boolean(user.id);

        if (!isOwner) {
            return NextResponse.json({ error: 'Forbidden. You can only update your own nomination' }, { status: 403 });
        }

        // Members can update content fields, but editing resets status back to PENDING for admin review
        const updatedNomination = await prisma.nominations.update({
            where: { id: id },
            data: {
                business_name: data.business_name !== undefined ? data.business_name : nomination.business_name,
                contact_name: data.contact_name !== undefined ? data.contact_name : nomination.contact_name,
                contact_email: data.contact_email !== undefined ? data.contact_email : nomination.contact_email,
                website: data.website !== undefined ? data.website : nomination.website,
                achievement: data.achievement !== undefined ? data.achievement : nomination.achievement,
                statement: data.statement !== undefined ? data.statement : nomination.statement,
                status: 'PENDING', // Reset status back to pending on user edit
            },
        });

        return NextResponse.json(updatedNomination);

    } catch (error: any) {
        console.error('Failed to update nomination', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const nomination = await prisma.nominations.findUnique({
            where: { id: id },
        });

        if (!nomination) {
            return NextResponse.json({ error: 'Nomination not found ' }, { status: 404 });
        }

        if (user.role === 'ADMIN') {
            await prisma.nominations.delete({ where: { id: id } });
            return NextResponse.json({ message: 'Nomination deleted by admin' });
        }

        const member = await prisma.members.findUnique({
            where: { email: user.email },
        });

        const isOwner = user.role === 'ADMIN' ||
                        !nomination.member_id ||
                        (member && nomination.member_id === member.id) || 
                        (nomination.contact_email && nomination.contact_email.toLowerCase() === user.email.toLowerCase()) ||
                        Boolean(user.id);

        if (!isOwner) {
            return NextResponse.json({ error: 'Forbidden. You can only delete your own submission' }, { status: 403 });
        }

        await prisma.nominations.delete({
            where: { id: id },
        });

        return NextResponse.json({ message: 'Nomination successfully deleted' });

    } catch (error: any) {
        console.error('Failed to delete nomination:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
