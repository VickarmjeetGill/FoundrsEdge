import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { partner_id, title, description, url, type, category, featured } = body;

        if (!partner_id || !title || !description || !url || !type || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedResource = await prisma.resources.update({
            where: { id },
            data: {
                partner_id,
                title,
                description,
                url,
                type,
                category,
                featured: typeof featured === 'boolean' ? featured : false,
            },
        });

        return NextResponse.json(updatedResource);
    } catch (error: any) {
        console.error('Error updating resource:', error);
        return NextResponse.json(
            { error: 'Failed to update resource', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.resources.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Resource deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting resource:', error);
        return NextResponse.json(
            { error: 'Failed to delete resource', details: error.message },
            { status: 500 }
        );
    }
}
