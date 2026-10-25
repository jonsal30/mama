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

## Mi Ventana / My Eating Window
Health Ally now includes a Spanish-first fasting and diabetes-support module designed for gradual, conservative use:
- 7-day baseline logging before 12:12.
- 12:12 -> 14:10 -> optional 16:8 progression; each longer stage unlocks only after 7 stable completions of the prior stage.
- 24+ hour fasting is intentionally not offered without a specific clinician plan.
- Fasting timer explicitly tells Mom when she can eat and reminds her that extending the fast is unnecessary.
- Daily medication acknowledgements for the currently documented core regimen, with short-course/historical medications kept separate pending reconciliation.
- Context-aware glucose, blood pressure, weight, ketone, and symptom logging.
- Safety overrides prioritize low glucose and concerning cardiopulmonary/neurologic symptoms over the timer.
- Food suggestions use a simple plate model and familiar meal ideas rather than restrictive "diet food."
- Metabolic-phase education is approximate; the app does not claim an exact human autophagy activation time.
- App notifications work when supported by the installed PWA. A one-tap Calendar alarm is included because iPhone can deliver it reliably when the web app is closed without requiring a push backend.

### Data boundary
Mi Ventana data remains local to the browser in this static GitHub Pages build. Export creates a JSON file for backup or clinician review. There is currently no automatic Google Drive write from the PWA; adding that safely requires an authenticated endpoint or an Apps Script/Web API bridge.

## Mi Ventana backend (Web Push + sync queue)

Health Ally now has an optional Cloudflare Worker backend in `backend/worker`.

- **Web Push:** stores a single paired iPhone push subscription and schedules fasting-end reminders.
- **Persistent acknowledgement:** fasting-end alerts can repeat until the user acknowledges them in Health Ally.
- **D1 queue:** health readings, medication acknowledgements, fast start/end events, and push acknowledgements are retained server-side for resilient sync.
- **Google Sheet bridge:** queued events are designed to sync to the existing longitudinal `Mom Health & Sleep Symptom Log`. The bridge URL is intentionally configurable and can remain blank without losing queued events.
- **Secrets:** VAPID private keys, the one-time pairing code, and bridge secrets live in Cloudflare secrets, never in this repository.

### iPhone setup
On iPhone/iPad, install Health Ally to the Home Screen, open it from the Home Screen icon, tap **Activar avisos fuertes**, enter the one-time pairing code, and allow notifications. After successful pairing, the backend closes pairing automatically.

### Safety behavior
Push reminders never tell the user to change medication doses. A completed fasting target explicitly says the user may eat and does not reward extending the fast. The fasting safety rules in the PWA override the timer for concerning glucose or symptoms.
