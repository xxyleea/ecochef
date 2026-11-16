# EcoChef (mobile)

AI-native food inventory for Hong Kong households. Product spec: [../PRODUCT.md](../PRODUCT.md).

## Run it

```bash
npm install
cp .env.example .env    # then put your key in ANTHROPIC_API_KEY
npx expo start          # press w for web, or scan the QR with Expo Go
```

Without a key, everything except the AI features works (use "Load sample groceries" on Home to try it).

## How it fits together

| Area | Where |
|---|---|
| Screens (Expo Router) | `src/app/(tabs)/` — Home, Pantry, Scan, Cook, Impact; modals: `review`, `item/[id]`, `add`, `chat`, `settings` |
| AI endpoints (server only, hold the API key) | `src/app/api/{scan,recipes,chat}+api.ts` → `src/server/claude.ts` |
| Inventory state (local-first, persisted) | `src/lib/store.ts` (Zustand + AsyncStorage) |
| App → server calls | `src/lib/api.ts` |
| Expiry reminders | `src/lib/notifications.ts` (local notifications, 9am the day before) |
| EN / 繁中 strings | `src/lib/i18n.ts` |

AI uses Claude (`claude-opus-5-5`) with structured outputs: one photo → a typed list of items with expiry dates, which the user reviews before saving.

## Production notes
- API routes run on the Expo dev server locally. For a phone build, deploy them (e.g. `npx eas-cli deploy`) and set `EXPO_PUBLIC_API_URL` to that origin.
- Notifications and the camera need a real device; on web, scanning uses file upload and reminders are off.
