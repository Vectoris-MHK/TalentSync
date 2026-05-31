import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret === "your_svix_webhook_secret") {
      console.error("Webhook: CLERK_WEBHOOK_SECRET is not configured");
      return res.status(500).json({ success: false, message: "Webhook secret not configured" });
    }

    const webhook = new Webhook(webhookSecret);

    // req.body is a Buffer when using express.raw()
    const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));

    let payload;
    try {
      payload = webhook.verify(rawBody, {
        "svix-id": req.headers["svix-id"],
        "svix-timestamp": req.headers["svix-timestamp"],
        "svix-signature": req.headers["svix-signature"],
      });
    } catch (verifyErr) {
      console.error("Webhook signature verification failed:", verifyErr.message);
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const { data, type } = payload;
    if (!data || !type) {
      console.error("Webhook: Invalid payload");
      return res.status(200).json({ success: false, message: "Invalid request body" });
    }

    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0]?.email_address || "",
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          image: data.image_url,
          resume: "",
        };
        await User.create(userData);
        res.json({});
        break;
      }
      case "user.updated": {
        const userData = {
          email: data.email_addresses[0]?.email_address || "",
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          image: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        res.json({});
        break;
      }
      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        res.json({});
        break;
      }
      default:
        res.status(200).json({ success: false, message: "Unhandled event type" });
        break;
    }
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(200).json({ success: false, message: "Webhooks Error" });
  }
};
