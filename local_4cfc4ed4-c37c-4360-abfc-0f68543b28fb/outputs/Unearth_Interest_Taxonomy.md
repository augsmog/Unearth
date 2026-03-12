# Unearth — Interest Taxonomy

## UX Behavior

**Onboarding screen:** Users see 18 parent categories displayed as visual tiles (icon + name) in a scrollable grid. Selecting a parent category automatically enables all its subcategories. Users can then expand any parent to see and individually uncheck subcategories they don't want.

**Minimum selection:** 3 parent categories (or equivalent subcategory coverage across at least 3 parents).

**Post-onboarding:** Users can revisit their interests from Profile → Interests at any time. The same parent/child checkbox UI applies, with their current selections preserved.

**Indeterminate state:** If a user unchecks some but not all children under a parent, the parent shows an indeterminate checkbox (dash instead of check) to indicate partial selection.

**Onboarding layout:** 18 tiles in a responsive scrollable grid (3 columns on mobile, 4 on tablet, 6 on desktop). Each tile shows the parent icon and name. Tiles have a selected/unselected visual state. With 18 categories, the grid will scroll on mobile — that's fine, just ensure the top 2 rows are visible without scrolling so the screen doesn't feel empty on load.

---

## Taxonomy (18 Parent Categories, 108 Subcategories)

### 1. Technology
*Icon: ⚡ | Slug: `technology`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| AI & Machine Learning | `ai-ml` | AI tools, research, generative AI, LLMs, computer vision |
| Developer Tools | `developer-tools` | IDEs, CLIs, libraries, frameworks, developer experience |
| New Product Launches | `new-products` | Freshly launched apps, tools, and platforms |
| Open Source | `open-source` | Open-source projects, communities, and contributions |
| Cybersecurity & Privacy | `cybersecurity-privacy` | Security tools, privacy-first products, encryption, VPNs |
| Mobile & Apps | `mobile-apps` | iOS, Android, cross-platform apps and mobile-first tools |

### 2. Design & Creative
*Icon: 🎨 | Slug: `design-creative`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Web Design | `web-design` | Site design, CSS art, layout inspiration, landing pages |
| UI/UX | `ui-ux` | Interface design, user research, interaction patterns |
| Graphic Design | `graphic-design` | Branding, visual identity, print design, logo work |
| Typography & Fonts | `typography-fonts` | Typeface design, font libraries, lettering |
| 3D & Motion Design | `3d-motion` | 3D modeling, motion graphics, animation tools |
| Design Inspiration | `design-inspiration` | Galleries, portfolios, design showcases, awards |

### 3. Startups & Business
*Icon: 🚀 | Slug: `startups-business`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Indie Hacking & Solopreneurs | `indie-hacking` | Solo builders, bootstrapped products, build-in-public |
| SaaS & Products | `saas-products` | Software products, micro-SaaS, product strategy |
| Marketing & Growth | `marketing-growth` | Growth tactics, SEO, content marketing, distribution |
| E-commerce | `ecommerce` | Online stores, DTC brands, Shopify ecosystem |
| Venture & Fundraising | `venture-fundraising` | Startup funding, investor resources, pitch decks |
| Analytics & Data | `analytics-data` | Business intelligence, metrics, dashboards, data tools |

### 4. Sports & Athletics
*Icon: ⚽ | Slug: `sports-athletics`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Team Sports | `team-sports` | Football, basketball, soccer, baseball, hockey, rugby |
| Individual Sports | `individual-sports` | Tennis, golf, swimming, track & field, cycling |
| Combat & Martial Arts | `combat-sports` | MMA, boxing, wrestling, martial arts disciplines |
| Outdoor & Adventure Sports | `outdoor-adventure` | Hiking, climbing, surfing, skiing, extreme sports |
| Fantasy & Sports Analytics | `fantasy-analytics` | Fantasy leagues, sports data, performance analytics |
| Fitness & Training | `fitness-training` | Workout programs, athletic training, sports science |

### 5. Finance & Money
*Icon: 💰 | Slug: `finance-money`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Personal Finance | `personal-finance` | Budgeting, saving, debt management, financial literacy |
| Investing | `investing` | Stock market, ETFs, portfolio strategy, value investing |
| Crypto & Web3 | `crypto-web3` | Cryptocurrency, blockchain, DeFi, NFTs, DAOs |
| Economics | `economics` | Macro/micro economics, economic theory, policy analysis |
| Financial Tools | `financial-tools` | Fintech products, banking apps, payment platforms |
| Real Estate | `real-estate` | Property investing, housing market, real estate tech |

### 6. Science & Nature
*Icon: 🔬 | Slug: `science-nature`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Space & Astronomy | `space-astronomy` | Space exploration, astrophysics, satellite imagery |
| Climate & Environment | `climate-environment` | Climate science, sustainability tech, conservation |
| Biology & Health | `biology-health` | Life sciences, biotech, medical research, health tech |
| Physics & Engineering | `physics-engineering` | Applied physics, engineering marvels, material science |
| Psychology & Behavior | `psychology-behavior` | Cognitive science, behavioral research, decision-making |
| Math & Logic | `math-logic` | Mathematics, puzzles, data science foundations |

### 7. Arts & Expression
*Icon: 🎭 | Slug: `arts-expression`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Visual Art & Illustration | `visual-art` | Digital art, traditional art, illustration, galleries |
| Music & Audio | `music-audio` | Music creation, audio tools, sound design, artists |
| Film & Video | `film-video` | Filmmaking, short films, video essays, cinematography |
| Photography | `photography` | Photo galleries, technique, gear, street photography |
| Writing & Literature | `writing-literature` | Creative writing, poetry, fiction, literary magazines |
| Animation | `animation` | 2D/3D animation, motion art, animated storytelling |

### 8. News & Current Events
*Icon: 🌍 | Slug: `news-current-events`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| World Affairs | `world-affairs` | International news, geopolitics, global issues |
| Politics & Policy | `politics-policy` | Political analysis, legislation, governance, elections |
| Business & Market News | `business-news` | Corporate news, market movements, industry trends |
| Science & Tech News | `science-tech-news` | Research breakthroughs, tech industry developments |
| Local & Community News | `local-news` | Hyperlocal reporting, community journalism, city guides |

### 9. Humor & Entertainment
*Icon: 😂 | Slug: `humor-entertainment`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Comedy & Satire | `comedy-satire` | Humor writing, satirical sites, comedy publications |
| Pop Culture | `pop-culture` | Celebrity, TV, movies, music news, trending culture |
| Memes & Internet Humor | `memes-humor` | Meme culture, shitposting, absurdist humor |
| Reviews & Criticism | `reviews-criticism` | Film/TV/music/game reviews, critics, rating sites |
| Quizzes & Fun | `quizzes-fun` | Interactive quizzes, personality tests, fun tools |

### 10. Culture & Ideas
*Icon: 💡 | Slug: `culture-ideas`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Internet Culture | `internet-culture` | Digital communities, online trends, web history |
| Philosophy & Ethics | `philosophy-ethics` | Big questions, moral reasoning, thought experiments |
| History | `history` | Historical deep dives, archival sites, timelines |
| Social Commentary | `social-commentary` | Opinion, cultural criticism, societal analysis |
| Futurism & Speculation | `futurism` | Future tech, speculative design, sci-fi-adjacent thinking |
| World Cultures | `world-cultures` | Cultural exploration, traditions, global perspectives |

### 11. Lifestyle & Wellness
*Icon: 🌿 | Slug: `lifestyle-wellness`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Food & Cooking | `food-cooking` | Recipes, food culture, restaurants, culinary technique |
| Travel & Places | `travel-places` | Destinations, travel guides, hidden gems, maps |
| Fashion & Style | `fashion-style` | Style guides, streetwear, sustainable fashion |
| Home & DIY | `home-diy` | Interior design, home improvement, maker projects |
| Sustainability | `sustainability` | Eco-friendly living, zero waste, ethical consumption |
| Mindfulness & Spirituality | `mindfulness-spirituality` | Meditation, wellness practices, spiritual exploration |

### 12. Pets & Animals
*Icon: 🐾 | Slug: `pets-animals`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Dogs | `dogs` | Dog breeds, training, care, dog culture |
| Cats | `cats` | Cat care, behavior, breeds, cat internet culture |
| Exotic & Unusual Pets | `exotic-pets` | Reptiles, birds, fish, small mammals, exotic care |
| Wildlife & Conservation | `wildlife-conservation` | Wild animals, nature documentaries, conservation efforts |
| Veterinary & Pet Health | `vet-pet-health` | Pet health, nutrition, veterinary resources |

### 13. Parenting & Family
*Icon: 👨‍👩‍👧‍👦 | Slug: `parenting-family`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Baby & Toddler | `baby-toddler` | Newborn care, early development, baby gear reviews |
| Kids Activities & Education | `kids-activities` | Learning resources, activities, educational tools for children |
| Teen & Tween | `teen-tween` | Parenting teens, age-appropriate resources, youth culture |
| Family Life | `family-life` | Family routines, household management, relationship dynamics |
| Pregnancy & Fertility | `pregnancy-fertility` | Pregnancy guides, fertility resources, prenatal health |

### 14. Automotive & Transport
*Icon: 🚗 | Slug: `automotive-transport`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Electric Vehicles | `electric-vehicles` | EVs, charging infrastructure, EV reviews, Tesla & rivals |
| Cars & Trucks | `cars-trucks` | Auto reviews, car culture, restoration, performance |
| Motorcycles | `motorcycles` | Motorcycle culture, gear, riding, adventure touring |
| Aviation & Space Vehicles | `aviation` | Aircraft, drones, private aviation, aerospace |
| Future of Transport | `future-transport` | Autonomous vehicles, hyperloop, urban mobility, e-bikes |

### 15. Gaming & Interactive
*Icon: 🎮 | Slug: `gaming-interactive`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Indie Games | `indie-games` | Independent game releases, game jams, small studios |
| Game Development | `game-dev` | Game engines, dev tutorials, game design theory |
| Retro & Nostalgia | `retro-nostalgia` | Classic games, emulation, retro computing, pixel art |
| Interactive Experiences | `interactive-experiences` | Web experiments, interactive art, browser games |
| Esports & Competitive | `esports` | Competitive gaming, tournament coverage, strategy |

### 16. Learning & Knowledge
*Icon: 📚 | Slug: `learning-knowledge`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Online Courses | `online-courses` | Free and paid courses, MOOCs, educational platforms |
| Tutorials & How-To | `tutorials` | Step-by-step guides, technical walkthroughs |
| Data Visualization | `data-viz` | Infographics, interactive data, chart design |
| Language Learning | `language-learning` | Language tools, polyglot resources, linguistics |
| Book Recommendations | `book-recs` | Reading lists, book reviews, literary communities |
| Reference & Encyclopedic | `reference` | Wikis, databases, comprehensive reference sites |

### 17. Media & Journalism
*Icon: 📰 | Slug: `media-journalism`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Longform Writing | `longform` | In-depth articles, essays, narrative journalism |
| Newsletters | `newsletters` | Independent newsletters, Substack, email publications |
| Podcasts | `podcasts` | Podcast discovery, audio storytelling, interview series |
| Independent Media | `independent-media` | Indie publications, alternative press, citizen journalism |
| Investigative Reporting | `investigative` | Deep-dive investigations, data journalism, exposés |

### 18. Career & Professional
*Icon: 💼 | Slug: `career-professional`*

| Subcategory | Slug | Description |
|-------------|------|-------------|
| Remote Work | `remote-work` | Remote job resources, async culture, distributed teams |
| Freelancing & Consulting | `freelancing` | Freelancer tools, consulting guides, client management |
| Job Discovery | `job-discovery` | Niche job boards, hiring platforms, career opportunities |
| Professional Development | `professional-dev` | Skill building, leadership, career growth resources |
| Communities & Networking | `communities` | Professional communities, forums, Slack/Discord groups |
| Personal Branding | `personal-branding` | Portfolio building, online presence, thought leadership |

---

## Pack Generation Rules

When generating a pack for a user:

1. **Interest matching:** Select from approved sites whose categories overlap with the user's enabled subcategories
2. **Variety enforcement:** No more than 2 cards from the same parent category in a single pack
3. **Behavioral weighting:** Weight toward subcategories where the user has historically kept more cards
4. **De-duplication:** Never show a site the user has already seen in any previous pack
5. **Quality floor:** Only include sites with quality score ≥ 70 in packs (lower-scored approved sites appear in "deep dig" packs — a future feature)
6. **Serendipity factor:** 1 of 5 cards in each pack should be from outside the user's selected interests (controlled randomness to broaden horizons)

## Onboarding UI Spec

**Layout:** 18 tiles in a responsive scrollable grid (3 columns on mobile, 4 on tablet, 6 on desktop). Each tile shows the parent icon and name. Tiles have a selected/unselected visual state. On mobile, the grid scrolls — ensure the top 2 rows (6 tiles) are visible on load.

**Expansion:** Tapping a selected tile expands it inline or opens a bottom sheet (mobile) showing the subcategories as checkboxes, all checked by default. User can uncheck individual subcategories.

**Minimum:** "Select at least 3 categories to continue" — the CTA button remains disabled until 3+ parents are selected.

**Skip option:** "Skip for now — we'll learn as you explore" text link below the CTA for users who want to dive right in. In this case, the system uses a broad default selection across all categories.
