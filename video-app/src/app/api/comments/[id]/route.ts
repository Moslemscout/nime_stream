import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/comments/[id] - toggle approved
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const body = await request.json();
  const { approved } = body;

  const comment = await prisma.comment.update({
    where: { id },
    data: { approved },
  });

  return NextResponse.json(comment);
}

// DELETE /api/comments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
