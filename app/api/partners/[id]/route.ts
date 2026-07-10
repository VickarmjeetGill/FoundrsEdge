import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/partners/:id — public partner profile with its published resources.
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const partner = await prisma.partners.findUnique({
            where: { id },
            include: {
                resources: {
                    where: { status: 'PUBLISHED' },
                    orderBy: [{ featured: 'desc' }, { created_at: 'desc' }],
                },
            },
        });

        if (!partner) {
            return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        // Return a shape that satisfies both setPartner(data) and setPartner(data.partner)
        return NextResponse.json({
            success: true,
            partner,
            ...partner
        });
    } catch (error: any) {
        console.error('Error fetching partner profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch partner profile', details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, logo_url, short_desc, long_desc, website } = body;

        if (!name) {
            return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
        }

        const updatedPartner = await prisma.partners.update({
            where: { id },
            data: {
                name,
                logo_url: logo_url || null,
                short_desc: short_desc || null,
                long_desc: long_desc || null,
                website: website || null,
            },
        });

        return NextResponse.json(updatedPartner);
    } catch (error: any) {
        console.error('Error updating partner:', error);
        return NextResponse.json(
            { error: 'Failed to update partner', details: error.message },
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

        await prisma.partners.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Partner deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting partner:', error);
        return NextResponse.json(
            { error: 'Failed to delete partner', details: error.message },
            { status: 500 }
        );
    }
}
