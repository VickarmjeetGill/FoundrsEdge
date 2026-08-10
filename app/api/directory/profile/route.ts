import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, industry, location, description, website, lookingFor, tags } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
        }

        let member = await prisma.members.findUnique({
            where: { email: user.email },
        });

        if (!member) {
            const nameParts = (user.name || 'Member').trim().split(/\s+/);
            const firstName = nameParts[0] || 'Member';
            const lastName = nameParts.slice(1).join(' ') || '';
            member = await prisma.members.create({
                data: {
                    email: user.email,
                    first_name: firstName,
                    last_name: lastName,
                },
            });
        }

        const existingBiz = await prisma.businesses.findFirst({
            where: { member_id: member.id },
        });

        const tagsArray = Array.isArray(tags)
            ? tags
            : typeof tags === 'string'
                ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                : [];

        let business;
        if (existingBiz) {
            business = await prisma.businesses.update({
                where: { id: existingBiz.id },
                data: {
                    business_name: name.trim(),
                    business_desc: description ? description.trim() : null,
                    website: website ? website.trim() : null,
                    business_type: industry || null,
                    geographic_focus: location ? [location.trim()] : [],
                },
            });
        } else {
            business = await prisma.businesses.create({
                data: {
                    member_id: member.id,
                    business_name: name.trim(),
                    business_desc: description ? description.trim() : null,
                    website: website ? website.trim() : null,
                    business_type: industry || null,
                    geographic_focus: location ? [location.trim()] : [],
                    status: 'APPROVED',
                },
            });
        }

        return NextResponse.json({ success: true, business }, { status: 200 });
    } catch (error: any) {
        console.error('Error saving business profile to database:', error);
        return NextResponse.json(
            { error: 'Failed to save business profile', details: error?.message || '' },
            { status: 500 }
        );
    }
}
