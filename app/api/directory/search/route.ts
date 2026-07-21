import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('q')?.trim() || '';

    if (!keyword) {
      return NextResponse.json({
        businesses: [],
        total: 0,
        message: 'Enter a keyword to search the business directory.',
      });
    }

    const businesses = await prisma.businesses.findMany({
      where: {
        status: {
          equals: 'approved',
          mode: 'insensitive',
        },
        removed: false,
        OR: [
          {
            business_name: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            business_type: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            business_desc: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        business_name: true,
        business_desc: true,
        business_type: true,
        website: true,
        geographic_focus: true,
        featured: true,
        status: true,
        created_at: true,
      },
      orderBy: [
        {
          featured: 'desc',
        },
        {
          business_name: 'asc',
        },
      ],
    });

    return NextResponse.json({
      businesses,
      total: businesses.length,
      keyword,
    });
  } catch (error) {
    console.error('Directory search error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search the business directory.',
      },
      { status: 500 }
    );
  }
}