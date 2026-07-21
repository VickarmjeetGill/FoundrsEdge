import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Confirm that the requester is logged in.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. You must be logged in to claim a business profile.',
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
        first_name: true,
        last_name: true,
        email: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member profile not found for the logged-in account.',
        },
        { status: 404 }
      );
    }

    // Find the directory profile being claimed.
    const business = await prisma.businesses.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        member_id: true,
        business_name: true,
        removed: true,
      },
    });

    if (!business || business.removed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business directory profile not found.',
        },
        { status: 404 }
      );
    }

    // The same member already owns this profile.
    if (business.member_id === member.id) {
      return NextResponse.json({
        success: true,
        action: 'already_claimed',
        message: 'This business directory profile already belongs to you.',
        business,
      });
    }

    // Prevent a member from taking a profile already owned by someone else.
    if (business.member_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'This business directory profile has already been claimed by another member.',
        },
        { status: 409 }
      );
    }

    // Link the unclaimed directory profile to the logged-in member.
    const claimedBusiness = await prisma.businesses.update({
      where: {
        id,
      },
      data: {
        member_id: member.id,
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
        members: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      action: 'claimed',
      message: 'Business directory profile claimed successfully.',
      business: claimedBusiness,
    });
  } catch (error) {
    console.error('Directory profile claim error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to claim the business directory profile.',
      },
      { status: 500 }
    );
  }
}