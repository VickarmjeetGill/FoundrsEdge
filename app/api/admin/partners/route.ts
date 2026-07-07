import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    if (user.role !== 'ADMIN') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    return { user };
}

// GET /api/admin/partners — admin list of all partners (any status).
export async function GET() {
    const gate = await requireAdmin();
    if (gate.error) return gate.error;
    try {
        const partners = await prisma.partners.findMany({
            orderBy: { created_at: 'desc' },
            include: { _count: { select: { resources: true } } },
        });
        return NextResponse.json({ success: true, partners });
    } catch (error) {
        console.error('Admin partners fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/partners — admin creates a partner profile. (task 5)
export async function POST(request: Request) {
    const gate = await requireAdmin();
    if (gate.error) return gate.error;
    try {
        const data = await request.json();

        if (!data.name || !String(data.name).trim()) {
            return NextResponse.json({ error: 'Partner name is required.' }, { status: 400 });
        }

        const partner = await prisma.partners.create({
            data: {
                name: String(data.name).trim(),
                description: data.description || null,
                website: data.website || null,
                logo_url: data.logoUrl || null,
                category: data.category || null,
                contact_email: data.contactEmail || null,
                status: data.status || 'ACTIVE',
                featured: !!data.featured,
            },
        });

        return NextResponse.json({ success: true, partner }, { status: 201 });
    } catch (error) {
        console.error('Partner creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
