---
name: yt-voice
description: "Use when creating or updating a YouTube author profile, setting channel tone and audience, or deriving voice preferences from supplied files and examples."
---

# YouTube Voice Profile (RU)

Help a creator establish reusable channel context without forcing a filename or template. Write questions and profile content in natural Russian unless another language is requested.

## First resolve existing material

Read [profile resolution](references/profile-resolution.md) before choosing a source. A user-supplied `voice.md`, brand guide or equivalent file takes priority and can be used directly. If the user only wants to use an existing file, select it and continue their content task; do not run a setup interview or create another copy.

For an explicit update, read the existing profile, preserve unrelated details and change only the requested parts. Conflicting profiles for different channels need a source choice, not an automatic merge.

## Build a profile when requested

Start with what the conversation and supplied material already establish. Offer two input methods: a short interview, or extracting a draft from the author's examples. The user can combine them. One useful sample is enough to start; do not require three videos or a channel that already exists.

For an interview, ask one compact batch covering only missing essentials:

- Channel topic and the viewer's level or situation.
- Tone and address: formal or conversational, Russian informal or formal second person, humor and words to avoid.
- Typical formats and what the author wants the viewer to gain.

Follow up only where the answer materially changes the profile. Region, timezone, budget, equipment and production hours are optional; ask when a task needs them. Do not infer geography from Russian language.

For extraction, read accessible scripts, transcripts, replies or style documents. Identify recurring language and structure. Label inferred preferences as provisional and separate the author's words from quoted guests or external examples. A competitor's video is a reference, not evidence of the user's voice. Never invent personal experience, metrics, credentials or promises.

## Deliver and save

Produce a compact profile with useful sections, adapting the structure to the supplied document:

- Channel and audience.
- Language, tone, address and representative phrases.
- Preferred and avoided wording.
- Formats and production constraints, if known.
- Verified author facts, permitted claims and real links.
- Open questions or provisional inferences, only if relevant.

If the user requested a file, save it at their chosen path. For a new profile with no path specified, use `youtube/voice.md` in the user's current project as a convenience default, not a requirement. Do not replace an existing file belonging to another channel. If the destination already exists and the request does not authorize updating it, ask whether to update that file or choose another path. Never write into the installed skill directory or a global profile location by default.

If the user requested only a draft, return it in the conversation without writing a file. State the exact saved or selected path when applicable. Tell the user they can supply this file under any name in later tasks; no renaming or copying into a special location is necessary. Do not promise cross-session memory or create hidden selection state.
