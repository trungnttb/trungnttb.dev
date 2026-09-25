---
title: Delete local branches already merged into main
description: One-liner to clean up branches that were merged.
lang: bash
date: 2026-09-18
tags: [git, cleanup]
---

```bash
git fetch --prune
git branch --merged main | grep -vE '^\*|\bmain$' | xargs -r git branch -d
```
