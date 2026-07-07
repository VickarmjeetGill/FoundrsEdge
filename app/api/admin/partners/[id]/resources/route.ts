import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// POST /api/admin/partners/:id/resources — admin adds a resource on behalf of a partner. (task 4)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { id } = await params;
        const data = await request.json();

        const partner = await prisma.partners.findUnique({ where: { id } });
        if (!partner) {
            return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        if (!data.title || !String(data.title).trim()) {
            return NextResponse.json({ error: 'Resource title is required.' }, { status: 400 });
        }
        if (!data.category || !String(data.category).trim()) {
            return NextResponse.json({ error: 'Resource category is required.' }, { status: 400 });
        }

        const resource = await prisma.resources.create({
            data: {
                partner_id: id,
                title: String(data.title).trim(),
                description: data.description || null,
                url: data.url || null,
                category: String(data.category).trim(),
                tags: Array.isArray(data.tags) ? data.tags : [],
                featured: !!data.featured,
                status: data.status || 'PUBLISHED',
            },
        });

        return NextResponse.json({ success: true, resource }, { status: 201 });
    } catch (error) {
        console.error('Partner resource creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
