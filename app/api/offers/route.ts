import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { invalidateCache } from '@/lib/redis';
import { rateLimit } from '@/lib/rate-limiter';
import { validateBody } from '@/lib/validate';
import {
    IsBoolean,
    IsDateString,
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';


export class CreateOfferDto {
    @IsString()
    @IsNotEmpty({ message: 'Business name is required' })
    businessName!: string;

    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    title!: string;

    @IsString()
    @IsNotEmpty({ message: 'Description is required' })
    description!: string;

    @IsString()
    @IsNotEmpty({ message: 'Category is required' })
    category!: string;

    @IsString()
    @IsNotEmpty({ message: 'Type is required' })
    type!: string;

    @IsOptional()
    @IsString()
    discountValue?: string;

    @IsOptional()
    @IsString()
    discountTemplate?: string;



    @IsOptional()
    @IsIn(
        [
            'restaurant',
            'retail',
            'professional_services',
            'golf',
            'other',
        ],
        {
            message:
                'Discount category must be restaurant, retail, professional_services, golf, or other',
        }
    )
    discountCategory?: string;

    @IsOptional()
    @IsString()
    discountUnit?: string;

    @IsOptional()
    @IsString()
    customDiscount?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsDateString({}, { message: 'Expiry date must be a valid ISO date string' })
    @IsNotEmpty({ message: 'Expiry date is required' })
    expiryDate!: string;

    @IsOptional()
    @IsString()
    foundersEdgeDiscount?: string;

    @IsOptional()
    @IsString()
    eventsPageUrl?: string;

    @IsOptional()
    @IsString()
    howToRedeem?: string;

    @IsOptional()
    @IsString()
    promoCode?: string;

    @IsOptional()
    @IsBoolean()
    agreeGuidelines?: boolean;
}

function getOfferTemplateLabel(offer: {
    type: string;
    is_passport?: boolean | null;
    passport_type?: string | null;
}) {
    if (offer.passport_type) {
        return offer.passport_type
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }

    if (offer.is_passport) {
        return 'Passport Offer';
    }

    const templateLabels: Record<string, string> = {
        percentage: 'Percentage Discount',
        fixed: 'Fixed Amount Discount',
        bogo: 'Buy One Get One',
        custom: 'Custom Offer',
        event: 'Event Offer',
        affiliate: 'Affiliate Offer',
    };

    return templateLabels[offer.type?.toLowerCase()] || 'Standard Offer';
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const category = searchParams.get('category');
        const type = searchParams.get('type');
        const featured = searchParams.get('featured');
        const adminView = searchParams.get('adminView') === 'true';
        const mySubmissions = searchParams.get('mySubmissions') === 'true';
        const search = searchParams.get('search');
        const location = searchParams.get('location');
        const hideExpired = searchParams.get('hideExpired') === 'true';

        const isPaginated = searchParams.has('page');
        const page = isPaginated ? Math.max(1, parseInt(searchParams.get('page') || '1', 10)) : 1;
        const limit = isPaginated ? Math.max(1, parseInt(searchParams.get('limit') || '12', 10)) : 12;
        const skip = isPaginated ? (page - 1) * limit : undefined;
        const take = isPaginated ? limit : undefined;

        const andConditions: any[] = [];

        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { business_name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { category: { contains: search, mode: 'insensitive' } },
                    { discount_value: { contains: search, mode: 'insensitive' } },
                    { fe_discount: { contains: search, mode: 'insensitive' } },
                    { type: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        if (location) {
            andConditions.push({
                location: { contains: location, mode: 'insensitive' }
            });
        }

        if (hideExpired) {
            andConditions.push({
                expiry_date: {
                    gt: new Date()
                }
            });
        }

        if (adminView) {
            const user = await getCurrentUser();
            if (!user || user.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
            }
            const statusParam = searchParams.get('status');
            if (statusParam) {
                andConditions.push({
                    status: { equals: statusParam, mode: 'insensitive' }
                });
            }
        } else if (mySubmissions) {
            const user = await getCurrentUser();
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            let member = await prisma.members.findUnique({
                where: { email: user.email },
            });
            if (!member) {
                const nameParts = (user.name || 'Test Member').trim().split(/\s+/);
                const firstName = nameParts[0] || 'Test';
                const lastName = nameParts.slice(1).join(' ') || 'Member';
                member = await prisma.members.create({
                    data: {
                        email: user.email,
                        first_name: firstName,
                        last_name: lastName
                    }
                });
            }
            andConditions.push({ member_id: member.id });
        } else {
            andConditions.push({ status: 'approved' });
            andConditions.push({ is_passport: false });
        }

        if (category && category !== 'All Categories' && category !== 'All') {
            andConditions.push({ category });
        }

        if (type && type !== 'All Types' && type !== 'All') {
            andConditions.push({ type });
        }

        if (featured === 'true') {
            andConditions.push({
                OR: [
                    { featured: true },
                    { fe_discount: { not: null } }
                ]
            });
        }

        const where = andConditions.length > 0 ? { AND: andConditions } : {};

        const [offers, total] = await Promise.all([
            prisma.offers.findMany({
                where,
                skip,
                take,
                orderBy: [
                    { featured: 'desc' },
                    { created_at: 'desc' }
                ],

                select: {
                    id: true,
                    title: true,
                    description: true,
                    business_id: true,
                    business_name: true,
                    category: true,
                    type: true,
                    discount_value: true,
                    discount_template: true,
                    discount_category: true,
                    status: true,
                    expiry_date: true,
                    featured: true,
                    location: true,
                    fe_discount: true,
                    how_to_redeem: true,
                    is_passport: true,
                    passport_type: true,
                    promo_code: true,
                    events_page_url: true,
                    members: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.offers.count({ where })
        ]);


        const offersWithTemplateLabels = offers.map((offer) => ({
            ...offer,
            template_label: getOfferTemplateLabel(offer),
        }));


        let stats = null;
        if (adminView) {
            const [totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
                prisma.offers.count(),
                prisma.offers.count({ where: { status: { equals: 'pending', mode: 'insensitive' } } }),
                prisma.offers.count({ where: { status: { equals: 'approved', mode: 'insensitive' } } }),
                prisma.offers.count({ where: { status: { equals: 'rejected', mode: 'insensitive' } } })
            ]);
            stats = {
                total: totalCount,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount
            };
        }

        const offersWithBusinessDirectoryId = offers.map((offer) => ({
            ...offer,
            business_directory_id: offer.business_id,
        }));

        if (isPaginated) {
            return NextResponse.json({
                offers: offersWithTemplateLabels,
                stats,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }

        return NextResponse.json(offersWithTemplateLabels);

    } catch (error: any) {
        console.error('Error fetching offers:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success } = await rateLimit(ip, 10, 60);
        if (!success) {
            return NextResponse.json({ success: false, error: 'Too Many Requests' }, { status: 429 });
        }
        const rawData = await request.json();
        const { errors, data } = await validateBody(CreateOfferDto, rawData);
        if (errors) {
            return NextResponse.json({ success: false, error: 'Validation failed', details: errors }, { status: 400 });
        }

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        let member = await prisma.members.findUnique({
            where: { email: user.email },
        });

        if (!member) {
            const nameParts = (user.name || 'Test Member').trim().split(/\s+/);
            const firstName = nameParts[0] || 'Test';
            const lastName = nameParts.slice(1).join(' ') || 'Member';
            member = await prisma.members.create({
                data: {
                    email: user.email,
                    first_name: firstName,
                    last_name: lastName
                }
            });
        }
        const memberId = member.id;

        const existingBusiness = await prisma.businesses.findFirst({
            where: { business_name: data.businessName },
        });

        let chosenBusinessId: string;
        if (existingBusiness) {
            chosenBusinessId = existingBusiness.id;
        } else {
            const newBusiness = await prisma.businesses.create({
                data: { business_name: data.businessName },
            });
            chosenBusinessId = newBusiness.id;
        }

        const offer = await (prisma as any).offers.create({
            data: {
                member_id: memberId,
                business_id: chosenBusinessId,
                business_name: data.businessName,
                category: data.category,
                type: data.type,
                discount_value: data.discountValue || null,
                discount_template: data.discountTemplate || null,
                discount_category: data.discountCategory || null,
                title: data.title,
                description: data.description,
                location: data.location || null,
                expiry_date: new Date(data.expiryDate),
                fe_discount: data.foundersEdgeDiscount || null,
                events_page_url: data.eventsPageUrl || null,
                how_to_redeem: data.howToRedeem,
                promo_code: data.promoCode || null,
                is_affiliate: false,
                status: 'pending',
            },
        });

        await invalidateCache();

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating offer:', error);
        return NextResponse.json({ success: false, error: `Failed to create offer: ${error.message || error}` }, { status: 500 });
    }
}
