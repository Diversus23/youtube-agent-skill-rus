---
name: yt-edit
compatibility: "Node.js >=22.20.0 for bundled tools; install the complete skill pack."
description: "Use when making an edit decision list from a timestamped YouTube transcript, finding pauses or retakes, or tightening a recording."
---

# YouTube Edit Notes (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Candidate cuts

Input: SRT, VTT, or Whisper JSON with a `segments` array or a root array of `start`, `end`, `text` objects; times are seconds. Without timestamps, offer semantic cuts only, never invented timecodes. Transcribe only with an available tool and authorized access.

```sh
node deadair.mjs transcript.srt --json
node deadair.mjs transcript.srt --floor 0.35
```

- `DEAD`: gaps above the threshold, preserving half of `--floor` on either side (default 0.45 seconds total).
- `FILLER`: isolated hesitation sounds. Meaningful Russian discourse words are not automatically deleted.
- `REPEAT`: matching openings of adjacent speech cues, allowing hesitation cues between them. This is a candidate retake, not proof.

Check each candidate against media if available: silence may contain a demonstration and repetition may be intentional. Otherwise label decisions provisional. Return a Russian table of interval, proposed cut, reason and review note. Overlapping intervals count once in savings. Estimated remaining runtime ends at the transcript's last timestamp, not an unknown media duration.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
