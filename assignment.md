Take‑Home Assignment: Baby Growth Chart Tracker
Goal
Build a production‑quality React Native (TypeScript) mini‑app that lets a parent log a baby’s growth measurements (weight, length/height, head circumference) and visualize them against WHO/CDC percentile curves. This evaluates your product thinking, form handling, data modeling, numerical calculations, visualization, accessibility, and mobile UX craft.

Timeline & Effort
Time limit: 48 hours from when you receive this brief
Important: We must be able to run your app and see a demo video of the working features.

What You’ll Build (Scope)
A single‑screen or small multi‑screen RN app with:
Measurement Input (add/edit/delete) with validation and unit conversion.


Data Persistence (local only) with durable IDs and basic migrations.


Growth Charts rendering at least weight‑for‑age percentiles vs. baby data.


History View that lists past entries with calculated percentiles.

Technical Requirements
Framework: React Native. You may use Expo or RN CLI. If Expo, pin SDK in app.json/package.json and include eas.json if applicable.
Charts: Any reputable RN charting library (e.g., Victory Native, react‑native‑chart‑kit, react‑native-svg-charts). Justify the choice in the README.
Storage: @react-native-async-storage/async-storage (or Expo Secure Store for bonus encryption). Handle JSON parsing errors gracefully.
State: Your choice (React state, Context, Zustand, Redux Toolkit). Keep it simple and typed.
Date/time: Use dayjs or date-fns (avoid moment). Be explicit about timezones.
Form: Use react-hook-form or your own — but include robust validation and error messaging.
Lint/Test: ESLint + Prettier; Jest for unit tests on critical calculations.


No runtime network calls — bundle any reference data locally.

Reference Data & Assets 
You may obtain the growth reference tables from reputable public sources and include them locally in your repo (no runtime network calls). In your README, cite the exact links used and your import/processing steps.
WHO growth references (preferred): Obtain weight‑for‑age (0–24 months), by sex, including LMS parameters or precomputed percentiles. Convert to a compact JSON you can ship with the app. Clearly document whether you used LMS (with Z‑score → percentile) or direct percentile interpolation.


Baby profile: Create your own mock BabyProfile (name, birthDate, gender). Do not rely on provided files.


Age helper: Implement your own age‑in‑days helper (or use a date lib). Include unit tests.

Data Model (use or extend)
export interface GrowthMeasurement {
  id: string;
  date: string;               // ISO date string (UTC 00:00)
  ageInDays: number;          // derived from birthDate -> date
  weightKg: number;           // stored in SI units
  heightCm: number;           // stored in SI units
  headCm: number;             // stored in SI units
  weightPercentile?: number;  // 0–100
  heightPercentile?: number;
  headPercentile?: number;
}

export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string;          // ISO date string
  gender: 'male' | 'female';
}
Design choices:
Normalize inputs to SI units for storage; convert for display.


Persist a schema version to enable future migrations.

Core Features (Acceptance Criteria)
1) Measurement Input Form
Fields: Date (default today, allow historical), Weight, Height/Length, Head circumference, Unit selector (kg/lb, cm/in).
Age calculation: compute ageInDays from birthDate → date. Handle leap years.
Validation with friendly messages:
Unit conversion: realtime conversion or on submit; do not lose precision. Rounding rules in Appendix B.
Edit/Delete: Allow editing existing entries; deletion requires confirm.
Duplication rule: either prevent more than one entry per day per metric or allow multiple but surface warnings; document your choice.


2) Data Persistence
Save to AsyncStorage under a namespaced key (e.g., growth/v1/measurements).
3) Growth Chart Visualization
Render at least weight‑for‑age with percentile curves (3, 10, 25, 50, 75, 90, 97) and the baby’s data points.
Interpolation: if using WHO LMS, compute Z‑scores → percentiles using the LMS method. If using precomputed tables, implement linear interpolation between monthly knots. Document your approach.
Tap a data point to see: date, age (months + days), value, computed percentile.
Label axes with units; ensure readability on small screens.


4) History View
Chronological list (newest first or oldest first — be consistent).
Show converted display units and the computed percentile for each row.

Non‑Functional Requirements
Performance:
Handle 50+ measurements without jank; chart initial render < 500ms on a mid‑range device.
Avoid unnecessary re-renders (memoization where appropriate).


Resilience:
App tolerates empty state, single point, extremely dense data, and corrupted storage.

Deliverables (What to Submit)
Code (GitHub link)
Clean file structure, sensible components/hooks.
package.json with scripts:
start (or expo start), android, ios (or instructions)
test, lint, typecheck
README.md
Setup & run instructions (including Expo Go vs simulator steps).
Architecture overview (state management, data flow, charting choice).
Known trade‑offs and future improvements.
Demo Video (2–3 min)
Provide a public link (Loom/Drive)

Test Plan (we will use to verify)
Data Input
Normal measurements save; age computed correctly.
Imperial inputs convert correctly and store as SI.
Historical entry (two weeks ago) has correct ageInDays.
Charts
One point → single dot; no broken lines.
Multiple points → visible trend; correct axes/labels.
Small devices still readable (no clipped labels).
Persistence
Kill & relaunch retains data.
Edit updates chart immediately; delete removes points.
Corrupted storage path shows recovery dialog (reset).
Performance
Seed 60 entries: first chart paint < 500ms on simulator; interactions remain responsive.
