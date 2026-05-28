import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const reqBody = req.body;
    if (!reqBody) {
      console.error("Webhook: Missing request body");
      return res.status(200).json({ success: false, message: "Missing request body" });
    }
    const { data, type } = reqBody;
    if (!data || !type) {
      console.error("Webhook: Invalid request body");
      return res.status(200).json({ success: false, message: "Invalid request body" });
    }
    await webhook.verify(JSON.stringify(reqBody), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

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
