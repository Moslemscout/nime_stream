import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/user?email=xxx
// Returns user profile; auto-creates if first time
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Auto-create profile on first access
    user = await prisma.user.create({
      data: { email },
    });
  }

  // Get comment count (top-level + replies)
  const commentCount = await prisma.comment.count({ where: { userEmail: email } });

  return NextResponse.json({ ...user, commentCount });
}

// PATCH /api/user  — update display name, bio, avatarColor
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { email, displayName, bio, avatarColor } = body;

  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      ...(displayName !== undefined && { displayName: displayName.trim() || null }),
      ...(bio !== undefined && { bio: bio.trim() || null }),
      ...(avatarColor !== undefined && { avatarColor }),
    },
    create: { email, displayName, bio, avatarColor },
  });

  return NextResponse.json(user);
}
