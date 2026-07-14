import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

type UpdateDirectoryProfileBody = {
  businessName?: string;
  description?: string;
  website?: string;
  category?: string;
  geographicFocus?: string[];
  idealClientIndustries?: string[];
  referralPartnerIndustries?: string[];
  priorities?: string[];
  openToMatching?: boolean;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Read the business profile ID from /api/directory/[id].
    const { id } = await context.params;

    // Confirm that the requester is logged in.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. You must be logged in to edit a directory profile.',
        },
        { status: 401 }
      );
    }

    // Find the member record connected to the logged-in user's email.
    const member = await prisma.members.findUnique({
      where: {
        email: user.email,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member profile not found.',
        },
        { status: 404 }
      );
    }

    // Find the business directory profile being edited.
    const existingBusiness = await prisma.businesses.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        member_id: true,
      },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business directory profile not found.',
        },
        { status: 404 }
      );
    }

    // Prevent members from editing profiles that do not belong to them.
    if (existingBusiness.member_id !== member.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden. You can only edit your own business directory profile.',
        },
        { status: 403 }
      );
    }

    let body: UpdateDirectoryProfileBody;

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

    // Build the Prisma update object using only fields members are allowed to edit.
    const updateData: {
      business_name?: string;
      business_desc?: string | null;
      website?: string | null;
      business_type?: string | null;
      geographic_focus?: string[];
      ideal_client_industries?: string[];
      referral_partner_industries?: string[];
      priorities?: string[];
      open_to_matching?: boolean;
    } = {};

    if (body.businessName !== undefined) {
      const businessName = body.businessName.trim();

      if (!businessName) {
        return NextResponse.json(
          {
            success: false,
            error: 'Business name cannot be empty.',
          },
          { status: 400 }
        );
      }

      updateData.business_name = businessName;
    }

    if (body.description !== undefined) {
      updateData.business_desc = body.description.trim() || null;
    }

    if (body.website !== undefined) {
      updateData.website = body.website.trim() || null;
    }

    if (body.category !== undefined) {
      updateData.business_type = body.category.trim() || null;
    }

    if (body.geographicFocus !== undefined) {
      if (!Array.isArray(body.geographicFocus)) {
        return NextResponse.json(
          {
            success: false,
            error: 'geographicFocus must be an array of strings.',
          },
          { status: 400 }
        );
      }

      updateData.geographic_focus = body.geographicFocus;
    }

    if (body.idealClientIndustries !== undefined) {
      if (!Array.isArray(body.idealClientIndustries)) {
        return NextResponse.json(
          {
            success: false,
            error: 'idealClientIndustries must be an array of strings.',
          },
          { status: 400 }
        );
      }

      updateData.ideal_client_industries = body.idealClientIndustries;
    }

    if (body.referralPartnerIndustries !== undefined) {
      if (!Array.isArray(body.referralPartnerIndustries)) {
        return NextResponse.json(
          {
            success: false,
            error: 'referralPartnerIndustries must be an array of strings.',
          },
          { status: 400 }
        );
      }

      updateData.referral_partner_industries =
        body.referralPartnerIndustries;
    }

    if (body.priorities !== undefined) {
      if (!Array.isArray(body.priorities)) {
        return NextResponse.json(
          {
            success: false,
            error: 'priorities must be an array of strings.',
          },
          { status: 400 }
        );
      }

      updateData.priorities = body.priorities;
    }

    if (body.openToMatching !== undefined) {
      if (typeof body.openToMatching !== 'boolean') {
        return NextResponse.json(
          {
            success: false,
            error: 'openToMatching must be true or false.',
          },
          { status: 400 }
        );
      }

      updateData.open_to_matching = body.openToMatching;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid profile fields were provided for updating.',
        },
        { status: 400 }
      );
    }

    const updatedBusiness = await prisma.businesses.update({
      where: {
        id,
      },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      message: 'Business directory profile updated successfully.',
      business: updatedBusiness,
    });
  } catch (error) {
    console.error('Directory profile update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update the business directory profile.',
      },
      { status: 500 }
    );
  }
}