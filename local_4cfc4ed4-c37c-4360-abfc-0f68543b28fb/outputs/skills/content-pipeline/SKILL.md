---
name: content-pipeline
description: "Builds and manages the automated content sourcing, AI quality scoring, metadata tagging, and human review pipeline for the web discovery platform. Use this skill when working on site crawling/scraping, the quality scoring engine (1–100 scale), AI-generated content detection, automated metadata extraction, the admin review dashboard, the adaptive learning loop, or anything related to how websites enter the discovery pool. Also trigger for 'scoring', 'content quality', 'site approval', 'crawling', 'scraping', or 'pipeline', even if not explicitly named."
---

# Content Pipeline Skill

This skill covers the system that discovers, evaluates, tags, and approves websites for the discovery platform's content pool.

## Pipeline Architecture

```
Sources (automated) → Scraper/Fetcher → AI Quality Scorer → Decision Router
                                                               ├── Auto-approve (85–100)
                                                               ├── Human review (30–84) → Admin Dashboard
                                                               └── Auto-reject (1–29)
                                                                        ↓
                                                              Approved Sites
                                                                        ↓
                                                           Metadata Tagger → Content Pool
```

## Content Sources

Build individual fetcher modules for each source. Each module should output a standardized `RawSite` object.

```typescript
interface RawSite {
  url: string;
  title: string;
  description?: string;
  source: 'product_hunt' | 'hacker_news' | 'indie_hackers' | 'github_trending' | 'awesome_list' | 'user_submission' | 'rss_feed';
  sourceUrl?: string;        // where we found it
  fetchedAt: Date;
  rawHtml?: string;          // full page HTML for analysis
  rawText?: string;          // extracted text content
}
```

### Source Modules to Build

1. **Product Hunt** — Use their GraphQL API or scrape daily/weekly top posts
2. **Hacker News** — Use the Firebase API (`https://hacker-news.firebaseio.com/v0/`). Filter Show HN and top stories with external URLs
3. **GitHub Trending** — Scrape `github.com/trending` or use unofficial API
4. **Awesome Lists** — Parse curated GitHub awesome-* repos for URLs
5. **RSS/Blog Feeds** — OPML import or manual feed list, parse with a feed parser
6. **User Submissions** — Web form that creates a `RawSite` with source='user_submission'

Each fetcher runs on a schedule (cron or Supabase Edge Function) and deduplicates against existing URLs in the database before inserting.

## AI Quality Scoring Engine

The scorer uses the Claude API to evaluate each site. The prompt should assess six dimensions and return a structured score.

### Scoring Dimensions (7-Dimension Model — Phase 1.5)

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Content Originality | 22% | Original writing vs. AI-generated/regurgitated text |
| Human Presence | 18% | Real person signals: about page, author bio, social links, personal voice |
| Content Depth | 18% | Substantive content vs. thin SEO filler |
| Design Quality | 13% | Intentional design vs. zero-effort template |
| Domain Signals | 9% | Domain age, backlinks, mentions on trusted sources |
| Uniqueness | 9% | Offers something a ChatGPT query can't provide |
| Cold Open Quality | 11% | How instantly engaging the site is for a zero-context first visit (scored separately from quality_score) |

### Scoring Prompt Structure

Send the Claude API a structured prompt with the site's extracted text, URL, and any available metadata. Request a JSON response:

```json
{
  "overall_score": 78,
  "dimensions": {
    "content_originality": { "score": 82, "reasoning": "..." },
    "human_presence": { "score": 90, "reasoning": "..." },
    "content_depth": { "score": 75, "reasoning": "..." },
    "design_quality": { "score": 65, "reasoning": "..." },
    "domain_signals": { "score": 60, "reasoning": "..." },
    "uniqueness": { "score": 70, "reasoning": "..." },
    "cold_open_quality": { "score": 55, "reasoning": "..." }
  },
  "ai_content_likelihood": "low",
  "summary": "Brief assessment of the site",
  "recommended_categories": ["indie-tools", "developer"],
  "recommended_tags": ["productivity", "mac", "launcher", "developer-tools"],
  "engagement_format": "tool",
  "rabbit_hole_depth_potential": 3
}
```

The `ai_content_likelihood` field is critical — it's a separate assessment from originality that specifically flags likely AI-generated content. Values: "very_low", "low", "medium", "high", "very_high".

### Additional Scorer Outputs (Phase 1.5)

- **`cold_open_score`**: Stored separately on `sites` — a brilliant essay with cold_open 35 can still have quality_score 90+
- **`engagement_format`**: One of `instant|visual|read-short|read-long|tool|explore` — used for format-aware personalization
- **`rabbit_hole_depth_potential`**: 1-5 scale — how many meaningful thematic connections this site can anchor

### Decision Routing

```python
def route_site(score: int) -> str:
    if score >= 85:
        return "auto_approve"
    elif score >= 30:
        return "human_review"
    else:
        return "auto_reject"
```

These thresholds are the starting point. They adjust over time based on the adaptive learning loop.

## Adaptive Learning Loop

This is what makes the pipeline scale. The founder reviews sites in the 30–84 band and their decisions calibrate the scoring engine.

### How It Works

1. Sites scoring 30–84 enter the `human_review` queue
2. Founder reviews each site in the admin dashboard (approve/reject with optional notes)
3. Each decision is stored in `scoring_decisions` with the full feature vector
4. Periodically (weekly or after N decisions), run a calibration analysis:
   - Compare founder decisions against the AI scores
   - Identify patterns: "founder approves most sites above 70" → raise auto-approve to 75
   - Identify blind spots: "AI scores design blogs low on depth but founder always approves" → adjust depth weight for blog-type content
5. Update scoring weights and thresholds
6. Goal: reach 80%+ auto-processing within 3 months

### Calibration Data Schema

```typescript
interface ScoringDecision {
  id: string;
  siteId: string;
  aiScore: number;
  aiDimensions: Record<string, { score: number; reasoning: string }>;
  decision: 'approve' | 'reject';
  decidedBy: 'auto' | 'founder';
  founderNotes?: string;
  createdAt: Date;
}
```

## Automated Metadata Tagging

After a site is approved, generate structured metadata using Claude API:

```typescript
interface SiteMetadata {
  title: string;              // extracted or AI-generated
  description: string;        // one-line summary (max 120 chars)
  categories: string[];       // 2–3 from controlled taxonomy
  tags: string[];             // 5–10 freeform tags for recommendation
  contentType: 'tool' | 'blog' | 'portfolio' | 'resource' | 'community' | 'saas' | 'other';
  readingTimeMinutes?: number; // for content-heavy sites
  thumbnailUrl?: string;      // from screenshot API
  adjacencyTags: string[];    // 5-15 tags describing what the site is ADJACENT TO (Phase 1.5)
}
```

### Adjacency Tags (Phase 1.5)

The tagger also generates 5-15 `adjacencyTags` — what the site is ADJACENT TO, not what it IS. These power the site adjacency graph for rabbit hole chaining.

Example: A neural net visualization site → adjacencyTags: `['creative-coding', 'data-art', 'ai-research', 'generative-art', 'python-ecosystem']`

### Edge Generator (Phase 1.5)

After tagging, the edge generator (`edgeGenerator.ts`) computes bidirectional weighted edges between sites:
- Tag overlap: `(siteA.adjacency_tags ∩ siteB.tags) + (adjacency_tags ∩ adjacency_tags) + (tags ∩ adjacency_tags)`
- Weight formula: `min(1.0, tag_overlap * 0.15 + category_overlap * 0.15)`
- Format diversity bonus: +0.1 for different engagement_format
- Only creates edges where weight >= 0.2

### Screenshot Generation

Use a screenshot API (ScreenshotOne, Screenshotapi.net, or self-hosted with Playwright) to capture site thumbnails. Store in Supabase Storage.

```typescript
async function captureScreenshot(url: string): Promise<string> {
  // Call screenshot API
  // Upload to Supabase Storage
  // Return public URL
}
```

## Admin Dashboard

Build as a protected route in the Next.js app (`/admin/review`).

### Review Queue View
- List of sites pending review, sorted by score (highest first)
- Each item shows: thumbnail, title, URL, AI score, top scoring dimensions
- Quick actions: Approve / Reject / Skip
- Expand to see full AI reasoning and dimension breakdown
- Filter by: score range, source, content type, AI content likelihood
- The founder's notes field for capturing reasoning (feeds back into calibration)

### Dashboard Stats
- Total sites in pool
- Sites pending review
- Auto-approve rate this week
- Score distribution chart
- Source breakdown

## File Organization

```
src/
├── lib/
│   └── pipeline/
│       ├── fetchers/
│       │   ├── productHunt.ts
│       │   ├── hackerNews.ts
│       │   ├── githubTrending.ts
│       │   ├── awesomeLists.ts
│       │   └── rssFeed.ts
│       ├── scorer.ts           (AI quality scoring via Claude API)
│       ├── tagger.ts           (automated metadata tagging)
│       ├── router.ts           (decision routing logic)
│       ├── edgeGenerator.ts    (site adjacency graph edge computation — Phase 1.5)
│       ├── calibrator.ts       (adaptive threshold calibration)
│       └── screenshot.ts       (thumbnail capture)
├── lib/
│   └── rabbitHole/
│       ├── engine.ts           (rabbit hole chaining engine — Phase 1.5)
│       └── formatAffinity.ts   (user format preference tracking — Phase 1.5)
├── app/
│   └── admin/
│       └── review/
│           ├── page.tsx        (review queue)
│           └── components/
│               ├── ReviewCard.tsx
│               ├── ScoreBreakdown.tsx
│               └── DashboardStats.tsx
```

## For the interest taxonomy and category system, see [references/taxonomy.md](references/taxonomy.md)
