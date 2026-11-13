---
name: yt-chapters
compatibility: "Node.js >=22.20.0 for bundled tools; install the complete skill pack."
description: "Use when creating or checking YouTube chapters and timestamps from a transcript, or dividing a video into sections."
---

# YouTube Chapters (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Chapter workflow

Use a timestamped transcript and preferably full video duration. Without timings, propose structure only and ask for data needed for exact chapters.

```sh
node chapters.mjs transcript.srt --target 8 --duration 600 --json
```

`--duration` is optional; otherwise the final cue end is used. `--target` is desired, not guaranteed. Boundaries are selected by pauses and vocabulary shifts, rounded to whole seconds. Review boundaries by meaning and rewrite every draft title into clear Russian, usually 3-6 words. After manual boundary edits, recheck the full sequence including the final chapter to the actual video end.

Requirements: first entry `00:00`, at least three entries in increasing order, every chapter at least 10 seconds. `valid: false` and exit code 1 mean the list must not be presented as publish-ready. A short video may not support chapters. A valid list does not guarantee account eligibility; see [official help](https://support.google.com/youtube/answer/9884579?hl=ru), checked 2026-11-13.

Return a copyable timestamp/title block. State whether the last chapter was checked against video duration or only transcript end.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
