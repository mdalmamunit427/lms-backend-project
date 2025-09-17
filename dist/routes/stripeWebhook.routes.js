"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/stripeWebhook.routes.ts
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const stripe_1 = __importDefault(require("../utils/stripe"));
const stripeWebhook_controller_1 = require("../controllers/stripeWebhook.controller");
const router = express_1.default.Router();
router.post("/", body_parser_1.default.raw({ type: "application/json" }), // Stripe needs raw body
async (req, res) => {
    console.log(req.headers);
    const sig = req.headers["stripe-signature"];
    if (!sig)
        return res.status(400).send("Missing Stripe signature");
    try {
        const event = stripe_1.default.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        await (0, stripeWebhook_controller_1.handleStripeWebhook)(event);
        res.json({ received: true });
    }
    catch (err) {
        console.error("Stripe webhook error:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});
exports.default = router;
//# sourceMappingURL=stripeWebhook.routes.js.map