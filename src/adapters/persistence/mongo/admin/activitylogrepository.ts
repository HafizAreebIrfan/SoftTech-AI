import { ActivityLogModel } from "../../models/admin/activityLog";

export function createActivityLogRepository() {
  return {
    async create(payload: any) {
      return await ActivityLogModel.create(payload);
    },

    async find(query: any = {}, options: { limit?: number; skip?: number } = {}) {
      const q = ActivityLogModel.find(query).sort({ createdAt: -1 });
      if (options.skip) q.skip(options.skip);
      if (options.limit) q.limit(options.limit);
      return await q.lean();
    },
  };
}

export default createActivityLogRepository;
