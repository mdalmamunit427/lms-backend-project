import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalErrorHandler } from './middlewares/globalError';

import userRoutes from './routes/user.routes'

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

app.use("/api/v1/user", userRoutes);

app.use(globalErrorHandler);

app.get("/", (_req: Request, res:Response) => {
  res.send("LMS Backend Server is Running...")
})




export default app;