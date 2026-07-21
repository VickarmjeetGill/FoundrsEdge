import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/opportunities/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, type, deadline, source_url, featured, status } = body;

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (type !== undefined) updateData.type = type;
        if (deadline !== undefined) updateData.deadline = deadline;
        if (source_url !== undefined) updateData.source_url = source_url;
        if (featured !== undefined) updateData.featured = featured;
        if (status !== undefined) updateData.status = status;

        const updated = await prisma.opportunities.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, opportunity: updated });
    } catch (error: any) {
        console.error('Error updating opportunity:', error);
        return NextResponse.json(
            { error: 'Failed to update opportunity', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/opportunities/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Hard delete or Soft delete (e.g. status = 'REMOVED' / soft deleted). Let's do hard delete for clean state, or soft-delete. Let's do hard delete.
        await prisma.opportunities.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Opportunity deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting opportunity:', error);
        return NextResponse.json(
            { error: 'Failed to delete opportunity', details: error.message },
            { status: 500 }
        );
    }
}
