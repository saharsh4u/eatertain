# Eatertain Web MVP

Context-first recommendation app for mealtime viewing.

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Local JSON seed dataset for food modes + content items
- API routes for recommendations and event capture

## Features

- Marketing landing page with value proposition and waitlist section
- `/app` picker flow: food mode + energy + optional platform
- `/app/results` flow: 3 ranked picks, rationale, regenerate, feedback, and share card
- `POST /api/recommend` recommendation engine based on mealtime constraints
- `POST /api/event` analytics event ingestion (in-memory)
- `GET /api/food-modes` available input modes

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

## Data files

- `src/data/food-modes.json`
- `src/data/content-items.json`

## Notes

- Event storage in this MVP is process-memory only and resets on server restart.
- Recommendations are deterministic enough for demo, with slight score jitter to avoid repeats.
