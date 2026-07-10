import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const isValidUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isValidUuid) {
      return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingOffer = await prisma.offers.findUnique({
      where: { id }
    });

    if (!existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const member = await prisma.members.findUnique({
      where: { email: user.email },
    });
    const memberId = member ? member.id : null;

    const isAuthorized = user.role === 'ADMIN' || (memberId && existingOffer.member_id === memberId);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    const updatedOffer = await prisma.offers.update({
      where: { id },
      data: {
        business_name: data.businessName,
        title: data.title,
        category: data.category,
        type: data.type,
        discount_value: data.discountValue || null,
        description: data.description,
        location: data.location || null,
        expiry_date: new Date(data.expiryDate),
        fe_discount: data.foundersEdgeDiscount || null,
        events_page_url: data.eventsPageUrl || null,
        how_to_redeem: data.howToRedeem,
        promo_code: data.promoCode || null,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, offer: updatedOffer });
  } catch (error: any) {
    console.error('Failed to update offer:', error);
    return NextResponse.json(
      { error: 'Failed to update offer', details: error?.message || '' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const isValidUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isValidUuid) {
      return NextResponse.json(
        { error: 'Invalid offer ID' },
        { status: 400 }
      );
    }

    const offer = await (prisma as any).offers.findUnique({
      where: { id },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Failed to fetch offer:', error);

    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const isValidUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isValidUuid) {
      return NextResponse.json(
        { error: 'Invalid offer ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const featured =
      body.featured === true || body.featured === 'true'
        ? true
        : body.featured === false || body.featured === 'false'
          ? false
          : null;

    if (featured === null) {
      return NextResponse.json(
        { error: 'featured must be true or false' },
        { status: 400 }
      );
    }

    const updatedOffer = await (prisma as any).offers.update({
      where: { id },
      data: {
        featured,
      },
    });

    return NextResponse.json({
      success: true,
      message: featured
        ? 'Offer marked as featured.'
        : 'Offer removed from featured.',
      offer: updatedOffer,
    });
  } catch (error: any) {
    console.error('Failed to update featured offer:', error);

    return NextResponse.json(
      {
        error: 'Failed to update featured offer',
        details: error?.message || '',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const isValidUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isValidUuid) {
      return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingOffer = await prisma.offers.findUnique({
      where: { id }
    });

    if (!existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const member = await prisma.members.findUnique({
      where: { email: user.email },
    });
    const memberId = member ? member.id : null;

    const isAuthorized = user.role === 'ADMIN' || (memberId && existingOffer.member_id === memberId);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deletedOffer = await prisma.offers.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, offer: deletedOffer });
  } catch (error: any) {
    console.error('Failed to delete offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer', details: error?.message || '' },
      { status: 500 }
    );
  }
}
    