---
name: yt-plan
description: "Use when planning a week or month of YouTube content, prioritizing topics, or scheduling production within available resources."
---

# YouTube Planning (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Capacity-based plan

Use known hours, team capacity, existing material, topics and formats. If time is unknown, ask for it; if the user requests an example, state an illustrative budget rather than implying agreement.

Choose a priority video and useful reuse opportunities. Do not force every channel into one long video, a second upload and three Shorts. Use [yt-shorts](../yt-shorts/SKILL.md) when standalone moments and editing capacity exist.

Estimate preparation, recording, editing and packaging with dependencies. Keep work within budget, include a buffer and identify what to drop first. Use audience analytics for publication timing when supplied; otherwise label timing as an experiment. Do not assume a universal weekday or Moscow timezone. Clarify timezone for an exact calendar.

Return a Russian table of day/date, format, topic, viewer promise, available material and effort, plus total hours. Distinguish production tasks from uploads: three Shorts count as three publications.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
