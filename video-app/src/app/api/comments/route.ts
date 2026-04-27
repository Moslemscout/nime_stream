import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/comments?videoId=xxx&episodeId=yyy
// Returns only top-level comments with their approved replies nested
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const videoId = searchParams.get('videoId');
  const episodeId = searchParams.get('episodeId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: {
      videoId,
      ...(episodeId ? { episodeId } : {}),
      parentId: null,   // only top-level comments
      approved: true,
    },
    orderBy: { createdAt: 'asc' },
    include: {
      replies: {
        where: { approved: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return NextResponse.json(comments);
}

// POST /api/comments
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { content, userEmail, videoId, episodeId, parentId } = body;

  if (!content || !userEmail || !videoId) {
    return NextResponse.json(
      { error: 'content, userEmail, and videoId are required' },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // If reply, verify parent exists and belongs to the same video
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.videoId !== videoId) {
      return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
    }
    // Replies cannot be more than 1 level deep (no reply-to-reply)
    if (parent.parentId !== null) {
      return NextResponse.json({ error: 'Cannot reply to a reply' }, { status: 400 });
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      userEmail,
      videoId,
      episodeId: episodeId || null,
      parentId: parentId || null,
      approved: true,
    },
    include: {
      replies: true,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
