import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

const uri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Verify JWT token
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { type, itemId, status, notes } = req.body;

  if (!type || !itemId || !status) {
    return res.status(400).json({ message: "Type, itemId, and status are required" });
  }

  let client;
  try {
    client = await MongoClient.connect(uri);
    const db = client.db("leetcodesolve");
    const progress = await db.collection("progress").findOneAndUpdate(
      { userId: decoded.userId, type, itemId },
      {
        $set: {
          status,
          notes: notes || "",
          lastUpdated: new Date(),
          attemptCount: { $inc: 1 },
        },
        $setOnInsert: { userId: decoded.userId },
      },
      { upsert: true, returnDocument: "after" }
    );

    return res.status(200).json({ message: "Progress updated", progress });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}