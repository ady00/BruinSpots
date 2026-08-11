# Fall 26 Class Data + Library Hours Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Orchestration (user-mandated):** Each task is executed by a **Sonnet** subagent; after each task an **Opus** subagent reviews the result before the next task starts. **No git commits** — the user reviews all changes first.

**Goal:** Load UCLA Fall 2026 classroom schedule data into Supabase via the existing data-pipeline, and set all hardcoded UCLA library hours to 24-hour availability (user-directed stopgap; real hours to be added by the user later).

**Architecture:** Retarget the existing scrape → filter → enrich → load pipeline from term `26S` to `26F` (per SPRING_26_GUIDE.md / WINTER_26_GUIDE.md), run it end-to-end, and replace the `LIBRARY_HOURS` constant in the frontend with an always-open 24/7 schedule.

**Tech Stack:** Python 3.13 (`.venv` at repo root), requests + BeautifulSoup, supabase-py 1.0.4, Next.js/TypeScript frontend.

## Global Constraints

- Term code: `26F` (verified live: static ClassroomDetail pages return real Fall 26 events).
- Fall 2026 dates (verified against registrar.ucla.edu Annual Academic Calendar 2026-27 PDF):
  - Instruction begins: `2026-09-24`
  - Instruction ends: `2026-12-04`
  - Final exams end / quarter ends: `2026-12-11`
- Date-field pattern (matches Spring 26 precedent): `various_functions.py` uses instruction dates (`2026-09-24` → `2026-12-04`); `academic_calendar.json` uses instruction-begins → finals-end (`2026-09-24` → `2026-12-11`), `academic_year: "2026-2027"`, `term: "Fall"`, `part_of_term: "A"`.
- Python interpreter: **always** `/Users/advaybajpai/bruinspots/.venv/bin/python` (NOT bare `python3` — system python lacks deps).
- The venv is missing `requests` — Task 1 installs it.
- Pipeline execution order follows the **actual script code**, not SPRING_26_GUIDE.md step 5-7 (stale): `add_building_coordinates.py` reads AND writes `data/filtered_classrooms_with_hours.json` in place; there is no rename before it.
- `ucla_scraper_second.py` writes `data/classroom_schedule.json` directly (no `mv` needed).
- Supabase baseline before upload (for verification deltas): buildings 49, rooms 603, class_schedule 12105, academic_terms 1, daily_events 0. `.env` at repo root already points at the current (nxiuzusrraixrtbnpttc) project.
- `load_to_postgres.py` intentionally clears `daily_events`, `class_schedule`, `academic_terms` and upserts `buildings`/`rooms` — replacing Spring data with Fall data is the expected quarterly refresh.
- No git commits at any step; leave the working tree for user review.

---

### Task 1: Retarget pipeline scripts to Fall 26

**Files:**
- Create: `data-pipeline/classes_fall_26.txt` (union of the two master lists, 1109 unique rooms)
- Modify: `data-pipeline/ucla_scraper.py:50-53`
- Modify: `data-pipeline/ucla_scraper_second.py:78`
- Modify: `data-pipeline/data/various_functions.py:3-7,35`
- Modify: `data-pipeline/data/academic_calendar.json` (whole file)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `classes_fall_26.txt` (input of Task 2); scripts configured for term `26F`; `academic_calendar.json` consumed by Task 5's loader.

- [ ] **Step 1: Install requests into the venv**

```bash
/Users/advaybajpai/bruinspots/.venv/bin/pip install requests
```

- [ ] **Step 2: Build the Fall 26 input list (union of fall_25 + spring_26 master lists)**

```bash
cd /Users/advaybajpai/bruinspots/data-pipeline
sort -u classes_fall_25.txt classes_spring_26.txt | grep -v '^[[:space:]]*$' > classes_fall_26.txt
wc -l classes_fall_26.txt   # Expected: 1109
```

- [ ] **Step 3: Edit `ucla_scraper.py` lines 50-53**

```python
# FROM:
    base_url = "https://sa.ucla.edu/ro/Public/SOC/Results/ClassroomDetail?term=26S&classroom="
    output_file = "classes_spring_26_cleaned.txt"

    with open("classes_spring_26.txt", "r") as infile, open(output_file, "w") as outfile:

# TO:
    base_url = "https://sa.ucla.edu/ro/Public/SOC/Results/ClassroomDetail?term=26F&classroom="
    output_file = "classes_fall_26_cleaned.txt"

    with open("classes_fall_26.txt", "r") as infile, open(output_file, "w") as outfile:
```

- [ ] **Step 4: Edit `ucla_scraper_second.py` line 78**

```python
# FROM:
    output = extract_schedule_data("classes_spring_26_cleaned.txt")
# TO:
    output = extract_schedule_data("classes_fall_26_cleaned.txt")
```

- [ ] **Step 5: Edit `data/various_functions.py` header (lines 3-7)**

```python
# FROM:
# Spring 2026 UCLA Quarter Dates
# Instruction: Mar 30 - Jun 5, 2026
# Finals: Jun 6-12, 2026
START_DATE = "2026-03-30"
END_DATE = "2026-06-05"
# TO:
# Fall 2026 UCLA Quarter Dates
# Instruction: Sep 24 - Dec 4, 2026
# Finals: Dec 5-11, 2026
START_DATE = "2026-09-24"
END_DATE = "2026-12-04"
```

Also line 35, update the print label:

```python
print(f"Updated JSON with Fall 2026 dates ({START_DATE} to {END_DATE})")
```

- [ ] **Step 6: Replace `data/academic_calendar.json` content**

```json
[
  {
    "academic_year": "2026-2027",
    "term": "Fall",
    "part_of_term": "A",
    "start_date": "2026-09-24",
    "end_date": "2026-12-11"
  }
]
```

- [ ] **Step 7: Verify**

```bash
cd /Users/advaybajpai/bruinspots/data-pipeline
../.venv/bin/python -m py_compile ucla_scraper.py ucla_scraper_second.py data/various_functions.py 2>&1 || echo COMPILE-FAIL  # various_functions runs on import; expect it to execute against final_classrooms_ucla.json — instead use: python -c "import ast; ast.parse(open('data/various_functions.py').read())"
grep -n "26F\|fall_26" ucla_scraper.py ucla_scraper_second.py   # both files show fall targets, no 26S remains
grep -n "2026-09-24\|2026-12-04" data/various_functions.py
/Users/advaybajpai/bruinspots/.venv/bin/python -c "import requests; print('requests ok')"
```

Expected: all greps hit, no `26S`/`spring_26` remaining in the two scrapers, `requests ok`.

> ⚠ Do NOT run `py_compile` on `data/various_functions.py` via import machinery that executes it — it is a script, not a module. Use `ast.parse` as shown.

---

### Task 2: Run the classroom validator scrape

**Files:**
- Create (generated): `data-pipeline/classes_fall_26_cleaned.txt`

**Interfaces:**
- Consumes: `classes_fall_26.txt`, retargeted `ucla_scraper.py` (Task 1).
- Produces: `classes_fall_26_cleaned.txt` — lines of the form `BUILDING ROOM: https://sa.ucla.edu/...term=26F...` (input of Task 3).

- [ ] **Step 1: Run the validator (long-running: ~1109 sequential HTTP fetches, 15-30 min)**

```bash
cd /Users/advaybajpai/bruinspots/data-pipeline
../.venv/bin/python ucla_scraper.py 2>&1 | tail -20
```

Run in background; monitor with `wc -l classes_fall_26_cleaned.txt`.

- [ ] **Step 2: Sanity-check the output**

```bash
wc -l classes_fall_26_cleaned.txt          # Expected: roughly 500-650 (Spring was 589, Winter 570)
grep -c "term=26F" classes_fall_26_cleaned.txt   # Expected: equals line count
awk -F': ' 'NF!=2 {print "BAD LINE: " $0}' classes_fall_26_cleaned.txt   # Expected: no output
```

Failure mode: if the cleaned file is near-empty (<100 lines), Fall 26 data is not published for most rooms — STOP and flag the user. (Pre-verified: BOELTER 2444 returns 24 real Fall events, so a near-empty result indicates a script bug, not missing data.)

---

### Task 3: Run the schedule scraper

**Files:**
- Create (generated): `data-pipeline/data/classroom_schedule.json`

**Interfaces:**
- Consumes: `classes_fall_26_cleaned.txt` (Task 2).
- Produces: `data/classroom_schedule.json` with shape `{"last_updated": iso, "buildings": {NAME: {"rooms": {ROOM: {"sections": [{course, time:{start,end}, days}]}}}}}` (input of Task 4).

- [ ] **Step 1: Run the schedule scraper (long-running: one fetch per cleaned room, 10-25 min)**

```bash
cd /Users/advaybajpai/bruinspots/data-pipeline
../.venv/bin/python ucla_scraper_second.py 2>&1 | tail -5
```

- [ ] **Step 2: Sanity-check the output**

```bash
../.venv/bin/python - <<'EOF'
import json, datetime
d = json.load(open('data/classroom_schedule.json'))
assert d['last_updated'][:10] == datetime.date.today().isoformat(), d['last_updated']
bldgs = d['buildings']
rooms = sum(len(b['rooms']) for b in bldgs.values())
sections = sum(len(r['sections']) for b in bldgs.values() for r in b['rooms'].values())
print(f"buildings={len(bldgs)} rooms={rooms} sections={sections}")
assert len(bldgs) >= 35 and rooms >= 400 and sections >= 3000, "suspiciously low counts"
s = next(iter(next(iter(bldgs.values()))['rooms'].values()))['sections'][0]
assert set(s) == {'course','time','days'} and set(s['time']) == {'start','end'}
print("sample:", s)
EOF
```

Expected: counts printed and assertions pass (Spring reference: 45 buildings / 589 rooms / 12105 schedule rows after day-expansion).

---

### Task 4: Filter, hours, coordinates, dates

**Files:**
- Create (generated): `data-pipeline/data/filtered_classrooms.json`, `data-pipeline/data/filtered_classrooms_with_hours.json`
- Overwrite (generated): `data-pipeline/data/final_classrooms_ucla.json`

**Interfaces:**
- Consumes: `data/classroom_schedule.json` (Task 3).
- Produces: `data/final_classrooms_ucla.json` where every building has `hours` (mon-sun, open/close), `coordinates` (latitude/longitude), and `rooms: {ROOM: [ {course,title,time,days,start_date,end_date} ]}` — exactly what `load_to_postgres.py` validates in Task 5.

- [ ] **Step 1: Run the processing chain (order per actual script I/O, NOT the stale guide steps)**

```bash
cd /Users/advaybajpai/bruinspots/data-pipeline
../.venv/bin/python building_eligibility_filter.py      # classroom_schedule.json -> filtered_classrooms.json
../.venv/bin/python ucla_scheduler.py                   # filtered_classrooms.json -> filtered_classrooms_with_hours.json
../.venv/bin/python add_building_coordinates.py         # updates filtered_classrooms_with_hours.json IN PLACE
```

- [ ] **Step 2: Drop buildings missing coordinates**

> User directive (2026-08-11): do NOT add new buildings/geojson features. Any building `add_building_coordinates.py` reports under `Buildings missing coordinates:` is removed from the dataset entirely (its classes are dropped). `ucla_buildings.geojson` stays untouched at its original 49 features. Task 5's loader hard-fails on any building without `coordinates`, so removal is mandatory, not optional.

- [ ] **Step 3: Finalize and stamp dates**

```bash
mv data/filtered_classrooms_with_hours.json data/final_classrooms_ucla.json
cd data && ../../.venv/bin/python various_functions.py && cd ..
```

Expected print: `Updated JSON with Fall 2026 dates (2026-09-24 to 2026-12-04)`

- [ ] **Step 4: Validate the final JSON against the loader's schema**

```bash
../.venv/bin/python - <<'EOF'
import json
d = json.load(open('data/final_classrooms_ucla.json'))
for name, b in d['buildings'].items():
    assert {'hours','coordinates','rooms'} <= set(b), f"{name} missing keys"
    for room, classes in b['rooms'].items():
        assert isinstance(classes, list), f"{name} {room} not flattened"
        for c in classes:
            assert {'course','title','time','days','start_date','end_date'} <= set(c)
            assert c['start_date'] == '2026-09-24' and c['end_date'] == '2026-12-04'
print(f"OK: {len(d['buildings'])} buildings validated")
EOF
```

---

### Task 5: Upload to Supabase

**Files:**
- None modified (reads `data/final_classrooms_ucla.json` + `data/academic_calendar.json`; writes to Supabase).

**Interfaces:**
- Consumes: Task 4's final JSON, Task 1's `academic_calendar.json`, root `.env`.
- Produces: Supabase state — `class_schedule` = Fall 26 rows, `academic_terms` = 1 Fall row, `buildings`/`rooms` upserted.

- [ ] **Step 1: Run the loader**

```bash
cd /Users/advaybajpai/bruinspots/data-pipeline
../.venv/bin/python load_to_postgres.py
```

Expected output ends with `All data has been successfully processed and relevant tables verified!`. The script self-verifies counts and raises `DataValidationError` otherwise.

- [ ] **Step 2: Independent post-upload verification**

```bash
cd /Users/advaybajpai/bruinspots && .venv/bin/python - <<'EOF'
import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv('.env'))
from supabase import create_client
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
terms = sb.table('academic_terms').select('*').execute().data
assert len(terms) == 1 and terms[0]['term'] == 'Fall' and terms[0]['academic_year'] == '2026-2027', terms
assert terms[0]['start_date'] == '2026-09-24' and terms[0]['end_date'] == '2026-12-11', terms
for t, floor in [('buildings', 49), ('rooms', 603)]:
    c = sb.table(t).select('*', count='exact').limit(1).execute().count
    assert c >= floor, f"{t}: {c} < baseline {floor}"
    print(f"{t}: {c}")
cs = sb.table('class_schedule').select('*', count='exact').limit(1).execute().count
print(f"class_schedule: {cs}")
assert cs > 3000, "class_schedule suspiciously low"
rows = sb.table('class_schedule').select('*').eq('building_name','BOELTER').eq('room_number','2444').execute().data
assert rows and all(r['start_date'] == '2026-09-24' for r in rows), rows[:2]
print(f"BOELTER 2444 Fall rows: {len(rows)} — e.g. {rows[0]['course_code']} {rows[0]['start_time']}-{rows[0]['end_time']} {rows[0]['day_of_week']}")
EOF
```

Expected: all asserts pass; BOELTER 2444 shows Fall courses (spot-verified earlier to include COM SCI M51A Fri 08:00-09:50).

---

### Task 6: Set all library hours to 24-hour availability

> User directive (2026-08-11, supersedes the original "actual timings" goal): set ALL library hours to 24-hour times as a stopgap — the user will refine real hours later. The reservation API is known to display empty at odd times; that is accepted.

**Files:**
- Modify: `src/utils/libraryHours.ts:14-60` (the `LIBRARY_HOURS` constant only — leave `isLibraryOpen`/`getLibraryHoursMessage` untouched)

**Interfaces:**
- Produces: `LIBRARY_HOURS` consumed by `src/app/api/facilities/route.ts` and `src/components/FacilityAccordion.tsx`. Keys MUST stay exactly: `"Powell Library"`, `"Young Research Library"`, `"Music Library"`, `"Biomedical Library"`, `"Science and Engineering Library"`.

- [ ] **Step 1: Replace the `LIBRARY_HOURS` constant so every library is open 24 hours every day**

The 24-hour representation is `{ open: "00:00", close: "00:00", nextDay: true }` for every day. Rationale (do not deviate): `isLibraryOpen` returns true for any time when `nextDay` is set and `targetTime >= "00:00"` (always), and `formatTime` rejects `"24:00"` (its regex caps at 23:59), so `close: "24:00"` or `close: "23:59"` would either warn in console or create a closed minute. Use a helper to avoid 35 repeated lines:

```typescript
const OPEN_24_HOURS = {
  Monday: { open: "00:00", close: "00:00", nextDay: true },
  Tuesday: { open: "00:00", close: "00:00", nextDay: true },
  Wednesday: { open: "00:00", close: "00:00", nextDay: true },
  Thursday: { open: "00:00", close: "00:00", nextDay: true },
  Friday: { open: "00:00", close: "00:00", nextDay: true },
  Saturday: { open: "00:00", close: "00:00", nextDay: true },
  Sunday: { open: "00:00", close: "00:00", nextDay: true },
};

// Stopgap: all libraries treated as open 24/7 until real per-term hours are added.
export const LIBRARY_HOURS: LibraryHours = {
  "Powell Library": { ...OPEN_24_HOURS },
  "Young Research Library": { ...OPEN_24_HOURS },
  "Music Library": { ...OPEN_24_HOURS },
  "Biomedical Library": { ...OPEN_24_HOURS },
  "Science and Engineering Library": { ...OPEN_24_HOURS },
};
```

- [ ] **Step 2: Verify always-open behavior with a quick check**

```bash
cd /Users/advaybajpai/bruinspots && npx tsx -e "
import moment from 'moment-timezone';
import { isLibraryOpen } from './src/utils/libraryHours';
const probes = ['2026-09-30T03:07', '2026-10-03T23:59', '2026-10-04T00:00', '2026-12-25T12:00'];
for (const p of probes) {
  for (const lib of ['Powell Library','Young Research Library','Music Library','Biomedical Library','Science and Engineering Library']) {
    if (!isLibraryOpen(lib, moment.tz(p, 'America/Los_Angeles'))) throw new Error(lib + ' closed at ' + p);
  }
}
console.log('all libraries open at all probed times');
"
```

(If `tsx` is unavailable, `npx tsx` will fetch it; if that fails in the sandbox, verify by reading the logic instead and note it in the report.)

- [ ] **Step 3: Typecheck the frontend**

```bash
cd /Users/advaybajpai/bruinspots && npx tsc --noEmit
```

Expected: exit 0 (or only pre-existing errors unrelated to `libraryHours.ts` — record any).

---

### Task 7: Fall 26 guide, final verification, and hand-off

**Files:**
- Create: `data-pipeline/FALL_26_GUIDE.md`

- [ ] **Step 1: Write `data-pipeline/FALL_26_GUIDE.md`**

Follow the exact structure of `data-pipeline/SPRING_26_GUIDE.md` (read it first), with these Fall 26 values and corrections:
- Term code `26F`; changes-from-Spring table (input `classes_fall_26.txt`, cleaned `classes_fall_26_cleaned.txt`).
- Academic calendar table: Quarter begins 2026-09-21; Instruction begins 2026-09-24; Veterans Day 2026-11-11; Thanksgiving 2026-11-26/27; Instruction ends 2026-12-04; Common finals 2026-12-05/06; Final exams 2026-12-07 → 2026-12-11. Source: registrar.ucla.edu Annual Academic Calendar 2026-27.
- Execution steps: use the ACTUAL script I/O order (no rename before coordinates): scraper → scraper_second → building_eligibility_filter → ucla_scheduler → add_building_coordinates (in-place on `filtered_classrooms_with_hours.json`) → `mv data/filtered_classrooms_with_hours.json data/final_classrooms_ucla.json` → `cd data && python3 various_functions.py` → `load_to_postgres.py`. Note explicitly that this corrects SPRING_26_GUIDE.md's stale steps 5-7.
- Note the input list is the union of fall_25 + spring_26 master lists (1109 rooms), and record the actual kept/skipped counts from this run (in the Task 2 report at `.superpowers/sdd/2026-08-11-fall-26-data-pipeline/task-2-report.md`).
- Keep the tables-updated, troubleshooting, and future-quarters sections (Winter 27 `27W` Jan 4 – Mar 19 2027 per prior guide).

- [ ] **Step 2: Frontend production build**

```bash
cd /Users/advaybajpai/bruinspots && npm run build 2>&1 | tail -15
```

Expected: build succeeds.

- [ ] **Step 3: Change summary for user review**

`data-pipeline/` and `database/` are **gitignored** — `git status` shows only `src/` and `docs/` changes. Produce the hand-off summary manually:

```bash
cd /Users/advaybajpai/bruinspots && git status --short && git diff --stat
ls -la data-pipeline/classes_fall_26.txt data-pipeline/classes_fall_26_cleaned.txt data-pipeline/FALL_26_GUIDE.md data-pipeline/data/final_classrooms_ucla.json
```

Report: modified pipeline scripts + calendar (gitignored, list explicitly), new `classes_fall_26*.txt` + `FALL_26_GUIDE.md`, regenerated data JSONs, `libraryHours.ts` (tracked), this plan (tracked). **Do not commit** — flag the user for review.
