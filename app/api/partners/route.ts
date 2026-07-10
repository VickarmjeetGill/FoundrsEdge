import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/partners — public list of active partners (with resource counts).
export async function GET() {
    try {
        const partners = await prisma.partners.findMany({
            where: { status: 'ACTIVE' },
            orderBy: [{ featured: 'desc' }, { name: 'asc' }],
            include: {
                _count: {
                    select: {
                        resources: true,
                    },
                },
            },
        });

        return NextResponse.json({ success: true, partners });
    } catch (error: any) {
        console.error('Error fetching partners:', error);
        return NextResponse.json(
            { error: 'Failed to fetch partners', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/partners — create partner profile
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, logo_url, short_desc, long_desc, website } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Missing required field: name' },
                { status: 400 }
            );
        }

        const newPartner = await prisma.partners.create({
            data: {
                name: name.trim(),
                logo_url: logo_url || null,
                short_desc: short_desc || null,
                long_desc: long_desc || null,
                website: website || null,
            },
        });

        return NextResponse.json({ success: true, partner: newPartner }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating partner:', error);
        return NextResponse.json(
            { error: 'Failed to create partner', details: error.message },
            { status: 500 }
        );
    }
}
