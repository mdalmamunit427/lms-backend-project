import express from "express";
import bodyParser from "body-parser";
import stripe from "../utils/stripe";
import { handleStripeWebhook } from "../controllers/stripeWebhook.controller";


const router = express.Router();

// ✅ Stripe requires raw body
router.post(
  "/",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("stripe web hooks")
    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).send("Missing Stripe signature");

    try {
      const event = stripe.webhooks.constructEvent(
        req.body, // ✅ still a Buffer
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      await handleStripeWebhook(event);

      return res.json({ received: true });
    } catch (err: any) {
      console.error("❌ Stripe webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

export default router;
