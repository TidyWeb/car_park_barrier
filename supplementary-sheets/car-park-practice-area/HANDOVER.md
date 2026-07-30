# Supplementary Sheets — Handover

Updated: 29 July 2026

## What this is

This is the working source for five short, learner-facing Python supplementary sheets. Each page combines explanation, exercises, hints and a browser-based Python workbench.

Work here first. It is not a Git publishing copy.

## Canonical working location

`/home/Phil/C&C/Learn_Python_Data/Working Files/Exercises/supplementary-sheets/car-park-practice-area/`

Do not write active source or run the project from `/home/Phil/C&C/Git/`. That location is publication staging only and has not been touched during this work.

## Current sheet order

1. `01-f-prints/`
2. `02-building/`
3. `03-reaching-in/`
4. `04-conditionals/`
5. `05-loops/`

The order matters: Building comes before Reaching In. Building must not assume that the learner already understands list positions, chained square brackets, or fetching from a list.

## Important files

- `index.html` — supplementary-sheets home page.
- `01-f-prints/index.html` through `05-loops/index.html` — individual sheets.
- `assets/drills.css` — shared page design and Documentation treatment.
- `assets/workbench.css` — workbench layout and appearance.
- `assets/codemirror-editor.js` — CodeMirror editor integration.
- `assets/pyodide-runner.js` and `assets/pyodide-worker.mjs` — Python runtime.
- `backups/` — retained backups. Never delete or replace these.

## Local preview and testing

These pages must be served over HTTP. Opening an HTML file directly with `file://` will not reliably run Pyodide or the workbench.

From the `car-park-practice-area` folder, use a local HTTP server and open, for example:

- `http://127.0.0.1:8765/`
- `http://127.0.0.1:8765/01-f-prints/`
- `http://127.0.0.1:8765/05-loops/`

If CSS appears unchanged after an edit, use a hard refresh: `Ctrl+Shift+R`. The shared stylesheet is intentionally loaded once by every sheet.

For visual changes, inspect at least:

- one desktop page, normally Sheet 01;
- one narrow page, normally Sheet 05 at roughly 390px wide;
- a real Run action in the Pyodide workbench when the change could affect it.

## Current visual direction — Documentation

The approved direction is the Documentation treatment: low contrast, all-sans reading hierarchy, no decorative eyebrow language, and rules rather than boxes.

This was applied centrally in `assets/drills.css`. The key decisions are:

- Reading content uses `system-ui, "Liberation Sans", Arial, sans-serif`.
- Sheet titles are compact `1.75rem` sans headings. Their `<span>` and `<em>` portions sit on the same line; the `<em>` is normal weight and retains the established blue-green accent.
- Section headings are compact sans headings, with decorative section glyphs hidden.
- The sheet number remains visible because it is orientation, not decoration. It is quiet, muted, normal-weight sans text.
- Exercise and explanation cards are transparent, have no shadow or box edge, and use only a top hairline.
- The left navigation strip is transparent with top and bottom hairlines.
- Code, workbench, and intentionally monospace labels remain monospace where that serves their function.
- The workbench remains dark and functional; it was not restyled as a reading panel.

Do not undo this by restoring the old large serif hero or by reintroducing decorative badges, boxed cards, or coloured editorial labels.

No palette values were changed for this treatment. Use existing CSS variables; do not introduce new colours to make it feel more emphatic.

## Typography pitfall that caused a false first pass

Applying a body font is not enough when the page already explicitly sets a different font on `h1`, `h2` or a named title class. The sheets had an old serif hero rule for `h1` and `.intro-title`, so an initial body-only change looked almost unchanged.

When carrying a typography treatment across an existing site:

1. inspect the rendered reference, not only an isolated CSS excerpt;
2. identify every explicit font override in the target stylesheet;
3. change the complete hierarchy deliberately; and
4. render the actual page before saying the treatment is done.

The title markup splits its words between `<span>` and `<em>` without a literal space in the HTML. When making those elements inline, add CSS spacing (`margin-left`) to the `<em>` or the words will run together.

## Workbench safeguards

- CodeMirror is the editor; Pyodide is the Python runtime. Keep that responsibility split.
- The editor must retain its plain-textarea fallback if CodeMirror fails to load.
- Enter is intentionally configured to insert a plain new line. Do not restore auto-indent: learners reported it as invisible indentation that made normal line breaks painful.
- Avoid unhelpful automatic quote/bracket completion if it creates duplicate punctuation or hides what was inserted.
- The workbench instruction is: “Click the tab that relates to your question.” Do not replace it with a generic “Ready” state.
- The selected exercise tab should remain visibly distinct from the other tabs.
- CodeMirror’s own CSS can override the dark editor surface and cursor. If it becomes white or the cursor is invisible, target the CodeMirror root, scroll area, sizer, lines and gutters with sufficiently specific existing rules; do not create a second editor layout.

## Learner-writing rules

- Write directly to the learner. Questions should contain the task, not commentary about why the exercise exists, drills, pedagogy or sheet design.
- Do not use “Why this one is new.”
- Explain an unfamiliar data shape before asking the learner to use it.
- Build difficulty through one changing variable at a time. Do not jump from trivial printing to nested dictionary/list syntax without intermediate repetition.
- Hints should target the actual snag. For these sheets that is often the distinction between `{ }`, `[ ]`, quoted dictionary keys and the containing name, rather than the surrounding `print()` punctuation.
- Keep worked answers available below expected output where an exercise is difficult enough that checking the shape helps learning.
- Preserve the established TidyWeb credit in the rail.

## Sheet-specific teaching decisions

### 01 — F-Prints

- Nine exercises, in three tiers.
- It begins with one full f-string shape, then isolates dictionary-key access before putting that access back inside f-strings.
- Exercise 07 deliberately uses unquoted `vehicle[reg]` / `vehicle[fee]` so Python raises a `NameError`. The intended corrected line is:

  ```python
  print(f"{vehicle['reg']} owes £{vehicle['fee']:.2f}")
  ```

### 02 — Building

- Introduces dictionaries as bundles before any list navigation.
- Exercise 02 must stand on its own: one bundle, one square bracket, one quoted label. Do not introduce positions, numeric indices, chained brackets or lists there.
- Learners build one dictionary called `vehicle`, then a second called `vehicle_two`, and see that labels can repeat inside separate bundles.

### 03 — Reaching In

- Starts from a supplied list of vehicles. The learner never has to build the list on this sheet.
- The sequence teaches one bracket, then two levels: choose the vehicle, then ask it for a label.
- Repetition is intentional. Exercise 03 asks for the same vehicle’s three facts with the full address typed each time.
- Exercise 04 introduces the shorter working form:

  ```python
  vehicle = vehicles[1]
  print(vehicle["reg"], vehicle["hours"], vehicle["fee"])
  ```

### 04 — Conditionals and 05 — Loops

- Both are built and use the same shared workbench and stylesheet.
- Keep their exercise-specific inline CSS narrow. Shared visual decisions belong in `assets/drills.css`.

## Known open item

The root `index.html` still marks Sheets 04 and 05 as “Coming later,” even though both are now built. The sheet pages and rail navigation are current. Update the root home page only when Phil asks for that separate navigation/content change.

## Change discipline

1. Read the relevant brief and this handover before editing.
2. For a live file, create a timestamped backup in `backups/` and state the source and backup path before changing it.
3. Use `apply_patch` for edits.
4. Keep shared changes in shared assets. Do not copy styling into five pages unless a rule is genuinely sheet-specific.
5. Check the actual rendered page through HTTP, including a narrow layout.
6. Keep colours unchanged unless Phil explicitly requests a palette change.
7. Do not delete files, backups, assets, or folders.
8. Do not write anything under `/home/Phil/C&C/Git/` unless Phil explicitly authorises a publication promotion.

## Latest Documentation-treatment backup

Before the full shared typography treatment, `assets/drills.css` was backed up as:

`backups/drills-20260729-174900-before-full-documentation-treatment.css`

This is a retained safety copy, not a version to restore automatically.
