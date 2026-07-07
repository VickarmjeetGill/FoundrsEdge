import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/partners — public list of active partners (with resource counts).
export async function GET() {
    try {
        const partners = await prisma.partners.findMany({
            where: { status: 'ACTIVE' },
            orderBy: [{ featured: 'desc' }, { name: 'asc' }],
            include: { _count: { select: { resources: true } } },
        });

        return NextResponse.json({ success: true, partners });
    } catch (error) {
        console.error('Partners fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
