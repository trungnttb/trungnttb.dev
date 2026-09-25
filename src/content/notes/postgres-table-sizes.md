---
title: Largest tables in a Postgres database
description: List tables by total size, including indexes and TOAST.
lang: sql
date: 2026-09-21
tags: [postgres, sql]
---

```sql
SELECT relname AS table,
       pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;
```
