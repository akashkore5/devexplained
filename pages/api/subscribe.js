import { put, list } from "@vercel/blob";

export default async function handler(req, res) {
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
    const blobKey = "subscribers.json";

    // Fetch existing subscribers
    let subscribers = [];
    try {
      const { blobs } = await list({ prefix: blobKey });
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url);
        subscribers = await response.json();
      }
    } catch (error) {
      console.error("Error reading blob:", error);
    }

    // Check for duplicate email
    if (subscribers.some((sub) => sub.email === email)) {
      return res.status(400).json({ message: "Email already subscribed" });
    }

    // Add new subscriber
    const newSubscriber = {
      email,
      date: new Date().toISOString(),
    };
    subscribers.push(newSubscriber);

    // Update blob
    await put(blobKey, JSON.stringify(subscribers, null, 2), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });

    return res.status(200).json({ message: "Thanks for subscribing!" });
  } catch (error) {
    console.error("Error handling subscription:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
