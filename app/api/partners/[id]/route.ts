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

        return NextResponse.json({ success: true, partner });
    } catch (error) {
        console.error('Partner fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
