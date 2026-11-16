import { z } from 'zod';

import { AIError, chat, errorResponse } from '@/server/claude';

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().min(1).max(4000) }))
    .min(1)
    .max(40),
  inventorySummary: z.string().max(20000),
  today: z.string(),
});

export async function POST(request: Request) {
  try {
    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) throw new AIError(400, 'Invalid chat request.');
    const msgs = parsed.data.messages;
    if (msgs[msgs.length - 1].role !== 'user') throw new AIError(400, 'Last message must be from the user.');
    const reply = await chat(parsed.data);
    return Response.json({ reply });
  } catch (err) {
    return errorResponse(err);
  }
}
