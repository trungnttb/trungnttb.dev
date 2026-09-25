---
title: Typed debounce
description: A dependency-free debounce that keeps the argument types.
lang: ts
date: 2026-09-19
tags: [typescript, utility]
---

```ts
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```
