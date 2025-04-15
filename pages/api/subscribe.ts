import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "subscribers.json");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    let subscribers: { email: string; date: string }[] = [];
    try {
      const data = await fs.readFile(filePath, "utf-8");
      subscribers = JSON.parse(data);
    } catch (error) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
    }

    if (subscribers.some((sub) => sub.email === email)) {
      return res.status(400).json({ message: "Email already subscribed" });
    }

    const newSubscriber = {
      email,
      date: new Date().toISOString(),
    };

    subscribers.push(newSubscriber);
    await fs.writeFile(filePath, JSON.stringify(subscribers, null, 2));

    return res.status(200).json({ message: "Thanks for subscribing!" });
  } catch (error) {
    console.error("Error handling subscription:", error);
    return res.status(500).json({ message: "Server error" });
  }
}