/**
 * Mainstream domain blocklist.
 *
 * Sites on this list are auto-rejected before scoring to save API calls.
 * These are well-known brands that tech-savvy users already know about —
 * Unearth should surface indie, obscure, hard-to-find gems instead.
 */

const BLOCKED_DOMAINS: string[] = [
  // Major media brands
  'theverge.com',
  'wired.com',
  'techcrunch.com',
  'mashable.com',
  'engadget.com',
  'arstechnica.com',
  'gizmodo.com',
  'theringer.com',
  'fivethirtyeight.com',
  'outsideonline.com',
  'nationalgeographic.com',
  'thedodo.com',
  'scarymommy.com',
  'electrek.co',
  'thedrive.com',
  'seriouseats.com',
  'buzzfeed.com',
  'huffpost.com',
  'vox.com',
  'vice.com',
  'slate.com',
  'salon.com',
  'cnet.com',
  'zdnet.com',
  'theguardian.com',
  'nytimes.com',
  'washingtonpost.com',
  'bbc.com',
  'bbc.co.uk',
  'cnn.com',
  'forbes.com',
  'businessinsider.com',

  // Well-known platforms / tools
  'notion.so',
  'dribbble.com',
  'behance.net',
  'awwwards.com',
  'khanacademy.org',
  'brilliant.org',
  'coursera.org',
  'udemy.com',
  'skillshare.com',
  'medium.com',
  'substack.com',
  'dev.to',
  'hashnode.dev',
  'producthunt.com',
  'huggingface.co',
  'kaggle.com',
  'stackoverflow.com',
  'github.com',
  'gitlab.com',
  'figma.com',
  'canva.com',

  // Celebrity podcasters & major newsletters
  'lexfridman.com',
  'tldr.tech',
  'morningbrew.com',

  // Well-known in tech circles
  'levels.fyi',
  'atlasobscura.com',
  'css-tricks.com',
  'smashingmagazine.com',
  'remoteok.com',

  // Major gaming/creative platforms
  'itch.io',
  'twitch.tv',
  'discord.com',
  'reddit.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'pinterest.com',
  'linkedin.com',

  // Major e-commerce / consumer
  'amazon.com',
  'etsy.com',
  'shopify.com',
  'ebay.com',
];

/**
 * Extract the registrable domain from a URL (strips www. and subdomains for
 * two-part TLDs). Good enough for blocklist matching without a full PSL
 * library.
 */
function extractDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    // Strip www.
    const noWww = hostname.replace(/^www\./, '');
    // Handle co.uk style TLDs
    const parts = noWww.split('.');
    if (parts.length >= 3 && parts[parts.length - 2] === 'co') {
      return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
  } catch {
    return null;
  }
}

/**
 * Check if a URL belongs to a blocked mainstream domain.
 */
export function isBlockedDomain(url: string): boolean {
  const domain = extractDomain(url);
  if (!domain) return false;
  return BLOCKED_DOMAINS.includes(domain);
}

/**
 * Get the full blocklist (for admin display, etc.)
 */
export function getBlockedDomains(): string[] {
  return [...BLOCKED_DOMAINS];
}
