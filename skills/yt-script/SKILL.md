---
name: yt-script
compatibility: "Node.js >=22.20.0 for bundled tools; install the complete skill pack."
description: "Use when writing a YouTube script, hook, opening, or spoken recording text for a Russian-speaking audience."
---

# YouTube Scripts (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Script workflow

Extract topic, audience, format, promise and length from the request. If only style is missing, state a reasonable neutral choice and draft. Adapt structure for lessons, interviews, vlogs or explainers instead of forcing one format.

1. For a full script, draft up to five openings using [21 formulas](hooks.json). The library contains illustrative examples, not evidence about this author. Respect a narrower request or an explicit option count.
2. Run `node hookscore.mjs hooks.txt --json` (one hook per line), or `node hookscore.mjs --hook "..."`. Show two suitable options with scores and editorial reasoning. Choose for meaning and fit, not the highest score alone.
3. Confirm the title's promise early and begin delivering. Avoid boilerplate greetings or subscription appeals unless the format calls for them.
4. Write the spoken script in Russian, separating speech from Russian on-screen, demonstration and editing notes. Deliver the promised payoff and an appropriate close.
5. Estimate duration using the author's pace. If unknown, explicitly use 120-160 words per minute as a rough assumption, with demonstrations and pauses added separately. Planned timing is not a timestamp from an existing recording.

Scores detect lexical features, not truth, narrative quality or future views. Russian heuristics have not been calibrated on channel outcomes. Do not add fabricated numbers, repeated direct address or fear just to improve a score.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
