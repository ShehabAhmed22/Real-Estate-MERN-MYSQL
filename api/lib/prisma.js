import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ["error", "warn"],
});

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("DB connected ✅");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
}

connectDB();

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
