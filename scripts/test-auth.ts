import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

async function main() {
  await connectDB();
  const email = "admin@example.com";
  const password = "change-me";

  const user = await User.findOne({ email, isActive: true, status: "active" }).select("+passwordHash");
  console.log("USER FOUND:", user ? { id: user._id, email: user.email, hasHash: !!user.passwordHash } : null);

  if (user && user.passwordHash) {
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log("BCRYPT COMPARE:", ok);
  }
  process.exit(0);
}

main().catch(console.error);
