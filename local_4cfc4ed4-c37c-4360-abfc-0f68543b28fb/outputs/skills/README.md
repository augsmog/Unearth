# Web Discovery Platform — Claude Code Skills

These skills are designed for use with Claude Code to accelerate development of the web discovery platform. Each skill provides domain-specific instructions, patterns, and reference material that Claude loads on-demand when relevant.

## Installation

Copy the skill directories into your project's `.claude/skills/` folder:

```bash
# From your project root
mkdir -p .claude/skills
cp -r skills/pack-ux .claude/skills/
cp -r skills/content-pipeline .claude/skills/
cp -r skills/supabase-schema .claude/skills/
cp -r skills/nextjs-app .claude/skills/
```

Or for personal (cross-project) availability:

```bash
cp -r skills/* ~/.claude/skills/
```

## Skills Overview

### `pack-ux`
The core UX mechanic — trading card pack opening with Framer Motion animations, card selection, keep/pass logic, and mobile swipe interactions.

**Triggers on:** cards, packs, keep, open pack, card flip, discovery UX, animations

### `content-pipeline`
The automated content sourcing, AI quality scoring (1–100), metadata tagging, and adaptive human review system.

**Triggers on:** scoring, content quality, site approval, crawling, scraping, pipeline

### `supabase-schema`
Database schema, RLS policies, auth configuration, migration patterns, and common query patterns.

**Triggers on:** database, schema, migration, RLS, auth, Supabase, SQL

### `nextjs-app`
Project-level conventions: file structure, server/client component patterns, routing, middleware, and Tailwind theme configuration.

**Triggers on:** routing, layout, middleware, server component, app architecture

## How Skills Work

1. **Metadata** (name + description) is always in Claude's context — lightweight discovery
2. **SKILL.md body** loads when Claude determines the skill is relevant to your request
3. **Reference files** (in `references/`) load only when specifically needed

You can also invoke any skill directly:
```
/pack-ux
/content-pipeline
/supabase-schema
/nextjs-app
```
