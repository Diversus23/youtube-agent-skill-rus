---
name: yt-audit
description: "Use when reviewing a YouTube channel, investigating growth concerns, or prioritizing an improvement from published material and supplied analytics."
---

# YouTube Audit (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Audit accessible evidence

Use a channel URL or supplied materials. First verify access; do not claim to have inspected thumbnails or watched video when only titles are available. If access fails, request the missing material and explain the scope possible.

1. Compare recent titles and topics: audience and promise should be understandable. Use [yt-package](../yt-package/SKILL.md) for title/thumbnail pairs.
2. If images are available, inspect thumbnail readability at feed size and alignment with the title.
3. Review openings of several accessible recordings or transcripts and fulfillment of their promise. [yt-script](../yt-script/SKILL.md) scores do not establish retention causes.
4. Assess schedule feasibility and topic consistency without treating upload frequency as an independent guarantee of success.
5. If impressions, CTR, traffic sources and retention are provided, compare similar formats and periods. Never infer private metrics from public views. Use [yt-retention](../yt-retention/SKILL.md) for retention curves.

Separate observations and hypotheses. Name one priority change for the next upload and how to evaluate it. If evidence cannot support a priority, name the needed check instead. Mention supported strengths and changes worth postponing; no mandatory praise quota or growth promise.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
