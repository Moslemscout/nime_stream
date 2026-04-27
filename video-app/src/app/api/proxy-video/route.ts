import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function extractFileId(input: string): string {
  // Already a clean ID (no slashes or special chars except - and _)
  if (/^[a-zA-Z0-9_-]+$/.test(input)) return input;

  // /file/d/ID/view  or  /d/ID/
  const m1 = input.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];

  // ?id=ID or &id=ID
  const m2 = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];

  return input; // return as-is, best effort
}

/**
 * Google Drive large-file download strategy:
 *
 * 1. Try drive.usercontent.google.com with &confirm=t  (works most of the time for large files)
 * 2. If we still get HTML (virus scan page), extract cookies + confirm token and retry
 * 3. Fall back to classic /uc?export=download with extracted cookie
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawId = searchParams.get('id');

  if (!rawId) {
    return new NextResponse('Missing file ID', { status: 400 });
  }

  const fileId = extractFileId(rawId);
  const range = request.headers.get('range');

  const baseHeaders: Record<string, string> = {
    'User-Agent': UA,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(range ? { Range: range } : {}),
  };

  try {
    // ── Strategy 1: drive.usercontent.google.com ──────────────────────────────
    // This newer endpoint works for most large files without extra confirmation
    const usercontent = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&uuid=${Date.now()}`;

    let response = await fetch(usercontent, {
      headers: baseHeaders,
      redirect: 'follow',
    });

    // ── Strategy 2: Got HTML back → still need confirm bypass ─────────────────
    if (response.headers.get('content-type')?.startsWith('text/html')) {
      const html = await response.text();

      // Extract cookies Google set (needed to validate the confirm request)
      const setCookie = response.headers.get('set-cookie') || '';
      const cookieHeader = setCookie
        .split(',')
        .map(c => c.split(';')[0].trim())
        .join('; ');

      // Extract confirm token from form or URL in the page
      const confirmMatch =
        html.match(/confirm=([a-zA-Z0-9_-]+)/) ||
        html.match(/name="confirm"\s+value="([^"]+)"/) ||
        html.match(/"confirm","([a-zA-Z0-9_-]+)"/);

      // Extract uuid if present
      const uuidMatch = html.match(/uuid=([a-zA-Z0-9_-]+)/);

      // Build retry URL
      let retryUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
      if (confirmMatch) retryUrl += `&confirm=${confirmMatch[1]}`;
      if (uuidMatch) retryUrl += `&uuid=${uuidMatch[1]}`;

      const retryHeaders: Record<string, string> = {
        ...baseHeaders,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      };

      response = await fetch(retryUrl, {
        headers: retryHeaders,
        redirect: 'follow',
      });

      // ── Strategy 3: Fall back to classic uc endpoint with cookies ────────────
      if (response.headers.get('content-type')?.startsWith('text/html')) {
        const classicUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmMatch?.[1] || 't'}`;
        response = await fetch(classicUrl, {
          headers: retryHeaders,
          redirect: 'follow',
        });
      }
    }

    // ── Validate we have a real file now ──────────────────────────────────────
    if (!response.ok && response.status !== 206) {
      console.error(`[proxy-video] Google returned ${response.status} for ${fileId}`);
      return new NextResponse(`Google Drive returned ${response.status}`, {
        status: response.status,
      });
    }

    const ct = response.headers.get('content-type') || '';
    if (ct.startsWith('text/html')) {
      console.error(`[proxy-video] Still receiving HTML for ${fileId} — file may not be publicly shared`);
      return new NextResponse(
        'File cannot be streamed. Make sure the Google Drive file is set to "Anyone with the link" and is publicly accessible.',
        { status: 403 }
      );
    }

    // ── Build response headers ────────────────────────────────────────────────
    const resHeaders = new Headers();

    // Forward useful headers from Google
    for (const h of ['content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
      const v = response.headers.get(h);
      if (v) resHeaders.set(h, v);
    }

    // Force content-type to video/mp4
    resHeaders.set('content-type', 'video/mp4');

    // Seeking support
    resHeaders.set('accept-ranges', 'bytes');

    // Cache for 1 hour to reduce repeated Google Drive hits
    resHeaders.set('cache-control', 'public, max-age=3600');

    return new NextResponse(response.body, {
      status: response.status,  // preserve 206 for range requests
      headers: resHeaders,
    });

  } catch (err) {
    console.error('[proxy-video] Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
