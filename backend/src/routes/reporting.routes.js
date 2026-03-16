import express from "express";
import {
  clockIn,
  getStatus,
  saveReport,
  submitReport,
  endDay,
  sendClockInCodes,
  sendReminders,
  triggerClockIn
} from "../controllers/reporting.controller.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public endpoints (rate limited)
router.post("/clock-in", authLimiter, clockIn);

// Session-authenticated endpoints
router.get("/status", getStatus);
router.post("/reports/:slotNumber/save", saveReport);
router.post("/reports/:slotNumber/submit", submitReport);
router.post("/end-day", endDay);

// Internal endpoints (protected by secret)
router.post("/internal/send-clock-in-codes", sendClockInCodes);
router.post("/internal/send-reminders", sendReminders);
router.post("/internal/trigger-clock-in", triggerClockIn);

export default router;
