import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/opportunities
// Filters: ?type=<type> ?featured=true ?search=<term> ?status=ACTIVE
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const featured = searchParams.get('featured');
        const status = searchParams.get('status') || 'ACTIVE';

        const where: any = { status };

        if (type && type !== 'All') {
            where.type = type;
        }
        if (featured === 'true') {
            where.featured = true;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const limitStr = searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr, 10) : undefined;

        const findOptions: any = {
            where,
            orderBy: [
                { featured: 'desc' },
                { created_at: 'desc' }
            ],
        };

        if (limit && !isNaN(limit)) {
            findOptions.take = limit;
        }

        const opportunities = await prisma.opportunities.findMany(findOptions);

        return NextResponse.json({ success: true, opportunities });
    } catch (error: any) {
        console.error('Error fetching opportunities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch opportunities', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/opportunities
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, type, deadline, source_url, featured, status } = body;

        if (!title || !description || !type || !source_url) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newOpportunity = await prisma.opportunities.create({
            data: {
                title,
                description,
                type,
                deadline,
                source_url,
                featured: typeof featured === 'boolean' ? featured : false,
                status: status || 'ACTIVE',
            },
        });

        return NextResponse.json(newOpportunity, { status: 201 });
    } catch (error: any) {
        console.error('Error creating opportunity:', error);
        return NextResponse.json(
            { error: 'Failed to create opportunity', details: error.message },
            { status: 500 }
        );
    }
}
