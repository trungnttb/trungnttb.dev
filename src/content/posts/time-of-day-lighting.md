---
title: Lighting a scene by the viewer's clock
summary: Four lighting presets and a 30-minute blend around each boundary.
date: 2026-09-22
tags: [threejs, lighting]
---

This is a sample post. Replace it with your own writing.

The scene reads the viewer's local time and picks one of four presets: dawn, morning,
afternoon and night. Around each boundary the parameters blend over thirty minutes, so a tab left
open at 17:50 slowly gets darker.

```ts
const BOUNDARIES = [
  { at: 5 * 60, from: 'night', to: 'dawn' },
  { at: 7 * 60, from: 'dawn', to: 'morning' },
  { at: 12 * 60, from: 'morning', to: 'afternoon' },
  { at: 18 * 60, from: 'afternoon', to: 'night' },
] as const;
```

The blend itself is a smoothstep between two parameter sets:

```ts
const smoothstep = (t: number) => t * t * (3 - 2 * t);
```
