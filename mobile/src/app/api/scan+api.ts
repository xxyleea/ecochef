import { z } from 'zod';

import { AIError, errorResponse, scanImage } from '@/server/claude';

const Body = z.object({
  mode: z.enum(['receipt', 'haul', 'label']),
  imageBase64: z.string().min(100),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']).default('image/jpeg'),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Claude accepts images up to 5 MB; base64 is ~4/3 of the raw size.
const MAX_BASE64 = Math.floor(5 * 1024 * 1024 * 1.33);

export async function POST(request: Request) {
  try {
    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) throw new AIError(400, 'Invalid scan request.');
    const { imageBase64 } = parsed.data;
    const data = imageBase64.replace(/^data:[^;]+;base64,/, '');
    if (data.length > MAX_BASE64) throw new AIError(413, 'Photo is too large. Try again with a closer, smaller photo.');
    const result = await scanImage({ ...parsed.data, imageBase64: data });
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
