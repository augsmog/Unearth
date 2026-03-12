-- 005_seed_websites.sql
-- Seed 60 hand-picked quality websites for initial content pool
-- All sites are pre-approved with quality scores, categories, and tags

INSERT INTO sites (url, title, description, categories, tags, content_type, quality_score, ai_content_likelihood, status, source, approved_at) VALUES

-- Technology (AI & ML, Dev Tools, Open Source)
('https://huggingface.co', 'Hugging Face', 'The AI community building the future — models, datasets, and ML apps all in one place.', ARRAY['technology','ai-ml'], ARRAY['machine-learning','models','nlp','open-source','community'], 'community', 95, 'low', 'approved', 'manual', NOW()),
('https://roadmap.sh', 'roadmap.sh', 'Community-driven developer roadmaps, guides, and learning paths for every tech stack.', ARRAY['technology','developer-tools'], ARRAY['learning','roadmap','career','programming','guides'], 'resource', 92, 'low', 'approved', 'manual', NOW()),
('https://github.com/sindresorhus/awesome', 'Awesome Lists', 'The original curated list of awesome lists — a meta-collection of the internet''s best resources.', ARRAY['technology','open-source'], ARRAY['curated','lists','resources','github','developer'], 'resource', 90, 'low', 'approved', 'manual', NOW()),
('https://tldr.tech', 'TLDR Newsletter', 'Byte-sized daily newsletter covering the most interesting stories in startups, tech, and programming.', ARRAY['technology','ai-ml'], ARRAY['newsletter','daily','tech-news','startups','programming'], 'blog', 88, 'low', 'approved', 'manual', NOW()),

-- Design & Creative
('https://www.awwwards.com', 'Awwwards', 'Recognizing the talent and effort of the best web designers, developers, and agencies.', ARRAY['design-creative','web-design'], ARRAY['awards','inspiration','web-design','showcase','creativity'], 'community', 94, 'low', 'approved', 'manual', NOW()),
('https://typewolf.com', 'Typewolf', 'Helping designers choose the perfect font combination — real-world typography inspiration.', ARRAY['design-creative','typography-fonts'], ARRAY['typography','fonts','design','inspiration','pairings'], 'resource', 91, 'low', 'approved', 'manual', NOW()),
('https://www.refactoringui.com', 'Refactoring UI', 'Learn UI design with specific tactics from the creators of Tailwind CSS.', ARRAY['design-creative','ui-ux'], ARRAY['ui-design','tailwind','tips','practical','visual'], 'resource', 93, 'low', 'approved', 'manual', NOW()),
('https://dribbble.com', 'Dribbble', 'Discover the world''s top designers & creatives — the leading destination for design portfolios.', ARRAY['design-creative','design-inspiration'], ARRAY['portfolios','showcase','community','hiring','inspiration'], 'community', 89, 'low', 'approved', 'manual', NOW()),

-- Startups & Business
('https://www.indiehackers.com', 'Indie Hackers', 'A community of founders sharing the revenue numbers and strategies behind their businesses.', ARRAY['startups-business','indie-hacking-solopreneurs'], ARRAY['founders','revenue','community','bootstrapping','transparency'], 'community', 93, 'low', 'approved', 'manual', NOW()),
('https://www.acquired.fm', 'Acquired Podcast', 'Deep dives into the greatest technology acquisitions and IPOs of all time.', ARRAY['startups-business','venture-fundraising'], ARRAY['podcast','acquisitions','business-history','analysis','tech'], 'resource', 92, 'low', 'approved', 'manual', NOW()),
('https://www.levels.fyi', 'Levels.fyi', 'Compare verified compensation data across tech companies — salaries, stock, and bonuses.', ARRAY['startups-business','analytics-data'], ARRAY['salary','compensation','tech-companies','data','transparency'], 'tool', 90, 'low', 'approved', 'manual', NOW()),

-- Science & Nature
('https://waitbutwhy.com', 'Wait But Why', 'Tim Urban''s long-form explorations of science, philosophy, and everything that matters.', ARRAY['science-nature','psychology-behavior'], ARRAY['longform','philosophy','science','illustrated','thinking'], 'blog', 96, 'low', 'approved', 'manual', NOW()),
('https://www.quantamagazine.org', 'Quanta Magazine', 'Illuminating mathematics, physics, biology, and computer science research for curious minds.', ARRAY['science-nature','math-logic'], ARRAY['research','mathematics','physics','biology','journalism'], 'blog', 95, 'low', 'approved', 'manual', NOW()),
('https://apod.nasa.gov', 'NASA Astronomy Picture of the Day', 'A different astronomy image or photograph every day, with a professional astronomer''s explanation.', ARRAY['science-nature','space-astronomy'], ARRAY['space','photos','daily','nasa','astronomy'], 'resource', 94, 'low', 'approved', 'manual', NOW()),

-- Arts & Expression
('https://www.booooooom.com', 'Booooooom', 'An independent art platform founded by artist Jeff Hamada — art, film, music, and photography.', ARRAY['arts-expression','visual-art-illustration'], ARRAY['art','photography','film','independent','curation'], 'blog', 92, 'low', 'approved', 'manual', NOW()),
('https://www.brainpickings.org', 'The Marginalian', 'Maria Popova''s labor of love exploring what it means to live a meaningful life through books and art.', ARRAY['arts-expression','writing-literature'], ARRAY['books','philosophy','art','culture','longform'], 'blog', 95, 'low', 'approved', 'manual', NOW()),
('https://everynoise.com', 'Every Noise at Once', 'An algorithmically-generated, readability-adjusted scatter-plot of every music genre.', ARRAY['arts-expression','music-audio'], ARRAY['music','genres','visualization','discovery','interactive'], 'tool', 91, 'low', 'approved', 'manual', NOW()),

-- Culture & Ideas
('https://aeon.co', 'Aeon', 'A digital magazine of ideas, philosophy, and culture — long essays from world-class thinkers.', ARRAY['culture-ideas','philosophy-ethics'], ARRAY['essays','philosophy','culture','thinking','longform'], 'blog', 94, 'low', 'approved', 'manual', NOW()),
('https://www.are.na', 'Are.na', 'A platform for connecting ideas and building knowledge — a visual thinking tool for the curious.', ARRAY['culture-ideas','internet-culture'], ARRAY['curation','visual-thinking','knowledge','bookmarking','creative'], 'tool', 91, 'low', 'approved', 'manual', NOW()),
('https://longnow.org', 'The Long Now Foundation', 'Fostering long-term thinking and responsibility in the framework of the next 10,000 years.', ARRAY['culture-ideas','futurism-speculation'], ARRAY['long-term','thinking','civilization','time','responsibility'], 'resource', 90, 'low', 'approved', 'manual', NOW()),

-- Lifestyle & Wellness
('https://www.seriouseats.com', 'Serious Eats', 'Authoritative, tested, and trustworthy recipes and food science from J. Kenji Lopez-Alt and team.', ARRAY['lifestyle-wellness','food-cooking'], ARRAY['recipes','food-science','cooking','tested','technique'], 'resource', 93, 'low', 'approved', 'manual', NOW()),
('https://www.atlasobscura.com', 'Atlas Obscura', 'The definitive guide to the world''s hidden wonders — curious and unusual travel destinations.', ARRAY['lifestyle-wellness','travel-places'], ARRAY['travel','unusual','hidden','wonders','exploration'], 'resource', 94, 'low', 'approved', 'manual', NOW()),
('https://www.theminimalists.com', 'The Minimalists', 'Helping millions live meaningful lives with less through writing, podcasts, and documentary films.', ARRAY['lifestyle-wellness','sustainability'], ARRAY['minimalism','intentional-living','podcast','simplicity','mindfulness'], 'blog', 87, 'low', 'approved', 'manual', NOW()),

-- Gaming & Interactive
('https://itch.io', 'itch.io', 'An open marketplace for independent digital creators with a focus on independent video games.', ARRAY['gaming-interactive','indie-games'], ARRAY['indie','games','marketplace','creators','community'], 'community', 93, 'low', 'approved', 'manual', NOW()),
('https://www.gamedeveloper.com', 'Game Developer', 'The art, business, and technology of making games — postmortems, insights, and industry analysis.', ARRAY['gaming-interactive','game-development'], ARRAY['game-dev','postmortems','industry','design','programming'], 'blog', 89, 'low', 'approved', 'manual', NOW()),
('https://neal.fun', 'Neal.fun', 'Addictive interactive visualizations and games that make you think about big numbers and concepts.', ARRAY['gaming-interactive','interactive-experiences'], ARRAY['interactive','visualization','fun','educational','creative'], 'tool', 95, 'low', 'approved', 'manual', NOW()),

-- Sports & Athletics
('https://www.theringer.com', 'The Ringer', 'Bill Simmons'' media company covering sports, pop culture, and technology with personality.', ARRAY['sports-athletics','team-sports'], ARRAY['sports','pop-culture','podcasts','analysis','nba'], 'blog', 88, 'low', 'approved', 'manual', NOW()),
('https://fivethirtyeight.com', 'FiveThirtyEight', 'Nate Silver''s data-driven analysis of politics, sports, science, and economics.', ARRAY['sports-athletics','fantasy-sports-analytics'], ARRAY['data','analytics','statistics','predictions','sports'], 'blog', 91, 'low', 'approved', 'manual', NOW()),
('https://www.outsideonline.com', 'Outside Magazine', 'The leading voice for active lifestyles — adventure, gear, health, and the great outdoors.', ARRAY['sports-athletics','outdoor-adventure-sports'], ARRAY['outdoors','adventure','gear','fitness','nature'], 'blog', 87, 'low', 'approved', 'manual', NOW()),

-- Finance & Money
('https://www.mrmoneymustache.com', 'Mr. Money Mustache', 'The original financial independence blog — retire early through badassity and simple math.', ARRAY['finance-money','personal-finance'], ARRAY['fire','retirement','frugality','investing','independence'], 'blog', 90, 'low', 'approved', 'manual', NOW()),
('https://www.visualcapitalist.com', 'Visual Capitalist', 'Making the world''s information more accessible through data-driven visual content.', ARRAY['finance-money','economics'], ARRAY['infographics','data','economics','markets','visualization'], 'blog', 89, 'low', 'approved', 'manual', NOW()),
('https://finviz.com', 'Finviz', 'Free stock screener, heatmaps, and financial visualizations for market research.', ARRAY['finance-money','investing'], ARRAY['stocks','screener','heatmap','markets','analysis'], 'tool', 88, 'low', 'approved', 'manual', NOW()),

-- News & Current Events
('https://ground.news', 'Ground News', 'Compare news coverage across the political spectrum — see how stories are covered differently.', ARRAY['news-current-events','politics-policy'], ARRAY['bias','comparison','media-literacy','politics','perspective'], 'tool', 92, 'low', 'approved', 'manual', NOW()),
('https://restofworld.org', 'Rest of World', 'International nonprofit journalism covering technology''s impact outside the Western bubble.', ARRAY['news-current-events','world-affairs'], ARRAY['global','technology','developing-world','journalism','international'], 'blog', 93, 'low', 'approved', 'manual', NOW()),

-- Humor & Entertainment
('https://www.mcsweeneys.net', 'McSweeney''s Internet Tendency', 'Absurdist humor, literary satire, and the world''s best open letters to people or entities unlikely to respond.', ARRAY['humor-entertainment','comedy-satire'], ARRAY['humor','satire','literary','absurdist','writing'], 'blog', 90, 'low', 'approved', 'manual', NOW()),
('https://tvtropes.org', 'TV Tropes', 'The all-devouring pop-culture wiki cataloging every narrative device and convention in storytelling.', ARRAY['humor-entertainment','pop-culture'], ARRAY['tropes','wiki','storytelling','media','analysis'], 'resource', 89, 'low', 'approved', 'manual', NOW()),
('https://pudding.cool', 'The Pudding', 'Visual essays explaining ideas debated in culture using data journalism and interactive graphics.', ARRAY['humor-entertainment','reviews-criticism'], ARRAY['data-journalism','visual-essays','interactive','culture','analysis'], 'blog', 94, 'low', 'approved', 'manual', NOW()),

-- Pets & Animals
('https://www.thedodo.com', 'The Dodo', 'The digital media brand for animal lovers — heartwarming stories of animals and the people who love them.', ARRAY['pets-animals','dogs'], ARRAY['animals','heartwarming','rescue','stories','video'], 'blog', 85, 'low', 'approved', 'manual', NOW()),
('https://www.nationalgeographic.com/animals', 'National Geographic Animals', 'The most comprehensive animal reference and wildlife conservation resource on the web.', ARRAY['pets-animals','wildlife-conservation'], ARRAY['wildlife','conservation','photography','education','species'], 'resource', 93, 'low', 'approved', 'manual', NOW()),

-- Parenting & Family
('https://www.scarymommy.com', 'Scary Mommy', 'Honest, unfiltered parenting stories and advice from real parents in the trenches.', ARRAY['parenting-family','family-life'], ARRAY['parenting','humor','honest','community','advice'], 'blog', 86, 'low', 'approved', 'manual', NOW()),
('https://www.khanacademy.org/kids', 'Khan Academy Kids', 'Free, joyful learning for children ages 2-8 with interactive activities and books.', ARRAY['parenting-family','kids-activities-education'], ARRAY['education','free','interactive','learning','children'], 'tool', 94, 'low', 'approved', 'manual', NOW()),

-- Automotive & Transport
('https://www.electrek.co', 'Electrek', 'Leading the charge in electric vehicle news, reviews, and sustainable energy coverage.', ARRAY['automotive-transport','electric-vehicles'], ARRAY['electric-vehicles','tesla','sustainability','energy','news'], 'blog', 88, 'low', 'approved', 'manual', NOW()),
('https://www.thedrive.com', 'The Drive', 'Auto news, reviews, and car culture with a voice — not your grandfather''s automotive journalism.', ARRAY['automotive-transport','cars-trucks'], ARRAY['cars','reviews','culture','automotive','journalism'], 'blog', 87, 'low', 'approved', 'manual', NOW()),

-- Learning & Knowledge
('https://brilliant.org', 'Brilliant', 'Learn math, science, and computer science through guided, interactive problem solving.', ARRAY['learning-knowledge','online-courses'], ARRAY['math','science','interactive','problem-solving','education'], 'tool', 93, 'low', 'approved', 'manual', NOW()),
('https://explorabl.es', 'Explorable Explanations', 'A hub for learning through play — interactive essays, simulations, and visualizations.', ARRAY['learning-knowledge','tutorials-how-to'], ARRAY['interactive','learning','simulations','visualizations','play'], 'resource', 92, 'low', 'approved', 'manual', NOW()),
('https://informationisbeautiful.net', 'Information is Beautiful', 'Making sense of the world through stunning data visualizations and infographics.', ARRAY['learning-knowledge','data-visualization'], ARRAY['infographics','data','visualization','design','clarity'], 'resource', 91, 'low', 'approved', 'manual', NOW()),

-- Media & Journalism
('https://www.theverge.com/features', 'The Verge Features', 'Award-winning longform technology journalism and deep-dive features.', ARRAY['media-journalism','longform-writing'], ARRAY['technology','longform','journalism','features','culture'], 'blog', 90, 'low', 'approved', 'manual', NOW()),
('https://www.densediscovery.com', 'Dense Discovery', 'A thoughtful weekly newsletter at the intersection of design, technology, and culture.', ARRAY['media-journalism','newsletters'], ARRAY['newsletter','design','technology','culture','curated'], 'blog', 91, 'low', 'approved', 'manual', NOW()),
('https://www.listennotes.com', 'Listen Notes', 'The best podcast search engine — discover podcasts across every topic and genre.', ARRAY['media-journalism','podcasts'], ARRAY['podcasts','search','discovery','directory','audio'], 'tool', 88, 'low', 'approved', 'manual', NOW()),

-- Career & Professional
('https://www.levels.fyi/blog', 'Levels.fyi Blog', 'Data-driven career insights — compensation trends, negotiation tips, and tech industry analysis.', ARRAY['career-professional','professional-development'], ARRAY['career','compensation','negotiation','tech','data'], 'blog', 87, 'low', 'approved', 'manual', NOW()),
('https://remoteok.com', 'Remote OK', 'The largest remote job board with 50,000+ remote work positions across every field.', ARRAY['career-professional','remote-work'], ARRAY['remote','jobs','hiring','work-from-home','global'], 'tool', 89, 'low', 'approved', 'manual', NOW()),
('https://www.keyvalues.com', 'Key Values', 'Find engineering teams that share your values — filter companies by culture, not just perks.', ARRAY['career-professional','communities-networking'], ARRAY['culture','values','engineering','hiring','company-culture'], 'tool', 90, 'low', 'approved', 'manual', NOW()),

-- Additional cross-category gems
('https://www.openculture.com', 'Open Culture', 'The best free cultural and educational media on the web — courses, books, films, and more.', ARRAY['learning-knowledge','culture-ideas'], ARRAY['free','education','culture','books','courses'], 'resource', 92, 'low', 'approved', 'manual', NOW()),
('https://www.darksky.org', 'DarkSky International', 'Fighting light pollution to preserve the night sky for present and future generations.', ARRAY['science-nature','climate-environment'], ARRAY['light-pollution','astronomy','conservation','environment','activism'], 'resource', 88, 'low', 'approved', 'manual', NOW()),
('https://www.notion.so/templates', 'Notion Templates', 'Thousands of free templates for productivity, project management, and personal organization.', ARRAY['technology','developer-tools'], ARRAY['productivity','templates','organization','free','tools'], 'resource', 87, 'low', 'approved', 'manual', NOW()),
('https://css-tricks.com', 'CSS-Tricks', 'Daily articles about CSS, HTML, JavaScript, and all things related to web design and development.', ARRAY['technology','design-creative'], ARRAY['css','web-dev','tutorials','frontend','design'], 'blog', 91, 'low', 'approved', 'manual', NOW()),
('https://www.musicforprogramming.net', 'Music for Programming', 'A series of mixes designed to aid concentration and increase productivity while coding.', ARRAY['arts-expression','technology'], ARRAY['music','focus','programming','ambient','productivity'], 'resource', 89, 'low', 'approved', 'manual', NOW()),
('https://www.swyx.io', 'swyx.io', 'Shawn Wang''s essays on learning in public, developer experience, and the AI engineering stack.', ARRAY['technology','career-professional'], ARRAY['learning','developer-experience','ai','essays','career'], 'blog', 89, 'low', 'approved', 'manual', NOW()),
('https://www.futuretools.io', 'Future Tools', 'A curated collection of the best AI tools, updated daily with reviews and categories.', ARRAY['technology','ai-ml'], ARRAY['ai-tools','directory','curated','reviews','productivity'], 'resource', 88, 'low', 'approved', 'manual', NOW()),
('https://lexfridman.com/podcast', 'Lex Fridman Podcast', 'Conversations about intelligence, consciousness, love, and power with scientists and thinkers.', ARRAY['science-nature','culture-ideas'], ARRAY['podcast','ai','science','philosophy','interviews'], 'resource', 90, 'low', 'approved', 'manual', NOW());
