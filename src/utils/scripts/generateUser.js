import multiavatar from "@multiavatar/multiavatar";
import mongoose from "mongoose";
import User from "../../models/user.js";
import bcrypt from "bcrypt";

// ============================================
// CONFIG
// ============================================

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/querynest";
const SALT_ROUNDS = 10;
const CHUNK_SIZE = 50; // bcrypt is CPU-heavy, keep chunks small

// ============================================
// COMPULSORY USERS (always created first)
// These match existing DB entries — safe to re-run
// ============================================

const COMPULSORY_USERS = [
  { name: "zodiac", role: "user" },
  { name: "executor", role: "user" },
  { name: "kratos", role: "user" },
  { name: "harshit", role: "user" },
  { name: "admin", role: "admin" },
];

// ============================================
// NAME POOL FOR GENERATED USERS
// 200+ non-compulsory names
// ============================================

const NAME_POOL = [
  "ShadowStrike",
  "Aarav",
  "NightWolf",
  "PixelHunter",
  "Vihaan",
  "CyberNova",
  "Ethan",
  "GhostBlade",
  "Liam",
  "MysticRush",
  "Arjun",
  "DragonFury",
  "Noah",
  "StealthX",
  "Kabir",
  "BlazeStorm",
  "Lucas",
  "VenomKnight",
  "Mason",
  "DarkPulse",
  "Aryan",
  "ThunderByte",
  "Logan",
  "InfernoAce",
  "Elijah",
  "FrostNova",
  "Rohan",
  "SilentReaper",
  "James",
  "StormBreaker",
  "Benjamin",
  "ToxicViper",
  "Ayaan",
  "RapidFlare",
  "Henry",
  "CrimsonShot",
  "Alexander",
  "IronPhantom",
  "Daniel",
  "QuantumX",
  "Ryan",
  "TurboNinja",
  "Nathan",
  "VoidHunter",
  "Aditya",
  "EpicFalcon",
  "Michael",
  "RogueTitan",
  "Isaac",
  "PixelWizard",
  "Jack",
  "FireSpecter",
  "Sebastian",
  "NovaRider",
  "David",
  "LunarGhost",
  "Matthew",
  "HyperDrift",
  "Joseph",
  "ChaosArrow",
  "Levi",
  "AlphaFury",
  "Wyatt",
  "BluePhoenix",
  "Samuel",
  "RapidVenom",
  "Carter",
  "NeonSamurai",
  "Owen",
  "FatalStrike",
  "Julian",
  "GhostVortex",
  "Luke",
  "TitanBlaze",
  "John",
  "CyberKnight",
  "Dylan",
  "FrozenAce",
  "Grayson",
  "InfernalWolf",
  "Leo",
  "SkyBreaker",
  "Jaxon",
  "VortexKing",
  "Gabriel",
  "NightCrawler",
  "Isaiah",
  "PixelDrake",
  "Lincoln",
  "StormRider",
  "Anthony",
  "DarkKnightX",
  "Hudson",
  "ShadowNexus",
  "Ezra",
  "VenomRush",
  "Thomas",
  "SilentBlitz",
  "Charles",
  "MysticArrow",
  "Christopher",
  "NovaTitan",
  "Josiah",
  "ElectricPulse",
  "Andrew",
  "CrimsonEdge",
  "Joshua",
  "TurboShadow",
  "Maverick",
  "ApexHunter",
  "Elias",
  "BlizzardX",
  "Aaron",
  "SolarFlame",
  "Adrian",
  "WolfStrike",
  "Jonathan",
  "DragonSoul",
  "Nolan",
  "PhantomCore",
  "Hunter",
  "CyberDrift",
  "Cameron",
  "DarkOrbit",
  "Connor",
  "StormPulse",
  "Santiago",
  "GhostSniper",
  "Jeremiah",
  "RapidGhost",
  "Ezekiel",
  "TitanCore",
  "Angel",
  "VoidReaper",
  "Roman",
  "HyperKnight",
  "Easton",
  "FrostStrike",
  "Miles",
  "ChaosVortex",
  "Robert",
  "ShadowBolt",
  "Jameson",
  "InfernoRush",
  "Nicholas",
  "SteelPhantom",
  "Greyson",
  "LunarKnight",
  "Cooper",
  "NovaStrike",
  "Ian",
  "TurboFalcon",
  "Carson",
  "VenomSpecter",
  "Axel",
  "PixelRogue",
  "Jaxson",
  "DarkSamurai",
  "Dominic",
  "BlazeHunter",
  "Leonardo",
  "CyberShadow",
  "Luca",
  "ThunderGhost",
  "Austin",
  "RapidTitan",
  "Jordan",
  "SkyPhantom",
  "Adam",
  "IronWolf",
  "Xavier",
  "FatalBlaze",
  "Jose",
  "NightVortex",
  "Jace",
  "QuantumStrike",
  "Everett",
  "GhostNova",
  "Declan",
  "VenomX",
  "Evan",
  "ShadowInferno",
  "Kayden",
  "NeonFury",
  "Parker",
  "FrostByte",
  "Wesley",
  "TitanShadow",
  "Kai",
  "MysticViper",
  "Brayden",
  "RapidKnight",
  "Bryson",
  "DarkFalcon",
  "Weston",
  "SolarTitan",
  "Jason",
  "CrimsonWolf",
  "Emmett",
  "TurboSpecter",
  "Sawyer",
  "HyperVortex",
  "Micah",
  "BlazeDrift",
  "Ryder",
  "GhostTitan",
  "Vincent",
  "VenomBlitz",
  "Damian",
  "ShadowAce",
  "Legend27",
  "SniperKing",
  "OmegaWolf",
  "UltraInstinct",
  "FatalNova",
  "KnightRider",
  "StealthHunter",
  "PixelLegend",
  "DarkRogue",
  "CrimsonByte",
  "FireTitan",
  "StormSniper",
  "CyberLegend",
  "MysticKnight",
  "TurboDragon",
  "ShadowFrost",
  "RapidStorm",
  "VenomPulse",
  "InfernoKnight",
  "LunarBlaze",
  "AlphaShadow",
  "ChaosHunter",
  "GhostRanger",
  "NovaHunter",
  "ToxicKnight",
  "SkyVortex",
  "BlizzardKnight",
  "ThunderStrike",
  "NightFury",
  "PixelStorm",
  "DarkVenom",
  "QuantumGhost",
];

// ============================================
// HELPERS
// ============================================

function buildEmail(name) {
  return `${name.toLowerCase().replace(/\s+/g, "")}@solvly.com`;
}

function buildPassword(name) {
  return `${name}@123`;
}

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

function buildAvatar(name) {
  // multiavatar can return string or SVG depending on version
  try {
    return multiavatar(name, true, { part: "10", theme: "B" });
  } catch {
    return multiavatar(name); // fallback for older versions
  }
}

async function buildUserDoc({ name, role = "user" }) {
  const email = buildEmail(name);
  const plain = buildPassword(name);
  const password = await hashPassword(plain);
  const avatar = buildAvatar(name);

  return {
    name,
    email,
    password,
    avatar,
    role,
    reputation: 0,
    stats: { questions: 0, answers: 0 },
  };
}

// ============================================
// MAIN SEEDER
// ============================================

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
    });

    console.log("✅ MongoDB connected\n");

    // ========================================
    // CLEAR OLD USERS (non-admin safety check)
    // ========================================

    await User.deleteMany({});
    console.log("🗑️  Old users cleared");

    // ========================================
    // DEDUPLICATE NAME POOL
    // Remove compulsory names from the pool to avoid collision
    // ========================================

    const compulsoryNames = new Set(
      COMPULSORY_USERS.map((u) => u.name.toLowerCase()),
    );

    const uniqueNamePool = [...new Set(NAME_POOL)] // remove pool duplicates
      .filter((n) => !compulsoryNames.has(n.toLowerCase())); // remove compulsory collisions

    // We need at least 200 generated users (compulsory excluded)
    const TARGET_GENERATED = 200;
    if (uniqueNamePool.length < TARGET_GENERATED) {
      throw new Error(
        `NAME_POOL only has ${uniqueNamePool.length} unique non-compulsory names. ` +
          `Need at least ${TARGET_GENERATED}. Add more names to NAME_POOL.`,
      );
    }

    const generatedNames = uniqueNamePool
      .slice(0, TARGET_GENERATED)
      .map((name) => ({
        name,
        role: "user",
      }));

    // Compulsory users always go first so their IDs are stable and predictable
    const allUserDefs = [...COMPULSORY_USERS, ...generatedNames];
    console.log(
      `⚙️  Building ${allUserDefs.length} user documents (bcrypt in chunks of ${CHUNK_SIZE})...`,
    );

    // ========================================
    // HASH PASSWORDS IN CHUNKS (bcrypt is blocking/CPU-bound)
    // ========================================

    const userDocs = [];

    for (let i = 0; i < allUserDefs.length; i += CHUNK_SIZE) {
      const chunk = allUserDefs.slice(i, i + CHUNK_SIZE);
      const built = await Promise.all(chunk.map(buildUserDoc));
      userDocs.push(...built);
      console.log(
        `   Hashed ${Math.min(i + CHUNK_SIZE, allUserDefs.length)} / ${allUserDefs.length}`,
      );
    }

    // ========================================
    // INSERT USERS
    // ========================================

    const inserted = await User.insertMany(userDocs, { ordered: true });
    console.log(`\n✅ ${inserted.length} users inserted`);

    // ========================================
    // PRINT SUMMARY — IDs for use in question seed
    // ========================================

    console.log("\n📋 USER ID REFERENCE (copy into your question seed):");
    console.log("=".repeat(60));

    const compulsoryInserted = inserted.slice(0, COMPULSORY_USERS.length);
    const generatedInserted = inserted.slice(COMPULSORY_USERS.length);

    console.log("\n// COMPULSORY USERS");
    compulsoryInserted.forEach((u) => {
      console.log(
        `//  [${u.role.toUpperCase()}] ${u.name.padEnd(12)} → ${u._id}  |  pwd: ${buildPassword(u.name)}`,
      );
    });

    console.log("\n// ALL USER IDs (for USER_IDS array in seed.js)");
    const nonAdminIds = generatedInserted
      .concat(compulsoryInserted.filter((u) => u.role !== "admin"))
      .map((u) => `"${u._id}"`);

    console.log(`const USER_IDS = [\n  ${nonAdminIds.join(",\n  ")}\n];`);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 User seed completed successfully");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message || err);
    process.exit(1);
  }
}

seed();
