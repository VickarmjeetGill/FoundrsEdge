import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const location = searchParams.get('location')?.trim() || '';
    const featured = searchParams.get('featured') === 'true';
    const hasActiveOffers =
      searchParams.get('hasActiveOffers') === 'true';

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get('page') || '1', 10)
    );

    const requestedLimit = Number.parseInt(
      searchParams.get('limit') || '12',
      10
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.isNaN(requestedLimit) ? 12 : requestedLimit)
    );

    const skip = (page - 1) * limit;
    const now = new Date();

    const andConditions: any[] = [
      {
        status: {
          equals: 'approved',
          mode: 'insensitive',
        },
      },
      {
        removed: false,
      },
    ];

    if (search) {
      andConditions.push({
        OR: [
          {
            business_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            business_type: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            business_desc: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (
      category &&
      category !== 'All Categories' &&
      category !== 'All Industries' &&
      category !== 'All'
    ) {
      andConditions.push({
        business_type: {
          equals: category,
          mode: 'insensitive',
        },
      });
    }

    if (
      location &&
      location !== 'All Locations' &&
      location !== 'All'
    ) {
      andConditions.push({
        geographic_focus: {
          has: location,
        },
      });
    }

    if (featured) {
      andConditions.push({
        featured: true,
      });
    }

    if (hasActiveOffers) {
      andConditions.push({
        offers: {
          some: {
            status: {
              equals: 'approved',
              mode: 'insensitive',
            },
            expiry_date: {
              gt: now,
            },
          },
        },
      });
    }

    const where = {
      AND: andConditions,
    };

    const [businesses, total] = await Promise.all([
      prisma.businesses.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          member_id: true,
          business_name: true,
          business_desc: true,
          website: true,
          business_type: true,
          geographic_focus: true,
          ideal_client_industries: true,
          referral_partner_industries: true,
          priorities: true,
          open_to_matching: true,
          status: true,
          featured: true,
          created_at: true,
          members: {
            select: {
              first_name: true,
              last_name: true,
              linkedin: true,
            },
          },
          offers: {
            where: {
              status: {
                equals: 'approved',
                mode: 'insensitive',
              },
              expiry_date: {
                gt: now,
              },
            },
            select: {
              id: true,
            },
          },
        },
        orderBy: [
          {
            featured: 'desc',
          },
          {
            created_at: 'desc',
          },
        ],
      }),
      prisma.businesses.count({
        where,
      }),
    ]);

    const directoryProfiles = businesses.map((business) => {
      const { offers, ...profile } = business;

      return {
        ...profile,
        active_offer_count: offers.length,
        has_active_offers: offers.length > 0,
      };
    });

    return NextResponse.json({
      success: true,
      businesses: directoryProfiles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search: search || null,
        category: category || null,
        location: location || null,
        featured,
        hasActiveOffers,
      },
    });
  } catch (error) {
    console.error('Directory listing fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch the business directory.',
      },
      { status: 500 }
    );
  }
}