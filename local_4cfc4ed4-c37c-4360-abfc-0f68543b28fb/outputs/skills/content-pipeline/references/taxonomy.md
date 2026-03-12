# Unearth — Interest Taxonomy Reference

This is the controlled category taxonomy for Unearth. Categories are organized in a two-level hierarchy: 18 parent categories with 6–7 subcategories each (108 total).

## UX Behavior

Selecting a parent = all children enabled. Users can then uncheck individual subcategories. Partial selection shows indeterminate state on parent. Minimum 3 parents selected during onboarding.

## Taxonomy Structure

### 1. Technology (`technology`) ⚡
- AI & Machine Learning (`ai-ml`)
- Developer Tools (`developer-tools`)
- New Product Launches (`new-products`)
- Open Source (`open-source`)
- Cybersecurity & Privacy (`cybersecurity-privacy`)
- Mobile & Apps (`mobile-apps`)

### 2. Design & Creative (`design-creative`) 🎨
- Web Design (`web-design`)
- UI/UX (`ui-ux`)
- Graphic Design (`graphic-design`)
- Typography & Fonts (`typography-fonts`)
- 3D & Motion Design (`3d-motion`)
- Design Inspiration (`design-inspiration`)

### 3. Startups & Business (`startups-business`) 🚀
- Indie Hacking & Solopreneurs (`indie-hacking`)
- SaaS & Products (`saas-products`)
- Marketing & Growth (`marketing-growth`)
- E-commerce (`ecommerce`)
- Venture & Fundraising (`venture-fundraising`)
- Analytics & Data (`analytics-data`)

### 4. Science & Nature (`science-nature`) 🔬
- Space & Astronomy (`space-astronomy`)
- Climate & Environment (`climate-environment`)
- Biology & Health (`biology-health`)
- Physics & Engineering (`physics-engineering`)
- Psychology & Behavior (`psychology-behavior`)
- Math & Logic (`math-logic`)

### 5. Arts & Expression (`arts-expression`) 🎭
- Visual Art & Illustration (`visual-art`)
- Music & Audio (`music-audio`)
- Film & Video (`film-video`)
- Photography (`photography`)
- Writing & Literature (`writing-literature`)
- Animation (`animation`)

### 6. Culture & Ideas (`culture-ideas`) 💡
- Internet Culture (`internet-culture`)
- Philosophy & Ethics (`philosophy-ethics`)
- History (`history`)
- Social Commentary (`social-commentary`)
- Futurism & Speculation (`futurism`)
- World Cultures (`world-cultures`)

### 7. Lifestyle & Wellness (`lifestyle-wellness`) 🌿
- Food & Cooking (`food-cooking`)
- Travel & Places (`travel-places`)
- Fashion & Style (`fashion-style`)
- Home & DIY (`home-diy`)
- Sustainability (`sustainability`)
- Mindfulness & Spirituality (`mindfulness-spirituality`)

### 8. Gaming & Interactive (`gaming-interactive`) 🎮
- Indie Games (`indie-games`)
- Game Development (`game-dev`)
- Retro & Nostalgia (`retro-nostalgia`)
- Interactive Experiences (`interactive-experiences`)
- Esports & Competitive (`esports`)

### 9. Sports & Athletics (`sports-athletics`) ⚽
- Team Sports (`team-sports`)
- Individual Sports (`individual-sports`)
- Combat & Martial Arts (`combat-martial-arts`)
- Outdoor & Adventure Sports (`outdoor-adventure-sports`)
- Fantasy & Sports Analytics (`fantasy-sports-analytics`)
- Fitness & Training (`fitness-training`)

### 10. Finance & Money (`finance-money`) 💰
- Personal Finance (`personal-finance`)
- Investing (`investing`)
- Crypto & Web3 (`crypto-web3`)
- Economics (`economics`)
- Financial Tools (`financial-tools`)
- Real Estate (`real-estate`)

### 11. News & Current Events (`news-current-events`) 🌍
- World Affairs (`world-affairs`)
- Politics & Policy (`politics-policy`)
- Business & Market News (`business-market-news`)
- Science & Tech News (`science-tech-news`)
- Local & Community News (`local-community-news`)

### 12. Humor & Entertainment (`humor-entertainment`) 😂
- Comedy & Satire (`comedy-satire`)
- Pop Culture (`pop-culture`)
- Memes & Internet Humor (`memes-internet-humor`)
- Reviews & Criticism (`reviews-criticism`)
- Quizzes & Fun (`quizzes-fun`)

### 13. Pets & Animals (`pets-animals`) 🐾
- Dogs (`dogs`)
- Cats (`cats`)
- Exotic & Unusual Pets (`exotic-unusual-pets`)
- Wildlife & Conservation (`wildlife-conservation`)
- Veterinary & Pet Health (`veterinary-pet-health`)

### 14. Parenting & Family (`parenting-family`) 👨‍👩‍👧‍👦
- Baby & Toddler (`baby-toddler`)
- Kids Activities & Education (`kids-activities-education`)
- Teen & Tween (`teen-tween`)
- Family Life (`family-life`)
- Pregnancy & Fertility (`pregnancy-fertility`)

### 15. Automotive & Transport (`automotive-transport`) 🚗
- Electric Vehicles (`electric-vehicles`)
- Cars & Trucks (`cars-trucks`)
- Motorcycles (`motorcycles`)
- Aviation & Space Vehicles (`aviation-space-vehicles`)
- Future of Transport (`future-of-transport`)

### 16. Learning & Knowledge (`learning-knowledge`) 📚
- Online Courses (`online-courses`)
- Tutorials & How-To (`tutorials`)
- Data Visualization (`data-viz`)
- Language Learning (`language-learning`)
- Book Recommendations (`book-recs`)
- Reference & Encyclopedic (`reference`)

### 17. Media & Journalism (`media-journalism`) 📰
- Longform Writing (`longform`)
- Newsletters (`newsletters`)
- Podcasts (`podcasts`)
- Independent Media (`independent-media`)
- Investigative Reporting (`investigative`)

### 18. Career & Professional (`career-professional`) 💼
- Remote Work (`remote-work`)
- Freelancing & Consulting (`freelancing`)
- Job Discovery (`job-discovery`)
- Professional Development (`professional-dev`)
- Communities & Networking (`communities`)
- Personal Branding (`personal-branding`)

## Taxonomy Rules

1. Every site gets 2–3 subcategory slugs (primary + secondary)
2. Sites also get 5–10 freeform tags for more specific matching (e.g., "react", "css-animation", "postgres")
3. The taxonomy can expand over time but changes should be deliberate — new subcategories require updating the interests table and retagging affected sites
4. When the AI tagger suggests a category not in the taxonomy, flag it for review rather than auto-creating
5. A site can span multiple parent categories (e.g., a design tool startup might be tagged `ui-ux` + `saas-products`)

## Pack Generation Rules

1. Match sites to user's enabled subcategories
2. Weight toward subcategories where user has kept more cards
3. Max 2 cards from the same parent category per pack
4. Never show a site the user has already seen
5. 1 of 5 cards should be a "serendipity pick" from outside selected interests
6. Quality floor: only sites scoring ≥ 70 appear in standard packs
