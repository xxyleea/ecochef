# EcoChef — Product Spec (v1, AI-native rebuild)

_Last updated: 2026-11-16. Replaces the 2024 "Foodflow" deck and Figma (YOLO11 + forum design)._

## One line
Snap a photo; EcoChef knows what food you have, when it goes bad, and what to cook before it does.

## Who it's for
Hong Kong households — the person who does the shopping and cooking (often a domestic helper or a parent).
Mixed shopping (wet market + supermarket), small high-rise kitchens, no composting. Bilingual UI: English + 繁體中文.

## Core loop
**Capture → Stock → Use it up → Measure**

### 1. Capture (no typing)
| Mode | Input | What the AI returns |
|---|---|---|
| Receipt | Photo of a supermarket receipt (Wellcome, PARKnSHOP, etc., EN/中文, abbreviated SKUs) | Clean item names, quantity, price, category, estimated expiry |
| Grocery haul | Photo of groceries on the counter, incl. wet-market items with no packaging | Every item detected, quantity, category, estimated expiry |
| Expiry label | Close-up of a package's best-before / use-by date | Product name + the printed date (expirySource = `label`, high confidence) |
| Manual | Type a name | AI-free fallback with default shelf life |

Every capture goes to a **review screen** before saving — the user can fix names, dates, quantity, storage location, or drop items. The AI never writes straight to inventory.

### 2. Stock (the "fridge inventory")
A running list of what the user has. Each item:
- name (EN + 中文), category, quantity + unit, storage (fridge / freezer / pantry)
- expiry date + where it came from (`label` printed date, `estimate` AI guess, `manual`)
- price (if from a receipt)
Sorted by "use soonest". Status colours: expired / today / ≤3 days / fine.
Actions: **Used**, **Used some**, **Tossed**, **Edit**, **Move to freezer** (re-estimates expiry).

### 3. Use it up
- **Recipes from what's expiring** — AI generates 3 recipes that prioritise the soonest-expiring items, HK-kitchen friendly (wok, rice cooker, no oven assumed), shows what's missing.
- **Ask EcoChef** — chat assistant that sees the current inventory ("what can I make in 20 min?", "can I freeze tofu?", "how do I keep 菜心 fresh longer?").
- **Expiry alerts** — local push notification the morning before an item expires.

### 4. Measure
Impact screen: items used vs tossed, use-rate %, HKD of food saved, estimated CO₂e avoided, streak.

## Cut from the 2024 version (deliberately)
Forum, private messages, social feed, custom YOLO11 model (replaced by a multimodal LLM — no training data needed, reads text + Chinese labels).
Parked for later: food donation / food-bank map, household sharing, barcode scan, fridge-photo diff, membership/paywall.

## Tech
- **App:** Expo (SDK 58) + Expo Router, TypeScript, iOS + Android (+ web for demos).
- **AI:** Claude (`claude-opus-5-5`) via Expo Router API routes (`src/app/api/*+api.ts`) so the API key never ships in the app. Structured outputs (Zod) for scans and recipes.
- **Data:** local-first (AsyncStorage via a Zustand store). Designed so a sync backend (e.g. Supabase) can be added later without changing screens.
- **Notifications:** expo-notifications local scheduling.

## Open decisions
- Real launch vs demo: built local-first so both work; accounts + cloud sync is the next step if launching.
- Monetisation (membership in the old deck) — not in v1.
