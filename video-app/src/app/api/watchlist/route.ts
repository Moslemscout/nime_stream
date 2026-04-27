import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/watchlist?email=xxx
// Returns: { lists: string[], items: { videoId, listName }[] }
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const items = await prisma.watchlist.findMany({
    where: { userEmail: email },
    select: { videoId: true, listName: true },
    orderBy: { createdAt: 'asc' },
  });

  // Unique list names
  const lists = [...new Set(items.map((i: { videoId: string; listName: string }) => i.listName))];

  return NextResponse.json({ lists, items });
}

// POST /api/watchlist — add video to a named list
export async function POST(request: NextRequest) {
  const { email, videoId, listName = 'Default' } = await request.json();
  if (!email || !videoId) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  const name = listName.trim() || 'Default';

  const item = await prisma.watchlist.upsert({
    where: { userEmail_videoId_listName: { userEmail: email, videoId, listName: name } },
    create: { userEmail: email, videoId, listName: name },
    update: {},
  });

  return NextResponse.json(item, { status: 201 });
}

// DELETE /api/watchlist — remove video from a named list (or all lists)
export async function DELETE(request: NextRequest) {
  const { email, videoId, listName } = await request.json();
  if (!email || !videoId) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  if (listName) {
    // Remove from specific list
    await prisma.watchlist.deleteMany({
      where: { userEmail: email, videoId, listName },
    });
  } else {
    // Remove from ALL lists
    await prisma.watchlist.deleteMany({
      where: { userEmail: email, videoId },
    });
  }

  return NextResponse.json({ ok: true });
}
