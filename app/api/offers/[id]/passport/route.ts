import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: offerId } = await params;

    try {
        const data = await request.json();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updatedOffer = await prisma.offers.update({
            where: { id: offerId },
            data: {
                is_passport: data.isPassport,
                passport_type: data.passportType,
                promo_code: data.promoCode,
            },
        });

        return NextResponse.json({ success: true, data: updatedOffer }, { status: 200 });
    } catch (error) {
        console.error('Error updating offer passport status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
