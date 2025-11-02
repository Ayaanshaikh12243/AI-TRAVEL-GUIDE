# AI Travel Guide

Your personal trip planner with AI-generated itineraries and destination suggestions. Built with Node.js, Express, MongoDB, EJS, and Bootstrap.

## Features
- AI Itinerary generation (Gemini) with robust JSON parsing and multi-model fallback.
- Offline fallback itinerary so planning never blocks if AI is down.
- Suggestions page shows exactly 10 destinations in a modern responsive card grid.
- Rich images per suggestion with multiple fallbacks (Google CSE → Wikipedia → Unsplash → Picsum → inline SVG).
- In-page "New Trip" modal with AJAX submit (no page navigation) and currency selector.
- Authenticated routes with session support and MongoDB persistence.

## Tech Stack
- Server: Node.js, Express, EJS
- DB: MongoDB (Mongoose)
- UI: Bootstrap 5, Icons, vanilla JS
- AI: Google Generative AI (Gemini)
- Images: Google Custom Search (optional), Wikipedia, Unsplash Source, Picsum

## Getting Started
### Prerequisites
- Node.js 18+ (for built-in fetch)
- MongoDB running locally (or provide a remote URI)

### Install
```
npm install
```

### Environment Variables (.env)
Create `c:\ai guide\.env` (already gitignored) with KEY=VALUE lines only (no semicolons, no JS):
```
DB_URL=mongodb://127.0.0.1:27017/aiTravelGuide
SESSION_SECRET=your_secret_here

# Gemini (required for AI output; fallback works without it)
GEMINI_API_KEY=your_google_generative_ai_key

# Google Custom Search (optional, for Google images)
GOOGLE_CSE_API_KEY=your_google_cse_key
GOOGLE_CSE_CX=your_cse_search_engine_id

# Performance toggles (optional)
FAST_SUGGESTIONS=on         # on/off; on = fastest (skips Google/Wikipedia lookups)
GOOGLE_IMAGES=off           # on/off; on = try Google/Wikipedia images with timeouts
```
Notes:
- Do not wrap values in quotes unless necessary; avoid trailing semicolons.
- If you see API_KEY_INVALID or 404 model errors, verify your key and API enablement.

### Enable Google Services (optional but recommended)
- Gemini: In Google Cloud Console, enable "Generative Language API" for your project and create an API key.
- Images: Create a Programmable Search Engine set to "Search the entire web" and enable Image Search. Then enable "Custom Search API" and create an API key. Set `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_CX` in `.env`.

### Run
```
nodemon app.js
# or
node app.js
```
Troubleshooting:
- If you typed `nodmon`, correct to `nodemon`.
- If the server restarts repeatedly, check `.env` syntax and server logs.

## Usage
- Register/Login.
- Click "New Trip" in the navbar to open the in-page modal.
  - Fill destination, dates, interests, style, pace, budget, and currency.
  - Click "Generate My Trip". A success message with a link to the itinerary appears without leaving the page.
- Click "Suggestions" to see 10 destinations with images; click a card to Google-search that destination.

## How images are resolved
1) Google CSE (when `GOOGLE_IMAGES=on` and keys set) with short timeouts
2) Wikipedia thumbnail (no key)
3) Unsplash Source with unique `sig` per card for variety
4) Picsum Photos as secondary fallback
5) Inline SVG placeholder in the template if everything else fails

For maximum speed set `FAST_SUGGESTIONS=on` and `GOOGLE_IMAGES=off`.

## Fallback itinerary
If AI fails or returns malformed JSON, the server synthesizes a valid day-wise itinerary using your dates and preferences so you can proceed without errors.

## Security
- `.env` is in `.gitignore`.
- Never commit API keys.

## Common Issues
- 404/400 from Gemini: Ensure the key is valid and "Generative Language API" is enabled for the same project.
- No images: Provide `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_CX`, or keep FAST mode and rely on Unsplash/Picsum. Network blocks may prevent external CDNs; the UI will show placeholders.
- Slow page loads: Use FAST mode; avoid Google lookups during render.

## Project Structure (partial)
```
api/aiService.js            # AI calls, JSON extraction, fallback itinerary
routes/itineraries.js       # CRUD + AJAX create, currency support
routes/suggestions.js       # Always 10 suggestions, fast image pipeline
models/itinerary.js         # Mongoose schema (stores userInput incl. currency)
views/                      # EJS templates (suggestions grid, modal, etc.)
public/js/script.js         # Modal AJAX logic and UI helpers
```

## Contact
Interested in collaborating or hiring?
- LinkedIn: https://www.linkedin.com/in/ayaan-shaikh-ba4348206/
