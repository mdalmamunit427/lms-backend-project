// routes/stripeWebhook.route.ts
import express from "express";
import { handleStripeWebhook } from "../controllers/stripeWebhook.controller";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      let event: Stripe.Event;

      if (process.env.NODE_ENV === "production") {
        // ✅ Verify signature in production
        const sig = req.headers["stripe-signature"] as string;
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } else {
        // ⚠️ Skip verification for local / manual Postman testing
        event = req.body as Stripe.Event;
      }

      await handleStripeWebhook(event);

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).send(`Webhook Error: ${(error as Error).message}`);
    }
  }
);

export default router;
