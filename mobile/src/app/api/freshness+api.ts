import { z } from 'zod';

import { applyRules, type FreshnessVerdict } from '@/lib/freshness';
import { AIError, checkFreshness, errorResponse } from '@/server/claude';

const Photo = z.object({
  base64: z.string().min(100),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']).default('image/jpeg'),
});

const Body = z.object({
  category: z.string().max(30),
  storage: z.enum(['fridge', 'freezer', 'pantry']),
  nameHint: z.string().max(80).optional(),
  daysSinceAdded: z.number().int().min(0).max(3650).optional(),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  photos: z.array(Photo).min(1).max(5),
});

// Claude accepts images up to 5 MB each; base64 is ~4/3 of the raw size.
const MAX_BASE64 = Math.floor(5 * 1024 * 1024 * 1.33);

export async function POST(request: Request) {
  try {
    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) throw new AIError(400, 'Invalid freshness request.');
    const photos = parsed.data.photos.map((p) => ({
      mediaType: p.mediaType,
      base64: p.base64.replace(/^data:[^;]+;base64,/, ''),
    }));
    if (photos.some((p) => p.base64.length > MAX_BASE64))
      throw new AIError(413, 'One of the photos is too large. Retake it closer or smaller.');

    const raw = await checkFreshness({ ...parsed.data, photos });
    // Hard safety rules run on the server, after the model, so they can't be skipped.
    const verdict: FreshnessVerdict = applyRules(
      {
        condition: raw.condition,
        daysLeftMin: raw.daysLeftMin,
        daysLeftMax: raw.daysLeftMax,
        confidence: raw.confidence,
        visibleSigns: raw.visibleSigns,
        highRisk: raw.highRisk,
        safetyNote: raw.safetyNote,
        advice: raw.advice,
      },
      parsed.data.category as Parameters<typeof applyRules>[1],
    );
    return Response.json({ ...verdict, itemName: raw.itemName, itemNameZh: raw.itemNameZh });
  } catch (err) {
    return errorResponse(err);
  }
}
