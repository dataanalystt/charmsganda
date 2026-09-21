# Moonie Date Invitation — V8

A single-screen interactive date invitation for Charms, supervised by Moonie.

## Run locally

Open `index.html`, or use VS Code Live Server for the smoothest browser behavior.

## Current experience

- Opening guard-duty scene with the generated sleeping Moonie video
- Five Moonie reaction videos (neutral, begging, annoyed, shocked, happy)
- Five-card auto-moving memory carousel; hover/focus pauses it and reveals a memory note
- Runaway No-button interaction with a respectful “Maybe another day” path
- Available-weekend picker: Oct 10–11, Oct 24–25, Nov 14–15, 2026
- Food, activity, vibe, and dessert choices
- Dessert final boss does not reveal the correct answer when Charms guesses wrong
- Official date ticket with PNG download
- Final sealed-envelope scene with Caloy’s personal letter and PNG download
- No email, webhook, form submission, database, or persistent answer storage
- Full-viewport scene system: no vertical page scrolling

## Edit Caloy's letter

Open `script.js` and edit only the `PERSONAL_LETTER` block near the top. Blank lines become paragraph breaks. The on-screen letter automatically shrinks slightly when necessary to stay inside the viewport.

## Replace memory photos later

The four placeholder images are in `assets/`:

- `memory-1.svg`
- `memory-2.svg`
- `memory-3.svg`
- `memory-4.svg`

Replace their `src` values in `index.html` with JPG/PNG/WebP images. The carousel uses `object-fit: contain`, so the full photo remains visible instead of being cropped.

## Music

Replace `assets/music.mp3` if you want to use a different audio file.

## Final flow

1. Charms confirms the date plan.
2. The official date ticket appears and can be saved as PNG.
3. Moonie presents one final sealed envelope inside the site.
4. Charms opens Caloy's letter and can save it as a PNG keepsake.
5. The experience closes on Moonie's happy finale.

## V9 content polish
- Removed the finale replay button; use the global reset button in the top-right.
- Hovering “Maybe another day” now switches Moonie to the begging/sad reaction.
- Updated food/activity/date-energy copy and options for the two-day date.
- Added an Empanada photo icon derived from the provided reference image.
- Ice cream progress is wiped on every page restore/reload.
- Moved the `zzz` overlay near Moonie’s head and rebalanced final ticket spacing.


## V10 update
- Memory scene is now photo-first: portrait 4:5 frames, larger image area, smaller title/captions.
- Removed the memory intro eyebrow and helper sentence.
- Removed “The unnecessarily dramatic part” eyebrow from the date question scene.


## V11 update
The memory carousel now uses true 4:5 portrait cards so portrait photos are the visual focus.


V17: Added the reminder under the date-ticket actions: “Don’t forget to send the date ticket to Caloy. He’s probably waiting. ♡”

## V20 cleanup
- `index.html` is the single HTML entry point for the entire experience.
- Removed the old `qa-memory.html` test/preview file. It was only a QA shortcut that opened the memory scene directly and is not required by the website.
