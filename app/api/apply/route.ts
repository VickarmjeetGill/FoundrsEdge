import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ found: false });
    }

    const emailClean = email.trim().toLowerCase();
    const member = await prisma.members.findUnique({
      where: { email: emailClean },
      include: {
        businesses: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ found: false });
    }

    const biz = member.businesses?.[0] || null;
    const status = (biz?.status || 'PENDING').toUpperCase();

    return NextResponse.json({
      found: true,
      alreadyApproved: status === 'APPROVED',
      status,
      data: {
        firstName: member.first_name || '',
        lastName: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        linkedin: member.linkedin || '',
        industry: member.industry || '',
        businessName: biz?.business_name || '',
        businessDesc: biz?.business_desc || '',
        website: biz?.website || '',
        revenue: biz?.revenue || '',
        employees: biz?.employees || '',
        businessType: biz?.business_type || '',
        geographicFocus: biz?.geographic_focus || [],
        idealClientIndustries: biz?.ideal_client_industries || [],
        referralPartnerIndustries: biz?.referral_partner_industries || [],
        priorities: biz?.priorities || [],
        openToMatching: biz?.open_to_matching === false ? 'false' : 'true',
      },
    });
  } catch (error: any) {
    console.error('Error fetching application for email:', error);
    return NextResponse.json({ found: false });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      linkedin,
      industry,
      businessName,
      businessDesc,
      website,
      revenue,
      employees,
      businessType,
      geographicFocus,
      idealClientIndustries,
      referralPartnerIndustries,
      priorities,
      openToMatching,
    } = body;

    const emailClean = (email || '').trim().toLowerCase();
    if (!emailClean || !firstName || !businessName) {
      return NextResponse.json(
        { error: 'First name, business name, and email are required.' },
        { status: 400 }
      );
    }

    // Upsert member by email
    const member = await prisma.members.upsert({
      where: { email: emailClean },
      update: {
        first_name: firstName,
        last_name: lastName || '',
        phone: phone || null,
        linkedin: linkedin || null,
        industry: industry || null,
      },
      create: {
        first_name: firstName,
        last_name: lastName || '',
        email: emailClean,
        phone: phone || null,
        linkedin: linkedin || null,
        industry: industry || null,
      },
    });

    // Check if member is already approved
    const existingBusinesses = await prisma.businesses.findMany({
      where: { member_id: member.id },
    });

    const isAlreadyApproved = existingBusinesses.some(
      (b) => (b.status || '').toUpperCase() === 'APPROVED'
    );

    if (isAlreadyApproved) {
      return NextResponse.json(
        {
          alreadyApproved: true,
          error: 'Your membership application has already been approved! Please log in to your account.',
        },
        { status: 400 }
      );
    }

    const businessData = {
      business_name: businessName,
      business_desc: businessDesc || null,
      website: website || null,
      revenue: revenue || null,
      employees: employees || null,
      business_type: businessType || null,
      geographic_focus: Array.isArray(geographicFocus) ? geographicFocus : [],
      ideal_client_industries: Array.isArray(idealClientIndustries) ? idealClientIndustries : [],
      referral_partner_industries: Array.isArray(referralPartnerIndustries) ? referralPartnerIndustries : [],
      priorities: Array.isArray(priorities) ? priorities : [],
      open_to_matching: openToMatching === true || openToMatching === 'true',
      status: 'PENDING',
    };

    if (existingBusinesses.length > 0) {
      await prisma.businesses.updateMany({
        where: { member_id: member.id },
        data: businessData,
      });
    } else {
      await prisma.businesses.create({
        data: {
          member_id: member.id,
          ...businessData,
        },
      });
    }

    return NextResponse.json({ success: true, memberId: member.id });
  } catch (error: any) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error submitting application.' },
      { status: 500 }
    );
  }
}
