import { z } from 'zod';

import { AIError, errorResponse, suggestRecipes } from '@/server/claude';

const Body = z.object({
  inventory: z
    .array(z.object({ name: z.string(), quantity: z.number(), unit: z.string(), daysLeft: z.number() }))
    .max(300),
  request: z.string().max(500).optional(),
  count: z.number().int().min(1).max(5).default(3),
});

export async function POST(request: Request) {
  try {
    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) throw new AIError(400, 'Invalid recipe request.');
    return Response.json(await suggestRecipes(parsed.data));
  } catch (err) {
    return errorResponse(err);
  }
}
