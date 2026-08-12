import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const category = searchParams.get('category');
        const region = searchParams.get('region');
        const featured = searchParams.get('featured');
        const nominationsOpen = searchParams.get('nominationsOpen') || searchParams.get('nominationOpen');

        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, parseInt(searchParams.get('limit') || '12', 10));
        const skip = (page - 1) * limit;

        const where: any = {};

        if (category && category !== 'All Categories') {
            where.category = category;
        }

        if (region && region !== 'All Regions') {
            where.region = region;
        }

        if (featured === 'true') {
            where.featured = true;
        } else if (featured === 'false') {
            where.featured = false;
        }

        if (nominationsOpen === 'true') {
            where.nominationsOpen = true;
            const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Edmonton" });
            where.deadline = {
                gte: todayStr,
            };
        } else if (nominationsOpen === 'false') {
            where.nominationsOpen = false;
        } else {
            // Default public view: show active awards + recently closed awards (within a 2-day grace period)
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 2);
            const cutoffStr = cutoff.toLocaleDateString("sv-SE", { timeZone: "America/Edmonton" });
            where.deadline = {
                gte: cutoffStr,
            };
        }

        const [total, awards] = await Promise.all([
            prisma.awards.count({ where }),
            prisma.awards.findMany({
                where,
                orderBy: {
                    deadline: 'asc',
                },
                skip,
                take: limit,

                select: {
                    id: true,
                    name: true,
                    category: true,
                    region: true,
                    sponsor: true,
                    featured: true,
                    nominationsOpen: true,
                    desc: true,
                    org: true,
                    deadline: true,
                    value: true,
                    cycle: true,
                }
            })
        ]);
        return NextResponse.json({
            awards,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Error fetching awards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch awards', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { name, org, category, region, deadline, awardDate, value, cycle, desc, featured, nominationsOpen, sponsor } = body;

        if (!name || !org || !category || !region || !deadline || !awardDate || !value || !cycle || !desc) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 });
        }

        const newAward = await prisma.awards.create({
            data: {
                name,
                org,
                category,
                region,
                deadline,
                award_date: awardDate,
                value,
                cycle,
                desc,
                featured: typeof featured === 'boolean' ? featured : false,
                nominationsOpen: typeof nominationsOpen === 'boolean' ? nominationsOpen : true,
                sponsor: sponsor || null,
            }
        });

        return NextResponse.json({ success: true, award: newAward }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating award:', error);
        return NextResponse.json(
            { error: 'Failed to create award', details: error.message },
            { status: 500 }
        );
    }
}