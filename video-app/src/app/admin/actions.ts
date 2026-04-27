'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const formatDriveUrl = (url: string, type: 'video' | 'image' = 'video') => {
  if (!url) return null;
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/(.+?)\/(view|edit)/) || url.match(/id=(.+?)(&|$)/);
    const fileId = match ? match[1] : null;
    if (fileId) {
      if (type === 'image') {
        // Thumbnail API is much better for <img> tags
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
      }
      // For video, we use the direct link but ensure it's handled correctly in the UI
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  return url;
};

export async function addVideo(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const categoriesList = formData.getAll('categories') as string[];
  const categories = categoriesList.join(', ');
  const thumbnail = formatDriveUrl(formData.get('thumbnail') as string, 'image') || '';

  await prisma.video.create({
    data: {
      title,
      description,
      categories: categories || "General",
      thumbnail
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function updateVideo(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const categoriesList = formData.getAll('categories') as string[];
  const categories = categoriesList.join(', ');
  const thumbnail = formatDriveUrl(formData.get('thumbnail') as string, 'image') || '';

  await prisma.video.update({
    where: { id },
    data: {
      title,
      description,
      categories: categories || "General",
      thumbnail
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function addEpisode(videoId: string, formData: FormData) {
  const number = parseInt(formData.get('number') as string);
  const title = formData.get('title') as string;
  const url480 = formatDriveUrl(formData.get('url480') as string, 'video');
  const url720 = formatDriveUrl(formData.get('url720') as string, 'video');
  const url1080 = formatDriveUrl(formData.get('url1080') as string, 'video');

  await prisma.episode.create({
    data: {
      number,
      title,
      url480,
      url720,
      url1080,
      videoId
    }
  });

  revalidatePath(`/watch/${videoId}`);
  revalidatePath('/admin');
}

export async function deleteEpisode(id: string) {
  const ep = await prisma.episode.delete({
    where: { id }
  });

  revalidatePath(`/watch/${ep.videoId}`);
  revalidatePath('/admin');
}

export async function deleteVideo(id: string) {
  await prisma.video.delete({
    where: { id }
  });

  revalidatePath('/');
  revalidatePath('/admin');
}
