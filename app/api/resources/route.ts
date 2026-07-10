import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const partnerId = searchParams.get('partnerId');
        const category = searchParams.get('category');
        const type = searchParams.get('type');
        const search = searchParams.get('search');

        const where: any = {};

        if (partnerId) {
            where.partner_id = partnerId;
        }
        if (category && category !== 'All Categories') {
            where.category = category;
        }
        if (type && type !== 'All Types') {
            where.type = type;
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
                        name: true,
                        logo_url: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        return NextResponse.json(resources);
    } catch (error: any) {
        console.error('Error fetching resources:', error);
        return NextResponse.json(
            { error: 'Failed to fetch resources', details: error.message },
            { status: 500 }
        );
    }
}

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
