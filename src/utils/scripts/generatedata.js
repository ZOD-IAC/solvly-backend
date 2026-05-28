// # Solvly / Querynest — Advanced Production Seed Generator

// This generator creates:

// * 1200+ realistic unique questions
// * realistic engagement metrics
// * uneven ranking distributions
// * random timestamps
// * weighted popularity
// * believable production activity
// * scalable topic combinations

// It is designed specifically for your schemas.

// ---

// # Install

// ```bash
// npm install mongoose slugify
// ```

// ---

// # Seeder Script

// ```js
const mongoose = require("mongoose");

// ============================================
// USER IDS
// ============================================

const USER_IDS = [
  "6a180d8fa0cf35e7af00b147",
  "6a180ee5a0cf35e7af00b160",
  "6a180efda0cf35e7af00b167",
];

// ============================================
// TAGS
// ============================================

const TAGS = [
  "javascript",
  "react",
  "nodejs",
  "mongodb",
  "express",
  "typescript",
  "nextjs",
  "docker",
  "devops",
  "sql",
  "postgresql",
  "redis",
  "system-design",
  "api",
  "authentication",
  "security",
  "frontend",
  "backend",
  "performance",
  "aws",
  "microservices",
  "graphql",
  "python",
  "ai",
  "machine-learning",
  "testing",
  "jest",
  "css",
  "tailwindcss",
  "websockets",
];

// ============================================
// TOPICS
// ============================================

const TOPICS = [
  "closures in JavaScript",
  "React rendering",
  "JWT authentication",
  "MongoDB indexing",
  "Redis caching",
  "Docker containers",
  "Node.js event loop",
  "React hooks",
  "React memoization",
  "API rate limiting",
  "microservices architecture",
  "SQL joins",
  "database normalization",
  "Next.js server components",
  "authentication middleware",
  "REST APIs",
  "GraphQL APIs",
  "WebSocket connections",
  "system design interviews",
  "load balancing",
  "horizontal scaling",
  "database sharding",
  "React state management",
  "Express middleware",
  "TypeScript generics",
  "async await",
  "JavaScript promises",
  "Redis pub/sub",
  "Docker networking",
  "Kubernetes deployments",
  "AWS deployment",
  "CI/CD pipelines",
  "Tailwind CSS",
  "CSS specificity",
  "responsive design",
  "React Suspense",
  "server-side rendering",
  "React hydration",
  "authentication tokens",
  "bcrypt password hashing",
  "OAuth login",
  "session management",
  "API pagination",
  "query optimization",
  "PostgreSQL indexing",
  "MongoDB aggregation",
  "MERN stack deployment",
  "frontend optimization",
  "lazy loading",
  "code splitting",
  "real-time chat systems",
  "notification systems",
  "video streaming architecture",
  "message queues",
  "Kafka consumers",
  "RabbitMQ",
  "memory leaks",
  "React performance",
  "Node.js clustering",
  "thread pools",
  "unit testing",
  "integration testing",
  "Jest mocking",
  "web security",
  "XSS attacks",
  "CSRF protection",
  "rate limiting",
  "API gateways",
  "reverse proxies",
  "CDN caching",
  "edge computing",
  "cron jobs",
  "socket.io",
  "React Query",
  "TanStack Query",
  "Zustand state management",
  "Redux Toolkit",
  "form validation",
  "file uploads",
  "image optimization",
  "search systems",
  "Elasticsearch",
  "full-text search",
];

// ============================================
// TITLE GENERATORS
// ============================================

const PREFIXES = [
  "How does",
  "Why does",
  "Best practices for",
  "Common mistakes in",
  "How to optimize",
  "Advanced explanation of",
  "Beginner guide to",
  "Real-world usage of",
  "How to debug",
  "What is",
  "Production implementation of",
  "Scalable architecture for",
  "Common interview questions about",
  "How to improve",
  "How to secure",
  "Deep dive into",
  "Practical guide to",
  "Understanding",
  "Troubleshooting",
  "Performance optimization for",
];

const CONTEXTS = [
  "in production applications",
  "for scalable systems",
  "in MERN stack apps",
  "during technical interviews",
  "in enterprise applications",
  "under heavy traffic",
  "for startups",
  "in distributed systems",
  "for high-performance apps",
  "in modern web development",
  "using Node.js",
  "with React",
  "with MongoDB",
  "using Docker",
  "in microservices",
  "with AWS",
  "for backend systems",
  "for frontend applications",
  "with TypeScript",
  "in cloud environments",
];

const BODY_PATTERNS = [
  "I am trying to understand {topic} and would appreciate a detailed explanation with real-world examples.",
  "Can someone explain {topic} with practical implementation strategies and best practices?",
  "What are the most common mistakes developers make when working with {topic}?",
  "How is {topic} typically implemented in production-grade applications?",
  "I encountered issues related to {topic} while building a project. Looking for guidance.",
  "Can someone explain the performance implications of {topic}?",
  "What are the industry-standard approaches for handling {topic}?",
  "How would a senior engineer approach {topic} in large-scale systems?",
  "Looking for beginner-to-advanced guidance on {topic} with practical examples.",
  "How can I optimize and scale {topic} in real-world applications?",
];

// ============================================
// HELPERS
// ============================================

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate() {
  const now = new Date();

  return new Date(now.getTime() - randomInt(1, 365) * 24 * 60 * 60 * 1000);
}

function weightedViews() {
  const r = Math.random();

  if (r < 0.55) return randomInt(10, 500);
  if (r < 0.8) return randomInt(500, 3000);
  if (r < 0.93) return randomInt(3000, 12000);
  if (r < 0.99) return randomInt(12000, 50000);

  return randomInt(50000, 200000);
}

function weightedUpvotes() {
  const r = Math.random();

  if (r < 0.6) return randomInt(0, 10);
  if (r < 0.85) return randomInt(10, 80);
  if (r < 0.97) return randomInt(80, 300);

  return randomInt(300, 2000);
}

function weightedAnswers() {
  const r = Math.random();

  if (r < 0.4) return 0;
  if (r < 0.75) return randomInt(1, 4);
  if (r < 0.92) return randomInt(5, 12);

  return randomInt(12, 40);
}

function randomTags(createdTags) {
  const shuffled = [...createdTags].sort(() => 0.5 - Math.random());

  return shuffled.slice(0, randomInt(1, 4)).map((t) => t._id);
}

function generateUniqueQuestion(existingTitles) {
  let title = "";

  while (!title || existingTitles.has(title)) {
    const prefix = random(PREFIXES);
    const topic = random(TOPICS);
    const context = random(CONTEXTS);

    title = `${prefix} ${topic} ${context}?`;
  }

  existingTitles.add(title);

  return title;
}

function generateBody(title) {
  const topic = title
    .replace(
      /How does|Why does|Best practices for|Common mistakes in|How to optimize|Advanced explanation of|Beginner guide to|Real-world usage of|How to debug|What is|Production implementation of|Scalable architecture for|Common interview questions about|How to improve|How to secure|Deep dive into|Practical guide to|Understanding|Troubleshooting|Performance optimization for/g,
      "",
    )
    .replace(/\?/g, "")
    .trim();

  const pattern = random(BODY_PATTERNS);

  return (
    pattern.replace("{topic}", topic) +
    "\n\nI would appreciate practical examples, scalability considerations, performance tips, and production best practices from experienced developers."
  );
}

// ============================================
// MAIN SEEDER
// ============================================

async function seed() {
  try {
    await mongoose.connect("YOUR_MONGODB_URI");

    console.log("MongoDB connected");

    const Tag = mongoose.model("Tags");
    const Question = mongoose.model("Question");

    // ========================================
    // CLEAR OLD DATA
    // ========================================

    await Question.deleteMany({});
    await Tag.deleteMany({});

    console.log("Old data cleared");

    // ========================================
    // CREATE TAGS
    // ========================================

    const createdTags = await Tag.insertMany(
      TAGS.map((tag) => ({
        tagName: tag,
        slug: tag,
        description: `${tag} related discussions and questions`,
        usageCount: randomInt(50, 5000),
      })),
    );

    console.log(`${createdTags.length} tags inserted`);

    // ========================================
    // GENERATE QUESTIONS
    // ========================================

    const TOTAL_QUESTIONS = 1200;

    const questions = [];

    const existingTitles = new Set();

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const title = generateUniqueQuestion(existingTitles);

      const createdAt = randomDate();

      questions.push({
        title,

        body: generateBody(title),

        tags: randomTags(createdTags),

        user: random(USER_IDS),

        upvotes: weightedUpvotes(),

        downvotes: randomInt(0, 25),

        views: weightedViews(),

        answersCount: weightedAnswers(),

        createdAt,

        updatedAt: createdAt,
      });
    }

    const chunkSize = 200;

    for (let i = 0; i < questions.length; i += chunkSize) {
      const chunk = questions.slice(i, i + chunkSize);

      await Question.insertMany(chunk);

      console.log(`Inserted ${i + chunk.length}`);
    }

    console.log(`${questions.length} questions inserted`);

    console.log("Production seed completed successfully");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
// ```

// ---

// # Why This Is Better

// This script:

// * generates 1200 unique questions
// * avoids repeated titles
// * creates realistic popularity distribution
// * creates hot/trending questions
// * creates unanswered questions
// * creates dead questions
// * improves recruiter demo quality
// * makes sorting/filtering feel real
// * creates believable engagement patterns

// ---

// # Result Example

// Generated titles look like:

// * How to optimize React rendering in production applications?
// * Best practices for Redis caching under heavy traffic?
// * Advanced explanation of JWT authentication with AWS?
// * Troubleshooting Docker containers in distributed systems?
// * Deep dive into React Query for scalable systems?
// * Common interview questions about microservices architecture?

// These feel much closer to real developer discussions.

// ---

// # Recommended Next Step

// After this:

// 1. Generate answers
// 2. Generate comments
// 3. Generate accepted answers
// 4. Generate bookmarks
// 5. Generate trending activity

// That will make Solvly feel fully alive in production.
