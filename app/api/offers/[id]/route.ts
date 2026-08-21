import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { invalidateCache } from '@/lib/redis';

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

    const data = await request.json();

    const existingOffer = await prisma.offers.findUnique({
      where: { id }
    });

    if (!existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const member = await prisma.members.findFirst({
      where: { email: { equals: user.email, mode: 'insensitive' } },
    });
    const memberId = member ? member.id : null;

    const isAuthorized = user.role === 'ADMIN' || (memberId && existingOffer.member_id === memberId);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expDate = new Date(data.expiryDate);
    if (!isNaN(expDate.getTime())) {
      expDate.setUTCHours(23, 59, 59, 999);
    }

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
        expiry_date: expDate,
        fe_discount: data.foundersEdgeDiscount || null,
        events_page_url: data.eventsPageUrl || null,
        how_to_redeem: data.howToRedeem,
        promo_code: data.promoCode || null,
        ...(data.isPassport !== undefined ? { is_passport: Boolean(data.isPassport) } : {}),
        ...(data.passportType !== undefined ? { passport_type: data.passportType } : {}),
        status: user.role === 'ADMIN' ? existingOffer.status : 'pending',
      },
    });

    const { invalidateCache } = await import('@/lib/redis');
    await invalidateCache();

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

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.status !== undefined) {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      updateData.status = body.status;
    }

    if (body.featured !== undefined) {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      updateData.featured = Boolean(body.featured);
    }

    if (body.isPassport !== undefined || body.is_passport !== undefined) {
      updateData.is_passport = Boolean(body.isPassport ?? body.is_passport);
    }

    if (body.passportType !== undefined || body.passport_type !== undefined) {
      updateData.passport_type = body.passportType ?? body.passport_type;
    }

    if (body.promoCode !== undefined || body.promo_code !== undefined) {
      updateData.promo_code = body.promoCode ?? body.promo_code;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    const updatedOffer = await prisma.offers.update({
      where: { id },
      data: updateData,
    });

    const { invalidateCache } = await import('@/lib/redis');
    await invalidateCache();

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
    });
  } catch (error: any) {
    console.error('Failed to update offer:', error);

    return NextResponse.json(
      {
        error: 'Failed to update offer',
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

    const member = await prisma.members.findFirst({
      where: { email: { equals: user.email, mode: 'insensitive' } },
    });
    const memberId = member ? member.id : null;

    const isAuthorized = user.role === 'ADMIN' || (memberId && existingOffer.member_id === memberId);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deletedOffer = await prisma.offers.delete({
      where: { id },
    });

    await invalidateCache();

    return NextResponse.json({ success: true, offer: deletedOffer });
  } catch (error: any) {
    console.error('Failed to delete offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer', details: error?.message || '' },
      { status: 500 }
    );
  }
}
    