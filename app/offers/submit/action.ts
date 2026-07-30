'use server'

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function createOffer(formData: any) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'You must be logged in to submit an offer' };
        }

        const member = await prisma.members.findUnique({
            where: { email: user.email },
        });

        const memberId = member ? member.id : null;

        const existingBusiness = memberId ? await prisma.businesses.findFirst({
            where: {
                member_id: memberId,
                business_name: formData.businessName,
            },
        }) : null;

        let chosenBusinessId: string;

        if (existingBusiness) {
            chosenBusinessId = existingBusiness.id;
        } else {
            const newBusiness = await prisma.businesses.create({
                data: {
                    member_id: memberId,
                    business_name: formData.businessName,
                },
            });
            chosenBusinessId = newBusiness.id;
        }

        const offer = await prisma.offers.create({
            data: {
                member_id: memberId,
                business_id: chosenBusinessId,
                business_name: formData.businessName,
                category: formData.category,
                type: formData.type,
                discount_value: formData.discountValue || null,
                title: formData.title,
                description: formData.description,
                location: formData.location || null,
                expiry_date: new Date(formData.expiryDate),
                fe_discount: formData.foundersEdgeDiscount || null,
                events_page_url: formData.eventsPageUrl || null,
                how_to_redeem: formData.howToRedeem,
                is_affiliate: false,
                status: 'pending',
            },
        });

        return { success: true };
    } catch (error: any) {
        console.error(error);
        return { success: false, error: `Failed to create offer: ${error.message || error}` };
    }
}
