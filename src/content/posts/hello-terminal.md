---
title: Hello from the terminal
summary: Why this portfolio is a desk that turns into a command line.
date: 2026-09-20
tags: [meta, astro, threejs]
---

This is a sample post. Replace it with your own writing.

The home page is a small voxel scene: a developer, a desk, a laptop and a cup of coffee.
Scroll down and the camera flies into the laptop screen, which becomes this terminal.

## How the pieces fit

- **Astro** builds every page statically.
- **Three.js** draws the desk scene, loaded only when you actually see it.
- **Shiki** highlights code at build time, so no highlighter ships to the browser.

```ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet('terminal'));
```

> Press `~` at any time to jump between the desk and the terminal.
