import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const passportOffers = await prisma.offers.findMany({
            where: {
                status: 'approved',
                is_passport: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        // Map database fields to front-end types
        const mapped = passportOffers.map((o: any) => ({
            id: o.id,
            title: o.title,
            provider: o.business_name,
            type: o.passport_type || 'ticket',
            originalPrice: o.type === 'fixed' || o.type === 'percentage' ? `$${o.discount_value}` : o.type || '',
            discountedPrice: o.fe_discount ? `$${parseFloat(o.fe_discount)}` : '',
            savingValue: o.fe_discount ? `${o.fe_discount} OFF` : 'Special Discount',
            description: o.description,
            location: o.location || 'Calgary, AB',
            eventDate: o.events_page_url ? 'Special Event' : undefined,
            promoCode: o.discount_value || 'VIP-MEMBER',
            redeemUrl: o.events_page_url || '#',
            howToRedeem: o.how_to_redeem || 'Enter your promo code at checkout.',
            expiryDate: o.expiry_date ? o.expiry_date.toISOString() : '',
        }));

        // Adjust prices/saving labels mapping to be more accurate if fields are present
        const finalized = mapped.map((o: any, idx: number) => {
            const dbOffer = passportOffers[idx];
            return {
                ...o,
                // Fallbacks if customized fields exist on the db record:
                originalPrice: undefined,
                discountedPrice: dbOffer.type === 'percentage' ? `${dbOffer.discount_value}% off` : dbOffer.type === 'fixed' ? `$${dbOffer.discount_value} off` : dbOffer.type === 'bogo' ? 'Buy 1 Get 1 Free' : dbOffer.discount_value || 'Special Offer',
                savingValue: dbOffer.discount_value && dbOffer.type === 'percentage' ? `${dbOffer.discount_value}% OFF` : 'EXCLUSIVES',
                promoCode: dbOffer.promo_code || dbOffer.discount_value || 'FE-PASSPORT',
                redeemUrl: dbOffer.events_page_url || '',
                howToRedeem: dbOffer.how_to_redeem || 'Apply code during booking registration.'
            };
        });

        return NextResponse.json(finalized, { status: 200 });
    } catch (error) {
        console.error('Error fetching passport offers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
