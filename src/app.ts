import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalErrorHandler } from './middlewares/globalError';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// routes
import userRoutes from './routes/user.routes'
import coursesRoutes from "./routes/courses.routes";
import enrollmentRoutes from "./routes/enrollment.routes";
import stripeWebhookRoutes from "./routes/stripeWebhook.routes";
import couponRoutes from "./routes/coupon.routes";

app.use("/api/v1/courses", coursesRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/enrollment", enrollmentRoutes);
app.use("/api/v1/stripe/webhook", stripeWebhookRoutes);
app.use("/api/v1/coupon", couponRoutes);


app.use(globalErrorHandler);

app.get("/", (_req: Request, res:Response) => {
  res.send("LMS Backend Server is Running...")
})




export default app;