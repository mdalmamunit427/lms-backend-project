// routes/stripeWebhook.routes.ts
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import stripe from "../utils/stripe";
import { handleStripeWebhook } from "../controllers/stripeWebhook.controller";


const router = express.Router();

router.post(
  "/",
  bodyParser.raw({ type: "application/json" }), // Stripe needs raw body
  async (req: Request, res: Response) => {
    console.log(req.headers)
    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).send("Missing Stripe signature");

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      await handleStripeWebhook(event);
      res.json({ received: true });
    } catch (err: any) {
      console.error("Stripe webhook error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

export default router;
