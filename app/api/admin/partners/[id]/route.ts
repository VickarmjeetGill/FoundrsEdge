import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// PATCH /api/admin/partners/:id — admin edits a partner profile. (task 3)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { id } = await params;
        const data = await request.json();

        const updateData: any = {};
        if (data.name !== undefined) {
            if (!String(data.name).trim()) {
                return NextResponse.json({ error: 'Partner name cannot be empty.' }, { status: 400 });
            }
            updateData.name = String(data.name).trim();
        }
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.website !== undefined) updateData.website = data.website || null;
        if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl || null;
        if (data.category !== undefined) updateData.category = data.category || null;
        if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail || null;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.featured !== undefined) updateData.featured = !!data.featured;

        const partner = await prisma.partners.update({ where: { id }, data: updateData });

        return NextResponse.json({ success: true, partner });
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }
        console.error('Partner update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
