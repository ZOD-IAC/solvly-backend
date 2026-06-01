import mongoose from "mongoose";
import slugify from 'slugify'
import { Question } from "../../models/question.js";
import Tags from "../../models/tags.js"
import User from "../../models/user.js";

// ============================================
// CONFIG
// ============================================

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/solvly';
const TOTAL_QUESTIONS = 1200; // Safe range: 1200–5000. Max unique = PREFIXES × TOPICS × CONTEXTS = 20 × 81 × 20 = 32,400
const CHUNK_SIZE = 200;

// ============================================
// USER IDS
// ============================================

const USER_IDS = [
  "6a180d8fa0cf35e7af00b147",
  "6a180ee5a0cf35e7af00b160",
  "6a180efda0cf35e7af00b167",
].map((id) => new mongoose.Types.ObjectId(id)); // Fix: was raw strings, needs ObjectId

// ============================================
// TAGS
// ============================================

const TAG = [
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

// Max unique titles = PREFIXES.length × TOPICS.length × CONTEXTS.length
const MAX_UNIQUE_TITLES = PREFIXES.length * TOPICS.length * CONTEXTS.length;

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

// Fix: some questions should have a later updatedAt (edited after posting)
function randomUpdatedAt(createdAt) {
  if (Math.random() < 0.3) {
    // 30% of questions were edited
    const maxDelta = Date.now() - createdAt.getTime();
    const delta = randomInt(1, Math.max(1, Math.floor(maxDelta / 1000))) * 1000;
    return new Date(createdAt.getTime() + delta);
  }
  return createdAt;
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

/**
 * Fix: Old approach used a while-loop that risks infinite loops when the
 * pool is small relative to TOTAL_QUESTIONS. Instead, we pre-generate all
 * possible combinations, shuffle them, and slice exactly what we need.
 * This also guarantees uniqueness without repeated collision checks.
 */
function generateAllUniqueTitles(count) {
  if (count > MAX_UNIQUE_TITLES) {
    throw new Error(
      `Requested ${count} unique questions but max possible is ${MAX_UNIQUE_TITLES}. ` +
        `Add more PREFIXES, TOPICS, or CONTEXTS to expand the pool.`
    );
  }

  // Build combinations lazily using a shuffled index approach
  // to avoid generating all 32k combos when we only need a subset
  const total = MAX_UNIQUE_TITLES;
  const indices = Array.from({ length: total }, (_, i) => i);

  // Partial Fisher-Yates: shuffle only the first `count` positions
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (total - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const pLen = PREFIXES.length;
  const tLen = TOPICS.length;
  const cLen = CONTEXTS.length;

  return indices.slice(0, count).map((idx) => {
    const cIdx = idx % cLen;
    const tIdx = Math.floor(idx / cLen) % tLen;
    const pIdx = Math.floor(idx / (cLen * tLen)) % pLen;
    return `${PREFIXES[pIdx]} ${TOPICS[tIdx]} ${CONTEXTS[cIdx]}?`;
  });
}

function generateBody(title) {
  const topic = title
    .replace(
      /How does|Why does|Best practices for|Common mistakes in|How to optimize|Advanced explanation of|Beginner guide to|Real-world usage of|How to debug|What is|Production implementation of|Scalable architecture for|Common interview questions about|How to improve|How to secure|Deep dive into|Practical guide to|Understanding|Troubleshooting|Performance optimization for/g,
      ""
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
  if (TOTAL_QUESTIONS > MAX_UNIQUE_TITLES) {
    console.error(
      `❌ TOTAL_QUESTIONS (${TOTAL_QUESTIONS}) exceeds max unique titles (${MAX_UNIQUE_TITLES}).`
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
    });

    console.log("✅ MongoDB connected");

    // const Tag = mongoose.model("Tags");
    // const Question = mongoose.model("Question");

    // ========================================
    // CLEAR OLD DATA
    // ========================================

    await Promise.all([Question.deleteMany({}), Tags.deleteMany({})]);
    console.log("🗑️  Old data cleared");

    // ========================================
    // CREATE TAGS (usageCount computed after questions are inserted)
    // ========================================

    const createdTags = await Tags.insertMany(
      TAG.map((tag) => ({
        tagName: tag,
        slug: slugify(tag, { lower: true, strict: true }),
        description: `${tag} related discussions and questions`,
        usageCount: 0, // Fix: was randomInt(50, 5000) — meaningless before questions exist
      }))
    );

    console.log(`🏷️  ${createdTags.length} tags inserted`);

    // ========================================
    // GENERATE QUESTIONS
    // ========================================

    console.log(`⚙️  Generating ${TOTAL_QUESTIONS} unique question titles...`);
    const titles = generateAllUniqueTitles(TOTAL_QUESTIONS);

    // Track how many times each tag is used so we can back-fill usageCount
    const tagUsageMap = new Map(createdTags.map((t) => [t._id.toString(), 0]));

    const questions = titles.map((title) => {
      const tags = randomTags(createdTags);
      tags.forEach((id) => {
        const key = id.toString();
        tagUsageMap.set(key, (tagUsageMap.get(key) ?? 0) + 1);
      });

      const createdAt = randomDate();

      return {
        title,
        slug: slugify(title, { lower: true, strict: true }), // Fix: slugify was imported but never used
        body: generateBody(title),
        tags,
        user: random(USER_IDS), // Fix: now proper ObjectId instances
        upvotes: weightedUpvotes(),
        downvotes: randomInt(0, 25),
        views: weightedViews(),
        answersCount: weightedAnswers(),
        createdAt,
        updatedAt: randomUpdatedAt(createdAt), // Fix: was always equal to createdAt
      };
    });

    // ========================================
    // INSERT QUESTIONS IN CHUNKS
    // ========================================

    for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
      const chunk = questions.slice(i, i + CHUNK_SIZE);
      await Question.insertMany(chunk, { ordered: false }); // ordered:false = faster, skips on dupe key instead of aborting
      console.log(`   Inserted ${Math.min(i + CHUNK_SIZE, questions.length)} / ${questions.length}`);
    }

    console.log(`✅ ${questions.length} questions inserted`);

    // ========================================
    // BACK-FILL TAG USAGE COUNTS
    // Fix: usageCount was random noise before — now reflects actual question data
    // ========================================

    console.log("🔄 Updating tag usageCounts...");

    const tagUpdates = [...tagUsageMap.entries()].map(([id, count]) =>
      Tags.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { usageCount: count } }
      )
    );
    // ========================================
    // BACK-FILL USER QUESTION COUNTS
    // ========================================
      
    console.log("🔄 Updating question counts in user stats...");
      
    // Single aggregation instead of N countDocuments calls
    const questionCounts = await Question.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    
    await User.bulkWrite(
      questionCounts.map(({ _id, count }) => ({
        updateOne: {
          filter: { _id },
          update: { $set: { "stats.questions": count } },
        },
      }))
    );
    
    console.log(`✅ ${questionCounts.length} user question counts updated`);

    await Promise.all(tagUpdates);
    console.log(`✅ ${tagUpdates.length} tag usageCounts updated`);

    console.log("\n🎉 Seed completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();