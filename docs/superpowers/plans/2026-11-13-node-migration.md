# Node.js migration implementation plan

**Goal:** Replace Python with a single Node.js runtime for all six tools and developer tests. User approved migration after discussing fewer installation dependencies.
**Architecture:** Plain ESM `.mjs`, Node.js >=22.20.0, built-in libraries only; no build step and no npm install required. Keep CLI flags, JSON field names and skill folder layout. A small shared runtime in `yt-script/runtime.mjs` provides UTF-8 reading, CLI parsing/errors, Unicode pattern support and rounding. Keep all 12 skills installed together.
**Validation:** Port the existing 22 behavioral scenarios to `node:test`, add CSV quoting and Unicode-boundary regression cases, compare representative JSON outputs against the current Python baseline before removing it, then verify clean installation layout and all docs/references. Synthetic fixtures only.

## Tasks

- [x] Write failing Node tests for helper and hook/title/swipe behavior; port these tools and validate.
- [x] Port transcript parser and edit analysis plus chapters with independent focused tests.
- [x] Port retention CSV/analysis/CLI with independent focused tests.
- [x] Run all tests and compare representative Python/Node JSON reports; fix semantic differences.
- [x] Replace documentation commands, runtime requirements and test command; remove Python implementation/tests.
- [x] Validate 12 skills and links without Python; independent final review and regression fixes.

## Shared interfaces

`skills/yt-script/runtime.mjs`: `readUtf8(path) -> string`, `parseCli(options, usage) -> {values, positionals} | null` (help returns null), `runCli(import.meta.url, main)` (only executes entrypoint, errors exit 2 with message), `finiteNumber(value, label) -> number` (strict decimal numeric input), `round(value, digits=0) -> number` (ties to even), `words(text) -> string[]` (RU/EN, yo/e normalized), `compilePattern(pattern, flags='iu') -> RegExp` (Python-compatible Unicode word boundaries for bundled hook patterns).

`yt-edit/deadair.mjs`: `load(path) -> [start,end,text][]`, `parseTs`, `norm`, `mergedDuration`, `analyze(cues, floor=.45)`.
`yt-chapters/chapters.mjs`: `keywords`, `mmss`, `build(cues,target=7,duration=null)`.
`yt-retention/retention.mjs`: `number`, `loadCsv(path,delimiter=null)`, `analyze(rows,axis,duration=null)`.

English agent instructions and Russian outputs/profile behavior stay as approved. User changes outside this scope are preserved. Source repository remains read-only; no global install, push or publication.

## Verification record

- TDD: missing-module failures observed before each port; linked-directory launch regression observed before realpath-aware entrypoint fix; packaging check failed before Python files were removed.
- Python/Node comparison: 23 hook reports, 23 title reports and one swipe report matched field-for-field. Transcript worker compared 60 edit/chapter reports over 30 deterministic cue fixtures. Retention matched seconds and percent examples with known/unknown duration.
- 31 Node tests initially passed on Node 24.17.0, including copied skill-folder execution without root package.json or installed packages, metadata/link/encoding checks and linked-directory execution.
- Deliberate stricter inputs: reject unsafe integer view counts, boolean numeric fields and malformed CSV quoting. Common/numeric HTML entities supported; rare named entities stay as text (documented).
- `runCli` supports async handlers so transcript loading errors remain readable CLI errors.
- Version 2.0.0 marks the breaking command path change from `.py` to `.mjs`; no two implementations are shipped.
- Independent review found CR-only newline handling and punctuation-prefixed percentage CSV headers. Regression tests failed before the fixes and passed afterward; shared UTF-8 reading now normalizes line endings and CSV headers accept leading punctuation.
- Final suite: all 34 tests passed on Node 24.17.0 and the minimum supported Node 22.20.0. No external runtime or test dependencies are required.
