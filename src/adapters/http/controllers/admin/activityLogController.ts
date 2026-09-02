import { Request, Response, NextFunction } from "express";
import { createActivityLogRepository } from "../../../persistence/mongo/admin/activitylogrepository";

const repo = createActivityLogRepository();

export async function createActivityLogController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = {
      action: req.body.action,
      actorId: req.body.actorId,
      actorType: req.body.actorType,
      meta: req.body.meta,
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    };

    const doc = await repo.create(payload);

    res.status(201).json({ success: true, message: "Activity logged", data: doc });
  } catch (error) {
    next(error);
  }
}

export async function getActivityLogsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
    const page = typeof req.query.page === "string" ? Math.max(Number(req.query.page), 1) : 1;
    const skip = (page - 1) * limit;

    const filters: any = {};
    if (req.query.actorId) filters.actorId = req.query.actorId;
    if (req.query.actorType) filters.actorType = req.query.actorType;

    const logs = await repo.find(filters, { limit, skip });

    res.status(200).json({ success: true, message: "Activity logs fetched", data: logs });
  } catch (error) {
    next(error);
  }
}
