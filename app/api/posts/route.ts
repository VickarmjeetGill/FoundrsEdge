import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateCache } from '@/lib/redis';
import { rateLimit } from '@/lib/rate-limiter';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { validateBody } from '@/lib/validate';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Post content is required' })
  content!: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  authorBusiness?: string;

  @IsOptional()
  @IsString()
  linkedType?: string;

  @IsOptional()
  @IsString()
  linkedTitle?: string;

  @IsOptional()
  @IsString()
  linkedSubtitle?: string;

  @IsOptional()
  @IsString()
  linkedUrl?: string;

  @IsOptional()
  @IsString()
  authorEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = await rateLimit(ip, 20, 60);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Too Many Requests' }, { status: 429 });
    }

    const rawBody = await request.json();
    const { errors, data } = await validateBody(CreatePostDto, rawBody);
    if (errors) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: errors }, { status: 400 });
    }
    const body = data;

    const content = body.content;
    const authorName = body.authorName || 'Member';
    const authorBusiness = body.authorBusiness || null;
    const authorEmail = body.authorEmail?.toLowerCase()?.trim() || null;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Post content is required' },
        { status: 400 }
      );
    }

    const post = await (prisma as any).posts.create({
      data: {
        author_name: authorName,
        author_business: authorBusiness,
        content,
        linked_type: body.linkedType || null,
        linked_title: body.linkedTitle || null,
        linked_subtitle: body.linkedSubtitle || null,
        linked_url: body.linkedUrl || null,
      },
    });

    if (authorEmail) {
      await (prisma as any).post_email_usage.upsert({
        where: {
          email: authorEmail,
        },
        update: {
          post_count: {
            increment: 1,
          },
        },
        create: {
          email: authorEmail,
          post_count: 1,
        },
      });
    }

    await invalidateCache();

    return NextResponse.json(
      {
        success: true,
        message: 'Post created successfully.',
        post,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create post:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to create post', details: error?.message || '' },
      { status: 500 }
    );
  }
}