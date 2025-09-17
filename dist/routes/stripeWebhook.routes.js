"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/stripeWebhook.route.ts
const express_1 = __importDefault(require("express"));
const stripeWebhook_controller_1 = require("../controllers/stripeWebhook.controller");
const stripe_1 = __importDefault(require("stripe"));
const router = express_1.default.Router();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
router.post("/", express_1.default.raw({ type: "application/json" }), async (req, res) => {
    try {
        let event;
        if (process.env.NODE_ENV === "production") {
            // ✅ Verify signature in production
            const sig = req.headers["stripe-signature"];
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        else {
            // ⚠️ Skip verification for local / manual Postman testing
            event = req.body;
        }
        await (0, stripeWebhook_controller_1.handleStripeWebhook)(event);
        res.json({ received: true });
    }
    catch (error) {
        console.error("Webhook error:", error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
exports.default = router;
//# sourceMappingURL=stripeWebhook.routes.js.map