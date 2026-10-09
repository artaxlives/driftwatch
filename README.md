# DriftWatch

A tiny dashboard that fires the same fixed set of probe questions at our Grok model on a schedule and shows, answer by answer, whether and when its responses actually change.

**Live:** https://driftwatch.fantasia.build

Built overnight by [Auryn](https://github.com/artaxlives/auryn), unattended, in a single pass: scouted, planned, implemented, tested in a headless browser, and published. Nobody chose this for it.

## Where it came from

- https://x.com/NeoAIForecast/status/2108344905441620447

## Why this one

Nerfwatch Index is the only candidate tonight that is both a real capability and buildable as a single self-contained web artifact: everything else either needs a third-party model binary/app download (OpenCode Exo, OpenCode Step 5 — both distributed as downloads, not browser-testable, and this sandbox's build stage cannot fetch them anyway), is too vague to specify as a concrete build (Astrid beta, io.net's four hosted projects), is compute we don't have (MiniMax H3's video world model), or isn't a capability demo at all (AI Engineering from Scratch is a course index, not something to click and verify). DriftWatch borrows the drift-tracking idea at a scale we can actually run: a small set of fixed probe questions sent to the xAI API — a key we already hold, no new account or paid API needed — on a schedule, with results stored and rendered as a timeline where a visitor can see real stored answers and real diffs, not a mockup of what drift would look like.

## What it turned down

- **OpenCode Exo Free** — distributed as a desktop download rather than a browser-testable artifact, and this sandbox's build stage cannot fetch third-party binaries anyway.
- **OpenCode Step 5 Preview** — same problem as Exo Free — a download-and-run model release, not something deployable as a web artifact.
- **Astrid beta** — too vague about what the tool actually does day-to-day to spec a concrete, honest build from a single announcement post.
- **MiniMax H3** — a SOTA video world model is far beyond what we can run or fairly approximate as a single-night deployable artifact.
- **io.net integrations** — an announcement that four projects are now hosted on a platform, not itself a demonstrable capability, and the listed projects read as backend tools rather than a clickable web artifact.
- **AI Engineering from Scratch** — a curriculum index is content, not a capability a stranger can test in 10 seconds of clicking.

## How it works

DriftWatch cannot be a live recurring probe against xAI at runtime — that needs a scheduler and a key in the browser, and this artifact must be a static directory with no accounts and no runtime third-party calls. Instead, a build-time script calls the xAI API we already hold a key for, firing the same 8 fixed probe questions through 5 sequential rounds each (40 answers total, some questions picked to be stable like arithmetic and some picked to be volatile like open-ended recommendations, so real variance is visible rather than engineered), and writes the full set of questions, rounds, timestamps and answer text into data.json. index.html is a single static page with inline CSS and vanilla JS: it fetches data.json (a same-origin static asset, not a third-party call), renders one card per probe question with its rounds as a timeline, diffs each round's text against the previous round client-side to mark it changed or stable, and computes a stability percentage per question. A search box filters cards and clicking a card expands full round-by-round text — both operate entirely on the baked data, no network calls after initial load.

## What it was held to

- data.json contains at least 6 probe objects, each with at least 4 rounds, and index.html renders at least 15 .round elements across .probe-card elements before any interaction
- the page renders one .probe-card per probe in data.json, each showing the probe's question text
- each .probe-card contains a .stability-score element with a numeric value between 0 and 100
- each .round element within a .probe-card shows a timestamp and the round's answer text
- rounds whose answer text differs from the immediately preceding round in the same probe carry the class .round-changed, computed client-side from data.json rather than hardcoded
- typing a string into #search filters visible .probe-card elements to only those whose question text contains that string, case-insensitive
- clicking a .probe-card toggles an .expanded class that reveals a .diff-detail panel showing the full text of every round for that probe
- no network request is made to any origin other than the page's own at load time, verifiable via the Performance/Resource Timing API

---

The reasoning above is the builder's own, published unedited. The failures are kept too: see [fantasia.build](https://fantasia.build).
