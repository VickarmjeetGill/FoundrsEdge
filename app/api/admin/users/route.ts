import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                {
                    error: 'Unauthorized'
                },
                {
                    status: 401
                }
            );
        }

        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden, you don't have permission." },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab');
        const search = searchParams.get('search');

        const isPaginated = searchParams.has('page');
        const page = isPaginated ? Math.max(1, parseInt(searchParams.get('page') || '1', 10)) : 1;
        const limit = isPaginated ? Math.max(1, parseInt(searchParams.get('limit') || '10', 10)) : 10;
        const skip = isPaginated ? (page - 1) * limit : undefined;
        const take = isPaginated ? limit : undefined;

        const where: any = {};
        if (tab === 'Admins') {
            where.role = 'ADMIN';
            where.status = { not: 'DEACTIVATED' };
        } else if (tab === 'Members') {
            where.role = 'MEMBER';
            where.status = { not: 'DEACTIVATED' };
        } else if (tab === 'Suspended') {
            where.status = 'DEACTIVATED';
        } else {
            where.status = { not: 'DEACTIVATED' };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [total, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    avatarUrl: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take
            })
        ]);

        const userEmails = users.map((user) => user.email);

        const associatedMembers = await prisma.members.findMany({
            where: {
                email: {
                    in: userEmails,
                },
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                stage: true,
                industry: true,
                businesses: {
                    select: {
                        id: true,
                        business_name: true,
                    },
                },
            },
        });

        const combinedUserData = users.map((user) => {
            const memberProfile = associatedMembers.find((m) => m.email === user.email);

            return {
                ...user,
                memberProfile: memberProfile || null,
            };
        });

        if (isPaginated) {
            return NextResponse.json({
                users: combinedUserData,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }, { status: 200 });
        }

        return NextResponse.json(combinedUserData, { status: 200 });
    } catch (error) {
        console.error('Error fetching admin users list:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}