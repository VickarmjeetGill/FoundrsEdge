import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/resources — public resources hub.
// Optional filters: ?category=<type> ?partnerId=<uuid> ?featured=true
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const partnerId = searchParams.get('partnerId');
        const featured = searchParams.get('featured');

        const where: any = { status: 'PUBLISHED' };
        if (category && category !== 'All Categories') where.category = category;
        if (partnerId) where.partner_id = partnerId;
        if (featured === 'true') where.featured = true;

        const resources = await prisma.resources.findMany({
            where,
            orderBy: [{ featured: 'desc' }, { created_at: 'desc' }],
            include: { partners: { select: { id: true, name: true } } },
        });

        return NextResponse.json({ success: true, resources });
    } catch (error) {
        console.error('Resources fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
