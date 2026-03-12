-- 004_seed_interests.sql
-- Seed 18 parent interest categories and 108 subcategories

-- ============================================================
-- Parent categories
-- ============================================================

INSERT INTO interests (name, slug, icon, position) VALUES
  ('Technology', 'technology', '⚡', 0),
  ('Design & Creative', 'design-creative', '🎨', 1),
  ('Startups & Business', 'startups-business', '🚀', 2),
  ('Science & Nature', 'science-nature', '🔬', 3),
  ('Arts & Expression', 'arts-expression', '🎭', 4),
  ('Culture & Ideas', 'culture-ideas', '💡', 5),
  ('Lifestyle & Wellness', 'lifestyle-wellness', '🌿', 6),
  ('Gaming & Interactive', 'gaming-interactive', '🎮', 7),
  ('Sports & Athletics', 'sports-athletics', '⚽', 8),
  ('Finance & Money', 'finance-money', '💰', 9),
  ('News & Current Events', 'news-current-events', '🌍', 10),
  ('Humor & Entertainment', 'humor-entertainment', '😂', 11),
  ('Pets & Animals', 'pets-animals', '🐾', 12),
  ('Parenting & Family', 'parenting-family', '👨‍👩‍👧‍👦', 13),
  ('Automotive & Transport', 'automotive-transport', '🚗', 14),
  ('Learning & Knowledge', 'learning-knowledge', '📚', 15),
  ('Media & Journalism', 'media-journalism', '📰', 16),
  ('Career & Professional', 'career-professional', '💼', 17);

-- ============================================================
-- Subcategories
-- ============================================================

-- Technology
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('AI & Machine Learning', 'ai-ml', '🤖', 0),
  ('Developer Tools', 'developer-tools', '🛠️', 1),
  ('New Product Launches', 'new-products', '🆕', 2),
  ('Open Source', 'open-source', '📂', 3),
  ('Cybersecurity & Privacy', 'cybersecurity-privacy', '🔒', 4),
  ('Mobile & Apps', 'mobile-apps', '📱', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'technology';

-- Design & Creative
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Web Design', 'web-design', '🌐', 0),
  ('UI/UX', 'ui-ux', '🖱️', 1),
  ('Graphic Design', 'graphic-design', '🖌️', 2),
  ('Typography & Fonts', 'typography-fonts', '🔤', 3),
  ('3D & Motion Design', '3d-motion-design', '🎬', 4),
  ('Design Inspiration', 'design-inspiration', '✨', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'design-creative';

-- Startups & Business
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Indie Hacking & Solopreneurs', 'indie-hacking-solopreneurs', '🧑‍💻', 0),
  ('SaaS & Products', 'saas-products', '📦', 1),
  ('Marketing & Growth', 'marketing-growth', '📈', 2),
  ('E-commerce', 'e-commerce', '🛒', 3),
  ('Venture & Fundraising', 'venture-fundraising', '💵', 4),
  ('Analytics & Data', 'analytics-data', '📊', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'startups-business';

-- Science & Nature
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Space & Astronomy', 'space-astronomy', '🌌', 0),
  ('Climate & Environment', 'climate-environment', '🌡️', 1),
  ('Biology & Health', 'biology-health', '🧬', 2),
  ('Physics & Engineering', 'physics-engineering', '⚙️', 3),
  ('Psychology & Behavior', 'psychology-behavior', '🧠', 4),
  ('Math & Logic', 'math-logic', '🔢', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'science-nature';

-- Arts & Expression
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Visual Art & Illustration', 'visual-art-illustration', '🎨', 0),
  ('Music & Audio', 'music-audio', '🎵', 1),
  ('Film & Video', 'film-video', '🎥', 2),
  ('Photography', 'photography', '📷', 3),
  ('Writing & Literature', 'writing-literature', '✍️', 4),
  ('Animation', 'animation', '🎞️', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'arts-expression';

-- Culture & Ideas
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Internet Culture', 'internet-culture', '🌐', 0),
  ('Philosophy & Ethics', 'philosophy-ethics', '🤔', 1),
  ('History', 'history', '📜', 2),
  ('Social Commentary', 'social-commentary', '💬', 3),
  ('Futurism & Speculation', 'futurism-speculation', '🔮', 4),
  ('World Cultures', 'world-cultures', '🗺️', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'culture-ideas';

-- Lifestyle & Wellness
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Food & Cooking', 'food-cooking', '🍳', 0),
  ('Travel & Places', 'travel-places', '✈️', 1),
  ('Fashion & Style', 'fashion-style', '👗', 2),
  ('Home & DIY', 'home-diy', '🏠', 3),
  ('Sustainability', 'sustainability', '♻️', 4),
  ('Mindfulness & Spirituality', 'mindfulness-spirituality', '🧘', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'lifestyle-wellness';

-- Gaming & Interactive (5 subcategories)
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Indie Games', 'indie-games', '🕹️', 0),
  ('Game Development', 'game-development', '🎯', 1),
  ('Retro & Nostalgia', 'retro-nostalgia', '👾', 2),
  ('Interactive Experiences', 'interactive-experiences', '🖥️', 3),
  ('Esports & Competitive', 'esports-competitive', '🏆', 4)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'gaming-interactive';

-- Sports & Athletics
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Team Sports', 'team-sports', '🏀', 0),
  ('Individual Sports', 'individual-sports', '🎾', 1),
  ('Combat & Martial Arts', 'combat-martial-arts', '🥊', 2),
  ('Outdoor & Adventure Sports', 'outdoor-adventure-sports', '🧗', 3),
  ('Fantasy & Sports Analytics', 'fantasy-sports-analytics', '📊', 4),
  ('Fitness & Training', 'fitness-training', '💪', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'sports-athletics';

-- Finance & Money
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Personal Finance', 'personal-finance', '🏦', 0),
  ('Investing', 'investing', '📈', 1),
  ('Crypto & Web3', 'crypto-web3', '🪙', 2),
  ('Economics', 'economics', '🏛️', 3),
  ('Financial Tools', 'financial-tools', '🧮', 4),
  ('Real Estate', 'real-estate', '🏘️', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'finance-money';

-- News & Current Events (5 subcategories)
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('World Affairs', 'world-affairs', '🌎', 0),
  ('Politics & Policy', 'politics-policy', '🏛️', 1),
  ('Business & Market News', 'business-market-news', '📰', 2),
  ('Science & Tech News', 'science-tech-news', '🔬', 3),
  ('Local & Community News', 'local-community-news', '🏘️', 4)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'news-current-events';

-- Humor & Entertainment (5 subcategories)
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Comedy & Satire', 'comedy-satire', '🎭', 0),
  ('Pop Culture', 'pop-culture', '🌟', 1),
  ('Memes & Internet Humor', 'memes-internet-humor', '🤣', 2),
  ('Reviews & Criticism', 'reviews-criticism', '⭐', 3),
  ('Quizzes & Fun', 'quizzes-fun', '🧩', 4)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'humor-entertainment';

-- Pets & Animals (5 subcategories)
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Dogs', 'dogs', '🐕', 0),
  ('Cats', 'cats', '🐈', 1),
  ('Exotic & Unusual Pets', 'exotic-unusual-pets', '🦎', 2),
  ('Wildlife & Conservation', 'wildlife-conservation', '🦁', 3),
  ('Veterinary & Pet Health', 'veterinary-pet-health', '🩺', 4)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'pets-animals';

-- Parenting & Family (5 subcategories)
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Baby & Toddler', 'baby-toddler', '👶', 0),
  ('Kids Activities & Education', 'kids-activities-education', '🎒', 1),
  ('Teen & Tween', 'teen-tween', '🧑', 2),
  ('Family Life', 'family-life', '🏡', 3),
  ('Pregnancy & Fertility', 'pregnancy-fertility', '🤰', 4)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'parenting-family';

-- Automotive & Transport (5 subcategories)
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Electric Vehicles', 'electric-vehicles', '⚡', 0),
  ('Cars & Trucks', 'cars-trucks', '🚙', 1),
  ('Motorcycles', 'motorcycles', '🏍️', 2),
  ('Aviation & Space Vehicles', 'aviation-space-vehicles', '✈️', 3),
  ('Future of Transport', 'future-of-transport', '🚄', 4)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'automotive-transport';

-- Learning & Knowledge
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Online Courses', 'online-courses', '🎓', 0),
  ('Tutorials & How-To', 'tutorials-how-to', '📝', 1),
  ('Data Visualization', 'data-visualization', '📊', 2),
  ('Language Learning', 'language-learning', '🗣️', 3),
  ('Book Recommendations', 'book-recommendations', '📖', 4),
  ('Reference & Encyclopedic', 'reference-encyclopedic', '📚', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'learning-knowledge';

-- Media & Journalism (5 subcategories)
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Longform Writing', 'longform-writing', '📝', 0),
  ('Newsletters', 'newsletters', '📬', 1),
  ('Podcasts', 'podcasts', '🎙️', 2),
  ('Independent Media', 'independent-media', '📡', 3),
  ('Investigative Reporting', 'investigative-reporting', '🔍', 4)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'media-journalism';

-- Career & Professional
INSERT INTO interests (name, slug, icon, parent_id, position)
SELECT sub.n, sub.s, sub.i, p.id, sub.pos FROM (VALUES
  ('Remote Work', 'remote-work', '🏠', 0),
  ('Freelancing & Consulting', 'freelancing-consulting', '🤝', 1),
  ('Job Discovery', 'job-discovery', '🔎', 2),
  ('Professional Development', 'professional-development', '📈', 3),
  ('Communities & Networking', 'communities-networking', '🌐', 4),
  ('Personal Branding', 'personal-branding', '🏷️', 5)
) AS sub(n, s, i, pos)
CROSS JOIN interests p WHERE p.slug = 'career-professional';
