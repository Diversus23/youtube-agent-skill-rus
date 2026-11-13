---
name: yt-seo
description: "Use when preparing YouTube descriptions, search-facing text or tags from video content for a Russian-speaking audience."
---

# YouTube SEO (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Description and search

Use actual content or a transcript. With only a topic, provide a labeled draft without invented chapters, links or results.

Propose up to three plausible Russian search queries, labeled hypotheses unless real query data is supplied. Do not promise rankings. Keep product names recognizable; avoid literal translation and keyword stuffing.

The opening lines explain the video's content and benefit. Add real links/resources, then chapters through [yt-chapters](../yt-chapters/SKILL.md) if timings exist, and other useful details or credits. Check alignment with title and content. Descriptions have a 5000-character limit ([official video settings](https://support.google.com/youtube/answer/57404?hl=ru)).

Use tags selectively for alternate spellings, abbreviations and common misspellings. Do not stuff tags into descriptions or add unrelated topics. Their discovery role is limited ([official tag help](https://support.google.com/youtube/answer/146402?hl=ru), checked 2026-11-13). Fulfill the description request rather than replacing it with a packaging audit; title suggestions can be a separate note.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
