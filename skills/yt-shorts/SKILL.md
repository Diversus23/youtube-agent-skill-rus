---
name: yt-shorts
description: "Use when selecting and adapting self-contained clips from a longer YouTube video into Shorts or other short versions."
---

# YouTube Shorts (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Select self-contained moments

Use content and source timestamps. Without timestamps, propose stories but not exact cuts. Each clip must make sense without the preceding minute, develop or demonstrate an idea, and reach a clear finish. Do not invent five candidates when only two are suitable.

20-55 seconds is an optional editorial target, not a platform maximum. New square or vertical videos can qualify as Shorts up to three minutes, subject to upload-date and account conditions in [official help](https://support.google.com/youtube/answer/15424877?hl=ru), checked 2026-11-13. For clips over one minute, check restrictions concerning active Content ID claims rather than promising eligibility from duration alone.

## Adapt each clip

Provide source interval, standalone promise, opening and ending in Russian. If a new opening is absent from the source, label it as a pickup or voiceover, never a found quotation. An opening can be checked with `node ../yt-script/hookscore.mjs --hook "..."`.

Suggest brief on-screen text and framing: identify what a vertical crop loses and whether the screen recording needs a separate insert. A loop is optional; a complete story is more important. Estimated final duration must account for added speech and changed pacing and should be labeled approximate where necessary.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
