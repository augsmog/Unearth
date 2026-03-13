import Anthropic from '@anthropic-ai/sdk';
import type { ContentType } from '@/types';

const anthropic = new Anthropic();

export interface TaggingResult {
  categories: string[];
  tags: string[];
  contentType: ContentType;
  description: string;
  adjacencyTags: string[];
}

const TAXONOMY = [
  'Technology',
  'Design',
  'Engineering',
  'Science',
  'Business',
  'Startups',
  'Art',
  'Writing',
  'Education',
  'Finance',
  'Health',
  'Gaming',
  'Music',
  'Photography',
  'Data',
  'AI & ML',
  'Open Source',
  'Productivity',
  'Culture',
  'Environment',
  'Privacy & Security',
  'Developer Tools',
  'Creative Tools',
  'Community',
  'Research',
];

const CONTENT_TYPES: ContentType[] = [
  'article',
  'tool',
  'video',
  'podcast',
  'newsletter',
  'course',
  'community',
  'repository',
  'other',
];

const TAGGING_PROMPT = `You are a metadata tagger for Unearth, a curated web discovery platform that surfaces individual PAGES — not entire websites.

Given a page URL and its content, produce structured metadata about THIS SPECIFIC PAGE.

## Rules

1. **categories**: Pick 2-3 from this taxonomy: ${TAXONOMY.join(', ')}
2. **tags**: Generate 5-10 freeform descriptive tags (lowercase, hyphen-separated for multi-word). Tag the specific page content, not the parent site.
3. **contentType**: Pick exactly one from: ${CONTENT_TYPES.join(', ')}
4. **description**: Write a compelling description of max 120 characters about what THIS PAGE offers. Be specific — mention the actual topic, not the site.
5. **adjacencyTags**: Generate 5-15 adjacency tags. These describe what this page is ADJACENT TO — not what it IS. Answer: "If someone liked this page, what other TOPICS, VIBES, or AUDIENCE TYPES would they also be interested in?" Example: A page about neural network visualizations might have tags: ['neural-networks', 'machine-learning', 'visualization'] but adjacencyTags: ['creative-coding', 'data-art', 'ai-research', 'computational-creativity', 'mathematics', 'generative-art', 'python-ecosystem']

## Response Format

Respond with ONLY valid JSON:
{
  "categories": ["Category1", "Category2"],
  "tags": ["tag-one", "tag-two", "tag-three", "tag-four", "tag-five"],
  "contentType": "article",
  "description": "A concise, compelling description under 120 chars.",
  "adjacencyTags": ["adjacent-topic-one", "adjacent-vibe-two", "adjacent-audience-three"]
}`;

export async function tagSite(
  url: string,
  description: string,
  title: string
): Promise<TaggingResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `${TAGGING_PROMPT}

## Site to Tag

**URL:** ${url}
**Title:** ${title}
**Description/Content:** ${description.slice(0, 2000)}`,
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Tagger did not return valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    categories: string[];
    tags: string[];
    contentType: string;
    description: string;
    adjacencyTags: string[];
  };

  // Validate categories against taxonomy
  const validCategories = parsed.categories.filter((c) =>
    TAXONOMY.includes(c)
  );

  // Validate content type
  const validContentType = CONTENT_TYPES.includes(
    parsed.contentType as ContentType
  )
    ? (parsed.contentType as ContentType)
    : 'other';

  // Enforce description length
  const trimmedDescription = parsed.description.slice(0, 120);

  // Validate adjacency tags: lowercase hyphenated strings, 5-15 items
  const rawAdjacencyTags = Array.isArray(parsed.adjacencyTags) ? parsed.adjacencyTags : [];
  const validAdjacencyTags = rawAdjacencyTags
    .map((t) => t.toLowerCase().trim().replace(/\s+/g, '-'))
    .filter((t) => /^[a-z0-9-]+$/.test(t));
  const adjacencyTags = validAdjacencyTags.length >= 5
    ? validAdjacencyTags.slice(0, 15)
    : validAdjacencyTags;

  return {
    categories: validCategories.length > 0 ? validCategories.slice(0, 3) : ['Technology'],
    tags: parsed.tags.slice(0, 10).map((t) => t.toLowerCase().trim()),
    contentType: validContentType,
    description: trimmedDescription,
    adjacencyTags,
  };
}
