import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export const revalidate = 0;

export default async function DashboardPage() {
  const videos = await prisma.video.findMany({
    include: { episodes: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return <DashboardClient videos={videos} />;
}
