---
name: yt-retention
compatibility: "Node.js >=22.20.0 for bundled tools; install the complete skill pack."
description: "Use when analyzing YouTube audience retention from a CSV or supplied chart, identifying drops or investigating pacing."
---

# YouTube Retention (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Input contract

A CSV must contain exactly two columns: position and retention. Specify position units explicitly: seconds or percent of video length. Retention values are percentages such as 85.5, not fractions such as 0.855. UTF-8/BOM, decimal commas, comma/semicolon/tab delimiters are supported. At least two points are required; sparse sampling supports only coarse conclusions. Values above 100% may be valid; do not clamp them.

```sh
node retention.mjs retention.csv --axis seconds --json
node retention.mjs retention.csv --axis percent --duration 600 --transcript transcript.srt --json
node retention.mjs retention.csv --axis seconds --delimiter ";"
```

Do not promise a particular Studio export button. If the export is unavailable, request a table or chart with axes. Chart-only analysis is approximate; do not manufacture exact CSV values.

## Interpretation

Drops are percentage-point differences, not relative percentages lost. `hook_leak` interpolates the value at 30 seconds only when the data begins at zero and covers that time. Percent axes require duration to calculate seconds. Videos shorter than 30 seconds have no such metric.

`cliffs` lists up to five intervals with the greatest drop rate, not exact moments viewers left. `slide_per_unit` is the weighted average slope after 30 seconds per original axis unit. Compare only compatible units. The curve does not establish a cause: check transcript, editing, traffic sources and comparable videos.

Return the main observed change, one explicitly labeled hypothesis and one testable intervention. Do not apply universal healthy thresholds or infer that packaging is the problem solely because retention lacks a cliff. Identify missing evidence when no conclusion is justified.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
