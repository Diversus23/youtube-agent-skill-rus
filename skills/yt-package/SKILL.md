---
name: yt-package
compatibility: "Node.js >=22.20.0 for bundled tools; install the complete skill pack."
description: "Use when creating or reviewing YouTube titles and thumbnail text, repackaging a video, or investigating a CTR concern."
---

# YouTube Packaging (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Package the promise

Use the actual video content. If unavailable, request a short synopsis rather than inventing a result. Explore distinct angles, usually 5-10 drafts, then present three strong pairs or the requested count.

```sh
node title.mjs --title "..." --thumb "..." --json
node title.mjs titles.txt
```

Check each final title with its own thumbnail text. A shared thumbnail across all candidates is appropriate only for that intended comparison. Include a brief for subject, framing, background and readable text; do not claim an image exists if only a brief was produced.

The checker normalizes Cyrillic and the Russian yo/e distinction but does not detect all inflections or semantic duplication. Review meaning manually. 40/60 characters are editorial preview checkpoints, not fixed interface truncation limits. Three thumbnail words is a readability recommendation. A title need not contain a number. Scores do not predict CTR.

The platform title limit is 100 characters ([official video settings](https://support.google.com/youtube/answer/57404?hl=ru), checked 2026-11-13). For low CTR, consider traffic source, impressions, period and comparable videos; one percentage cannot diagnose the cause.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
