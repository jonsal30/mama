# My Health Ally

A mobile-first, bilingual health education and symptom-tracking PWA for Mom.

## Goals
- Reduce anxiety by keeping medication and supplement information in one calm place.
- Help distinguish **established**, **supportive**, **preliminary**, and **insufficient** evidence.
- Provide a "Before I try this..." workflow that builds a safety-focused prompt and opens Google AI Mode.
- Keep symptom logs and reminder data local to the device.
- Be installable on iPhone Home Screen from Safari.

## Important safety design
The app intentionally does **not** activate a medication schedule. The medication list is marked for reconciliation with the health team. Cetirizine is labeled "prescribed / not started" based on the source conversation. Reminders should only be created after the clinician/pharmacist confirms timing.

## Data / privacy
Logs and reminders use `localStorage` in the browser. They are not uploaded to GitHub. The AI-search feature sends the user's question to Google when the user taps the button.

## iPhone notifications
The app can request browser notifications and notify while active. True server-scheduled background Web Push requires a push backend and VAPID keys, which are intentionally not included in this static GitHub Pages version. The app includes a one-tap `.ics` Calendar reminder export as a reliable no-backend alternative.

## Sources used for the evidence architecture
- AAAAI/ACAAI Rhinitis 2020 practice parameter
- FDA drug/OTC labeling
- MedlinePlus drug information
- NIH/NCCIH seasonal allergy and complementary-health summaries

## Files
- `index.html` — app
- `manifest.webmanifest` — PWA metadata
- `sw.js` — offline cache shell
- `app-icon.svg` — install icon
- `beauty.html` — preserved original beauty-routine page
