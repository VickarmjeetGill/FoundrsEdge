import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch members along with their business details ordered by creation date
    const membersList = await prisma.members.findMany({
      include: {
        businesses: {
          orderBy: {
            created_at: 'desc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const applications = membersList.map((m) => {
      const biz = m.businesses?.[0] || null;
      return {
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        email: m.email,
        phone: m.phone || undefined,
        linkedin: m.linkedin || undefined,
        industry: m.industry || undefined,
        businessName: biz?.business_name || undefined,
        businessDesc: biz?.business_desc || undefined,
        website: biz?.website || undefined,
        revenue: biz?.revenue || undefined,
        employees: biz?.employees || undefined,
        businessType: biz?.business_type || undefined,
        geographicFocus: biz?.geographic_focus || [],
        idealClientIndustries: biz?.ideal_client_industries || [],
        referralPartnerIndustries: biz?.referral_partner_industries || [],
        priorities: biz?.priorities || [],
        openToMatching: biz?.open_to_matching ?? true,
        status: (biz?.status || 'pending').toLowerCase(),
        submittedAt: m.created_at || undefined,
      };
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching admin applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
