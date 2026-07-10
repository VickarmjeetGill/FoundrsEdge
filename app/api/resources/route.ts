import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/resources — public resources hub.
// Optional filters: ?category=<type> ?partnerId=<uuid> ?featured=true ?type=<type> ?search=<term>
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const partnerId = searchParams.get('partnerId');
        const category = searchParams.get('category');
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const featured = searchParams.get('featured');

        const where: any = { status: 'PUBLISHED' };

        if (partnerId) {
            where.partner_id = partnerId;
        }
        if (category && category !== 'All Categories') {
            where.category = category;
        }
        if (type && type !== 'All Types') {
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

        const resources = await prisma.resources.findMany({
            where,
            include: {
                partner: {
                    select: {
                        id: true,
                        name: true,
                        logo_url: true,
                    },
                },
            },
            orderBy: [
                { featured: 'desc' },
                { created_at: 'desc' }
            ],
        });

        return NextResponse.json({ success: true, resources });
    } catch (error: any) {
        console.error('Error fetching resources:', error);
        return NextResponse.json(
            { error: 'Failed to fetch resources', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/resources — admin/public resource creation
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { partner_id, title, description, url, type, category, featured } = body;

        if (!partner_id || !title || !description || !url || !type || !category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newResource = await prisma.resources.create({
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

        return NextResponse.json(newResource, { status: 201 });
    } catch (error: any) {
        console.error('Error creating resource:', error);
        return NextResponse.json(
            { error: 'Failed to create resource', details: error.message },
            { status: 500 }
        );
    }
}
