---
name: yt-viral
compatibility: "Node.js >=22.20.0 for bundled tools; install the complete skill pack."
description: "Use when researching a YouTube niche, competitors or reference videos, and comparing view counts against each channel own median."
---

# YouTube Research (RU)

## Language and channel context

Produce user-facing deliverables in natural Russian by default: scripts, hooks, titles, thumbnail text, descriptions, chapters, replies, plans and reports. Use another language when the user asks. Adapt examples and search phrases to the intended Russian-speaking audience, not by literal translation. Preserve official product names. Do not assume the audience lives in Russia, uses rubles, or shares one timezone.

For tasks using audience or author preferences, read [profile resolution](../yt-voice/references/profile-resolution.md). An explicitly supplied profile or equivalent document takes priority regardless of filename; read it in place, without requiring a copy at `youtube/voice.md`. Reuse the selected source for this channel in the current conversation. When none is available, offer existing-file, guided setup via [yt-voice](../yt-voice/SKILL.md), or neutral-style options once; do not block an otherwise complete request. Numeric analysis and file validation need no voice interview. Current user instructions override stored preferences. Do not invent the author's experience, figures, sources or results; label assumptions.

Script paths below are relative to this skill's directory. Resolve them from that directory and use absolute input paths when changing working directory. For bundled tools, use Node.js 22.20 or newer; no package installation or build step is needed. Run with `node`. If execution is unavailable, do the useful manual work and disclose that no tool score was computed.

## Collect comparable data

Use a supplied list or accessible public pages. A request about current performance needs current data and a collection date. If browsing is unavailable, request a collection and disclose the gap. Do not use logged-in sessions, cookies or private credentials.

Do not collect only hits. At least four comparable videos per channel is a technical threshold, not statistical confidence. Separate Shorts, long-form and live streams, and compare similar publication ages. Use separate input files for different cohorts; report selection criteria and date.

```json
[{"channel":"Example channel","title":"Example title","views":1200,"url":"https://example.com/video-1"}]
```

This is one schema example, not a sufficient dataset. `views` must be a nonnegative integer. Missing counts are not zero. Rounded public counts are approximate and must be disclosed as such. Exclude unknown values with an explanation; duplicate URLs are rejected.

```sh
node swipe.mjs collected.json --min 2.0 --json
```

The denominator is the median of the supplied channel sample only. Zero-median channels are skipped because the ratio is undefined. The formula label uses title wording from [the library](../yt-script/hooks.json), not evidence of causation.

Present up to five useful examples with source, views, median, ratio and observed technique. Suggest an original adaptation suited to the user's resources, without copying another creator's script or claiming a proven reason for success.

## Delivery boundary

Return the requested ready-to-use material and material uncertainties. This pack prepares drafts and analyzes supplied data; it does not publish videos or comments, apply reactions, change account settings, or edit media. No mandatory approval question at the end of every response.
