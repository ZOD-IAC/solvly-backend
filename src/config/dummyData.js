import bcrypt from "bcrypt";
import multiavatar from "@multiavatar/multiavatar";
import User from "../models/user.js";
import { Question } from "../models/question.js";
import Tags from "../models/tags.js";

const ADMIN_EMAIL = "admin@solvly.com";
const ADMIN_PASS = "Admin@123";

export const bootstrap = async () => {
  try {
    console.log("🌱 Running bootstrap...");

    // =========================
    // 1. Ensure Admin Exists
    // =========================
    let admin = await User.findOne({ role: "admin" });

    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashpass = await bcrypt.hash(ADMIN_PASS, salt);
      const avatar = multiavatar("Super Admin");

      admin = await User.create({
        name: "Super Admin",
        email: ADMIN_EMAIL,
        bio: "hi I'm admin, boss of this app",
        location: "Delhi, IN",
        password: hashpass,
        role: "admin",
        avatar,
        reputation: 99999999,
        stats: {
          questions: 999,
          answers: 999,
          accepted: 999,
        },
      });

      console.log(`✅ Admin Email: ${ADMIN_EMAIL}`);
      console.log(`✅ Admin password: ${ADMIN_PASS}`);
    } else {
      console.log(`ℹ️ Admin exists: ${admin.email}`);
      console.log(`ℹ️ Admin password: ${ADMIN_PASS}`);
    }

    // =========================
    // 2. Ensure Tags Exist
    // =========================
    const tagNames = [
      "javascript",
      "nodejs",
      "mongodb",
      "express",
      "react",
      "mongoose",
    ];

    let existingTags = await Tags.find({
      tagName: { $in: tagNames },
    });

    if (existingTags.length !== tagNames.length) {
      const existingNames = existingTags.map((t) => t.tagName);

      const newTags = tagNames
        .filter((name) => !existingNames.includes(name))
        .map((name) => ({
          tagName: name,
          slug: name.replace(/\s+/g, "-"),
        }));

      if (newTags.length) {
        const created = await Tags.insertMany(newTags);
        existingTags = [...existingTags, ...created];
        console.log(`✅ Tags created: ${newTags.length}`);
      }
    } else {
      console.log("ℹ️ Tags already exist");
    }

    // Map tagName → _id
    const tagMap = {};
    existingTags.forEach((tag) => {
      tagMap[tag.tagName] = tag._id;
    });

    // =========================
    // 3. Ensure Questions Exist
    // =========================
    const existingQuestions = await Question.countDocuments({
      user: admin._id,
    });

    if (existingQuestions > 0) {
      console.log("ℹ️ Questions already exist");
      return;
    }

    await Question.insertMany([
      {
        title: "How to use useEffect properly in React?",
        body: `
          <p>I am struggling with <strong>useEffect</strong>.</p>
          <pre><code>useEffect(() => {
  fetchData();
}, []);</code></pre>
        `,
        tags: [tagMap.react, tagMap.javascript],
        user: admin._id,
      },
      {
        title: "Difference between let, const, and var?",
        body: `
          <p>Explain scope, hoisting, and usage differences.</p>
        `,
        tags: [tagMap.javascript],
        user: admin._id,
      },
      {
        title: "How MongoDB indexing works?",
        body: `
          <p>What does this do?</p>
          <pre><code>db.collection.createIndex({ user: 1 })</code></pre>
        `,
        tags: [tagMap.mongodb],
        user: admin._id,
      },
      {
        title: "Best Express.js folder structure?",
        body: `
          <p>MVC vs service-based architecture?</p>
        `,
        tags: [tagMap.express, tagMap.nodejs],
        user: admin._id,
      },
      {
        title: "Mongoose populate vs manual query?",
        body: `
          <p>Which is better for performance?</p>
        `,
        tags: [tagMap.mongoose, tagMap.mongodb],
        user: admin._id,
      },
      {
        title: "How async/await works in Node.js?",
        body: `
          <p>Explain event loop + promises.</p>
        `,
        tags: [tagMap.nodejs, tagMap.javascript],
        user: admin._id,
      },
    ]);

    console.log("✅ Questions seeded successfully");
  } catch (error) {
    console.error("❌ Bootstrap failed:", error.message);
  }
};

