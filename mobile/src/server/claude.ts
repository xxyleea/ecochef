// SERVER ONLY. Import this module from `+api.ts` route files only, never from screens,
// so the API key and prompts stay out of the app bundle.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

export const MODEL = 'claude-opus-5-5';
const BETAS = ['server-side-fallback-2026-07-01'];

let client: Anthropic | null = null;
export function getClient(): Anthropic {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from the server environment
  return client;
}

export class AIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Map SDK / model failures to a JSON error response the app can show. */
export function errorResponse(err: unknown): Response {
  if (err instanceof AIError) return Response.json({ error: err.message }, { status: err.status });
  if (err instanceof Anthropic.AuthenticationError)
    return Response.json({ error: 'Server is missing a valid ANTHROPIC_API_KEY.' }, { status: 500 });
  if (err instanceof Anthropic.RateLimitError)
    return Response.json({ error: 'EcoChef is busy, try again in a moment.' }, { status: 429 });
  if (err instanceof Anthropic.BadRequestError)
    return Response.json({ error: `AI request rejected: ${err.message}` }, { status: 400 });
  if (err instanceof Anthropic.APIConnectionError)
    return Response.json({ error: 'Could not reach the AI service.' }, { status: 502 });
  if (err instanceof Anthropic.APIError)
    return Response.json({ error: `AI service error (${err.status ?? 'unknown'}).` }, { status: 502 });
  if (err instanceof Error && /api key|apiKey|authentication/i.test(err.message))
    return Response.json({ error: 'Server is missing ANTHROPIC_API_KEY.' }, { status: 500 });
  console.error(err);
  return Response.json({ error: 'Something went wrong.' }, { status: 500 });
}

function assertNotRefused(stopReason: string | null) {
  if (stopReason === 'refusal') throw new AIError(422, 'The AI declined this request.');
  if (stopReason === 'max_tokens') throw new AIError(502, 'The AI response was cut off. Try again.');
}

// ---------- Shared schema pieces ----------

const CategoryEnum = z.enum([
  'produce',
  'meat',
  'seafood',
  'dairy',
  'eggs',
  'tofu',
  'bakery',
  'grains',
  'condiments',
  'snacks',
  'drinks',
  'frozen',
  'other',
]);
const StorageEnum = z.enum(['fridge', 'freezer', 'pantry']);

// ---------- Scan (receipt / haul / label) ----------

const ScanSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe('Plain English generic name, e.g. "Choy sum", "Fresh milk"'),
      nameZh: z.string().describe('Traditional Chinese name as used in Hong Kong'),
      category: CategoryEnum,
      quantity: z.number(),
      unit: z.string().describe('pcs, g, kg, ml, L, pack, bunch, bottle, box, etc.'),
      storage: StorageEnum.describe('Where it should be stored to last longest'),
      expiresAt: z.string().describe('yyyy-mm-dd'),
      expirySource: z.enum(['label', 'estimate']),
      confidence: z.number().describe('0 to 1 confidence in the expiry date'),
      priceHKD: z.number().nullable(),
      storageTip: z.string().describe('One short practical tip to make it last longer'),
    }),
  ),
  notes: z.string().nullable().describe('Anything the user should double-check, or null'),
});
export type ScanResult = z.infer<typeof ScanSchema>;

const SCAN_SYSTEM = `You are the food-recognition engine of EcoChef, a Hong Kong food-inventory app that helps households stop wasting food.
You turn one photo into a list of food items for the user's inventory. The user reviews your list before anything is saved, so be useful rather than timid, and flag doubts in "notes".

General rules:
- Only food and drink. Skip bags, household goods, discounts, deposits, subtotals, payment lines, and points.
- Use plain generic English names a home cook would recognise ("Pork belly", "Choy sum", "Eggs"), not brand codes, plus the usual Hong Kong Traditional Chinese name.
- Merge duplicate lines of the same product into one item with the combined quantity.
- "storage" is where the item should go to last longest once home (e.g. fresh meat → fridge unless the user would plausibly freeze it; bread → pantry).
- Expiry: if a date is printed and legible, use it with expirySource "label". Otherwise estimate from today's date assuming the item was bought today, is fresh, and is kept in the chosen storage in Hong Kong's warm, humid climate; set expirySource "estimate" and an honest confidence. Wet-market produce and meat spoil faster than supermarket packaged goods.
- Dates are yyyy-mm-dd. Hong Kong labels are usually DD/MM/YYYY; Japanese and some imported goods use YYYY.MM.DD; US goods use MM/DD. Pick the reading that gives a sensible future date and mention ambiguity in notes.
- priceHKD is the line price in HKD when visible, else null.`;

const MODE_INSTRUCTIONS: Record<'receipt' | 'haul' | 'label', string> = {
  receipt:
    'The photo is a shopping receipt (likely a Hong Kong supermarket such as Wellcome, PARKnSHOP, Market Place, AEON, YATA, or a wet-market stall). Decode abbreviated product names (e.g. "AUST BF RIBEYE", "VITASOY CAL", "NZ KIWI GRN") into real foods. Use quantities and prices from the receipt.',
  haul: 'The photo shows groceries laid out after shopping, possibly including unpackaged wet-market produce, meat, or seafood. List every distinct food item you can see and count units where countable; estimate weight for loose items.',
  label:
    'The photo is a close-up of a product package. Identify the product and read its printed best-before / use-by / expiry date. Usually this is a single item.',
};

export async function scanImage(args: {
  mode: 'receipt' | 'haul' | 'label';
  imageBase64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  today: string;
}): Promise<ScanResult> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaZodOutputFormat(ScanSchema) },
    system: SCAN_SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: args.mediaType, data: args.imageBase64 } },
          { type: 'text', text: `Today is ${args.today}.\n${MODE_INSTRUCTIONS[args.mode]}` },
        ],
      },
    ],
  });
  assertNotRefused(response.stop_reason);
  if (!response.parsed_output) throw new AIError(502, 'Could not read that photo. Try a clearer shot.');
  return response.parsed_output;
}

// ---------- Recipes ----------

const RecipesSchema = z.object({
  recipes: z.array(
    z.object({
      title: z.string(),
      titleZh: z.string(),
      minutes: z.number(),
      servings: z.number(),
      uses: z.array(z.string()).describe('Exact inventory item names this recipe uses'),
      missing: z.array(z.string()).describe('Ingredients the user probably needs to buy; pantry staples excluded'),
      steps: z.array(z.string()),
      why: z.string().describe('One sentence: which expiring items this rescues'),
    }),
  ),
});
export type RecipesResult = z.infer<typeof RecipesSchema>;

const RECIPES_SYSTEM = `You are EcoChef's recipe planner for Hong Kong home kitchens. Your goal is to use up food before it expires.
- Build recipes around the items that expire soonest; each recipe should rescue at least one item expiring within 3 days when any exist.
- Assume a typical HK kitchen: wok, one or two gas/induction burners, rice cooker, maybe a microwave or air fryer, usually no oven.
- Assume basic staples are available: rice, oil, salt, sugar, soy sauce, oyster sauce, garlic, ginger, spring onion, cornstarch, eggs only if listed.
- Favour realistic home cooking (Cantonese, other Asian, and simple Western) over restaurant dishes. Keep steps short and concrete.
- "uses" must contain inventory names exactly as given. "missing" lists only things not in inventory and not basic staples.
- Write English content in the English fields and give a natural Traditional Chinese dish name in titleZh.`;

export async function suggestRecipes(args: {
  inventory: { name: string; quantity: number; unit: string; daysLeft: number }[];
  request?: string;
  count: number;
}): Promise<RecipesResult> {
  const lines = args.inventory
    .slice()
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map((i) => `- ${i.name} — ${i.quantity} ${i.unit} — ${i.daysLeft < 0 ? 'expired' : `${i.daysLeft} days left`}`)
    .join('\n');
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaZodOutputFormat(RecipesSchema) },
    system: RECIPES_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `My inventory (soonest-expiring first):\n${lines || '(empty)'}\n\nSuggest ${args.count} recipes.${
          args.request ? `\nMy request: ${args.request}` : ''
        }`,
      },
    ],
  });
  assertNotRefused(response.stop_reason);
  if (!response.parsed_output) throw new AIError(502, 'Could not generate recipes. Try again.');
  return response.parsed_output;
}

// ---------- Chat ----------

const CHAT_SYSTEM = `You are EcoChef, a friendly kitchen assistant in a Hong Kong food-waste app.
You help the user cook with what they have, store food so it lasts, judge whether food is still OK, and waste less.
- Reply in the language the user writes in (English, Cantonese / Traditional Chinese, or a mix).
- Be brief and practical: a few short sentences or a short list. This is a phone chat.
- Prefer ingredients from the user's inventory, especially ones expiring soon.
- On food safety, be honest and conservative: if something might be unsafe (mould on soft food, off smell, slimy meat, swollen cans), say to throw it out.
- Use plain text; simple "-" bullets are fine. No markdown headings or tables.`;

export async function chat(args: {
  messages: { role: 'user' | 'assistant'; text: string }[];
  inventorySummary: string;
  today: string;
}): Promise<string> {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: BETAS,
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: CHAT_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Context (not from the user): today is ${args.today}. Current inventory:\n${args.inventorySummary || '(empty)'}`,
      },
      { role: 'assistant', content: 'Got it — I have your inventory.' },
      ...args.messages.map((m) => ({ role: m.role, content: m.text })),
    ],
  });
  assertNotRefused(response.stop_reason);
  const text = response.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim();
  if (!text) throw new AIError(502, 'No reply. Try again.');
  return text;
}

// ---------- Freshness check (multi-photo condition estimate) ----------

const FreshnessSchema = z.object({
  itemName: z.string().describe('Plain English generic name of the food shown'),
  itemNameZh: z.string().describe('Traditional Chinese name'),
  condition: z.enum(['fresh', 'use_soon', 'discard', 'unsure']),
  daysLeftMin: z.number().describe('Earliest days still good to eat, 0 = use today'),
  daysLeftMax: z.number().describe('Latest days still good to eat, 0 = use today'),
  confidence: z.enum(['low', 'medium', 'high']),
  visibleSigns: z.array(z.string()).describe('Specific things you can see that affect freshness, e.g. "browning on the cut end", "soft spot on one side", or [] if none'),
  highRisk: z.boolean().describe('True for meat, seafood, dairy, eggs, tofu, cooked food, or anything where spoilage bacteria are a risk without visible change'),
  safetyNote: z.string().describe('One short note the user should read, or empty string'),
  advice: z.string().describe('One practical sentence: what to do now (eat today, cook soon, freeze, or bin)'),
});
export type FreshnessResult = z.infer<typeof FreshnessSchema>;

const FRESHNESS_SYSTEM = `You judge how fresh one food item is from several photos of it, for EcoChef, a Hong Kong food-waste app. Users decide whether to eat food based on your answer, so be conservative and honest.

Rules:
- Use every photo. The photos show different angles; check the underside, cut ends, stems, bottoms of packs and any dark or hidden parts.
- Only report what is visible. Name specific signs (colour, texture, shape, mould, slime, sprouting, swelling, leaks, drying out, wilting). Do not guess at smell or taste.
- Visible mould, slime, sprouting, swelling, leaks or off colour that looks like rot mean condition "discard" and 0 days.
- Photos cannot show bacterial spoilage. For meat, seafood, dairy, eggs, tofu and cooked food set highRisk true, never say "fresh", and write a safetyNote telling the user to smell and check texture before eating.
- Days: give a realistic range for Hong Kong's warm, humid climate, based on the item, how it is stored, and what the photos show. Wet-market produce and meat spoil faster than packaged supermarket goods. If the item is not yet visibly ripe or old, do not invent spoilage.
- If the photos are blurry, or the item cannot be identified, set condition "unsure", confidence "low", and ask for a clearer photo in advice.
- Keep every string short and plain. No markdown.`;

export async function checkFreshness(args: {
  category: string;
  storage: string;
  nameHint?: string;
  daysSinceAdded?: number;
  today: string;
  photos: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }[];
}): Promise<FreshnessResult> {
  const context = [
    `Today is ${args.today}.`,
    `Category (from the app): ${args.category}.`,
    `Stored in: ${args.storage}.`,
    args.nameHint ? `The user calls it: ${args.nameHint}.` : '',
    args.daysSinceAdded !== undefined ? `It was added ${args.daysSinceAdded} day(s) ago.` : '',
    `Photos: ${args.photos.length}, from different angles.`,
  ]
    .filter(Boolean)
    .join(' ');

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    betas: BETAS,
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaZodOutputFormat(FreshnessSchema) },
    system: FRESHNESS_SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          ...args.photos.map((p) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: p.mediaType, data: p.base64 },
          })),
          { type: 'text', text: context },
        ],
      },
    ],
  });
  assertNotRefused(response.stop_reason);
  if (!response.parsed_output) throw new AIError(502, 'Could not judge that item. Try clearer photos.');
  return response.parsed_output;
}
