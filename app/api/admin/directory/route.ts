import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

type AdminDirectoryRequestBody = {
  businessId?: string;
  memberId?: string | null;
  businessName?: string;
  description?: string;
  website?: string;
  category?: string;
  geographicFocus?: string[];
  idealClientIndustries?: string[];
  referralPartnerIndustries?: string[];
  priorities?: string[];
  openToMatching?: boolean;
  featured?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    // Confirm that the requester is logged in.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. You must be logged in.',
        },
        { status: 401 }
      );
    }

    // Only administrators can create or approve directory listings.
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden. Administrator access is required.',
        },
        { status: 403 }
      );
    }

    let body: AdminDirectoryRequestBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'The request body must contain valid JSON.',
        },
        { status: 400 }
      );
    }

    /*
     * APPROVE AN EXISTING LISTING
     *
     * If businessId is provided, locate that listing and change its
     * status to APPROVED.
     */
    if (body.businessId) {
      const existingBusiness = await prisma.businesses.findUnique({
        where: {
          id: body.businessId,
        },
        select: {
          id: true,
          removed: true,
        },
      });

      if (!existingBusiness) {
        return NextResponse.json(
          {
            success: false,
            error: 'Business directory listing not found.',
          },
          { status: 404 }
        );
      }

      if (existingBusiness.removed) {
        return NextResponse.json(
          {
            success: false,
            error: 'A removed directory listing cannot be approved.',
          },
          { status: 400 }
        );
      }

      const approvedBusiness = await prisma.businesses.update({
        where: {
          id: body.businessId,
        },
        data: {
          status: 'APPROVED',
          featured:
            body.featured !== undefined ? body.featured : undefined,
        },
        select: {
          id: true,
          member_id: true,
          business_name: true,
          business_desc: true,
          website: true,
          business_type: true,
          geographic_focus: true,
          status: true,
          featured: true,
          removed: true,
          created_at: true,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'approved',
        message: 'Business directory listing approved successfully.',
        business: approvedBusiness,
      });
    }

    /*
     * CREATE A NEW APPROVED LISTING
     *
     * When no businessId is supplied, the administrator is creating
     * a new directory listing.
     */
    const businessName = body.businessName?.trim();

    if (!businessName) {
      return NextResponse.json(
        {
          success: false,
          error:
            'businessName is required when creating a directory listing.',
        },
        { status: 400 }
      );
    }

    if (
      body.geographicFocus !== undefined &&
      !Array.isArray(body.geographicFocus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'geographicFocus must be an array of strings.',
        },
        { status: 400 }
      );
    }

    if (
      body.idealClientIndustries !== undefined &&
      !Array.isArray(body.idealClientIndustries)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'idealClientIndustries must be an array of strings.',
        },
        { status: 400 }
      );
    }

    if (
      body.referralPartnerIndustries !== undefined &&
      !Array.isArray(body.referralPartnerIndustries)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'referralPartnerIndustries must be an array of strings.',
        },
        { status: 400 }
      );
    }

    if (
      body.priorities !== undefined &&
      !Array.isArray(body.priorities)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'priorities must be an array of strings.',
        },
        { status: 400 }
      );
    }

    if (
      body.openToMatching !== undefined &&
      typeof body.openToMatching !== 'boolean'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'openToMatching must be true or false.',
        },
        { status: 400 }
      );
    }

    if (
      body.featured !== undefined &&
      typeof body.featured !== 'boolean'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'featured must be true or false.',
        },
        { status: 400 }
      );
    }

    // If a member ID was supplied, confirm that the member exists.
    if (body.memberId) {
      const member = await prisma.members.findUnique({
        where: {
          id: body.memberId,
        },
        select: {
          id: true,
        },
      });

      if (!member) {
        return NextResponse.json(
          {
            success: false,
            error: 'The supplied memberId does not belong to a member.',
          },
          { status: 404 }
        );
      }
    }

    const createdBusiness = await prisma.businesses.create({
      data: {
        member_id: body.memberId || null,
        business_name: businessName,
        business_desc: body.description?.trim() || null,
        website: body.website?.trim() || null,
        business_type: body.category?.trim() || null,
        geographic_focus: body.geographicFocus || [],
        ideal_client_industries: body.idealClientIndustries || [],
        referral_partner_industries:
          body.referralPartnerIndustries || [],
        priorities: body.priorities || [],
        open_to_matching: body.openToMatching ?? true,
        status: 'APPROVED',
        featured: body.featured ?? false,
        removed: false,
      },
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
        removed: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        action: 'created',
        message:
          'Business directory listing created and approved successfully.',
        business: createdBusiness,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin directory creation or approval error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create or approve the directory listing.',
      },
      { status: 500 }
    );
  }
}