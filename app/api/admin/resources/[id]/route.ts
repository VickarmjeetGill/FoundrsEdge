import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// PATCH /api/admin/resources/:id — admin edits a resource. (task 3)
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
        if (data.title !== undefined) {
            if (!String(data.title).trim()) {
                return NextResponse.json({ error: 'Resource title cannot be empty.' }, { status: 400 });
            }
            updateData.title = String(data.title).trim();
        }
        if (data.category !== undefined) {
            if (!String(data.category).trim()) {
                return NextResponse.json({ error: 'Resource category cannot be empty.' }, { status: 400 });
            }
            updateData.category = String(data.category).trim();
        }
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.url !== undefined) updateData.url = data.url || null;
        if (data.tags !== undefined) updateData.tags = Array.isArray(data.tags) ? data.tags : [];
        if (data.featured !== undefined) updateData.featured = !!data.featured;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.partnerId !== undefined) updateData.partner_id = data.partnerId || null;

        const resource = await prisma.resources.update({ where: { id }, data: updateData });

        return NextResponse.json({ success: true, resource });
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }
        console.error('Resource update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
