import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limiter';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { validateBody } from '@/lib/validate';

export class CreateNominationDto {
    @IsString()
    @IsNotEmpty({ message: 'Award ID is required' })
    award_id!: string;

    @IsString()
    @IsNotEmpty({ message: 'Business name is required' })
    business_name!: string;

    @IsString()
    @IsNotEmpty({ message: 'Contact name is required' })
    contact_name!: string;

    @IsString()
    @IsEmail({}, { message: 'Contact email must be valid' })
    contact_email!: string;

    @IsString()
    @IsOptional()
    website?: string;

    @IsString()
    @IsNotEmpty({ message: 'Achievement is required' })
    achievement!: string;

    @IsString()
    @IsNotEmpty({ message: 'Statement is required' })
    statement!: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    created_at?: string;

    @IsString()
    @IsOptional()
    updated_at?: string;
}

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success } = await rateLimit(ip, 10, 60); // Max 10 nominations/minute
        if (!success) {
            return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
        }

        const user = await getCurrentUser();

        if (!user || !user.email) {
            return NextResponse.json(
                {
                    error: 'Unauthorized. Please log in to submit a nomination'
                },

                {
                    status: 401
                }

            );
        }

        const rawData = await request.json();
        const { errors, data } = await validateBody(CreateNominationDto, rawData)
        if (errors) {
            return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
        }
        const body = data;

        const member = await prisma.members.findUnique({
            where: {
                email: user.email,
            },
        });

        if (!member) {
            return NextResponse.json(
                {
                    error: 'You must be a member to submit a nomination',
                },
                {
                    status: 403,
                }
            );
        }

        const existingNomination = await prisma.nominations.findFirst({
            where: {
                award_id: data.award_id,
                member_id: member.id,
            },
        });

        if (existingNomination) {
            return NextResponse.json(
                {
                    error: 'You have already submitted a nomination for this award',
                },
                {
                    status: 409,
                }
            );
        }

        const award = await prisma.awards.findUnique({
            where: {
                id: data.award_id,
            },
        });

        if (!award) {
            return NextResponse.json(
                {
                    error: 'Award not found',
                },
                {
                    status: 404,
                }
            );
        }

        if (!award.nominationsOpen) {
            return NextResponse.json(
                {
                    error: 'Nominations are closed for this award',
                },
                {
                    status: 403,
                }
            );
        }

        const nomination = await prisma.nominations.create({
            data: {
                award_id: data.award_id,
                member_id: member.id,
                business_name: data.business_name || (member as any).businesses?.[0]?.business_name || 'Founders Edge Member',
                contact_name: data.contact_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || user.name || user.email,
                contact_email: data.contact_email || member.email || user.email,
                website: data.website || (member as any).businesses?.[0]?.website || '',
                achievement: data.achievement,
                statement: data.statement,
                status: 'PENDING',
            },
        });

        return NextResponse.json(nomination);

    } catch (error: any) {
        console.error('Nomination submission failed:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const isPaginated = searchParams.has('page');
        const page = isPaginated ? Math.max(1, parseInt(searchParams.get('page') || '1', 10)) : 1;
        const limit = isPaginated ? Math.max(1, parseInt(searchParams.get('limit') || '12', 10)) : 12;
        const skip = isPaginated ? (page - 1) * limit : undefined;
        const take = isPaginated ? limit : undefined;
        const user = await getCurrentUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const listViewSelect = {
            id: true,
            award_id: true,
            member_id: true,
            business_name: true,
            contact_name: true,
            contact_email: true,
            website: true,
            status: true,
            created_at: true,
            achievement: true,
            statement: true,
            award: {
                select: {
                    id: true,
                    name: true,
                    org: true,
                    category: true,
                }
            }
        };

        if (user.role === 'ADMIN') {
            const [total, allNominations] = await Promise.all([
                prisma.nominations.count(),
                prisma.nominations.findMany({
                    orderBy: { created_at: 'desc' },
                    skip,
                    take,
                    select: listViewSelect
                })
            ]);

            if (isPaginated) {
                return NextResponse.json({
                    nominations: allNominations,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                });
            }
            return NextResponse.json(allNominations);
        }

        const member = await prisma.members.findUnique({
            where: {
                email: user.email,
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: 'Member profile not found' }, { status: 404 }
            );
        }

        const where = { member_id: member.id };

        const [total, memberNominations] = await Promise.all([
            prisma.nominations.count({ where }),
            prisma.nominations.findMany({
                orderBy: {
                    created_at: 'desc',
                },
                skip,
                take,
                select: listViewSelect
            })
        ]);

        if (isPaginated) {
            return NextResponse.json({
                nominations: memberNominations,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }

        return NextResponse.json(memberNominations);

    } catch (error: any) {
        console.error('Failed to fetch nominations:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message }, { status: 500 }
        );
    }
}
