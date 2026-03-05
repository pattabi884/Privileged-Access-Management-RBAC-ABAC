import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { AuditLog } from '@infrastructure/database/schemas/audit-log.schema';
import { PermissionContext } from '../context/permission-context.interface';

export interface PermissionCheckLog {
  userId: string;
  permission: string;
  granted: boolean;
  reason: string;
  evaluatedRules?: string[];
  context: PermissionContext;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLog>,
    @InjectQueue('audit') private auditQueue: Queue,
  ) {}

  async logPermissionCheck(log: PermissionCheckLog) {
    // Don't queue granted read checks — they are noise.
    // We only care about: all denials, and granted writes/actions.
    const isReadPermission = log.permission.endsWith(':read');
    if (log.granted && isReadPermission) return;

    await this.auditQueue.add('permission-check', log);
  }

  // Idempotent — if a log with the same userId + permission + timestamp
  // already exists, return it instead of creating a duplicate.
  // This guards against BullMQ processing the same job twice (which happens
  // in dev due to React StrictMode firing useEffect twice on mount).
  async storeAuditLog(log: PermissionCheckLog) {
    // Round to nearest second — two BullMQ jobs from the same request
    // arrive milliseconds apart, so we treat anything within the same
    // second as a duplicate.
    const raw = new Date(log.context.timestamp);
    const timestamp = new Date(Math.round(raw.getTime() / 1000) * 1000);

    const existing = await this.auditModel.findOne({
      userId:     log.userId,
      permission: log.permission,
      granted:    log.granted,
      timestamp:  { $gte: new Date(timestamp.getTime() - 5000), $lte: new Date(timestamp.getTime() + 5000) },
    });

    if (existing) {
      return existing;
    }

    const doc = new this.auditModel({
      userId:         log.userId,
      userEmail:      log.context.userEmail,
      userDepartment: log.context.userDepartment,
      action:         'permission_check',
      permission:     log.permission,
      granted:        log.granted,
      reason:         log.reason,
      evaluatedRules: log.evaluatedRules || [],
      ipAddress:      log.context.ipAddress,
      userAgent:      log.context.userAgent,
      timestamp:      timestamp,
      resourceId:     log.context.resourceId,
      resourceType:   log.context.resourceType,
      hasMFA:         log.context.hasMFA,
      sessionAge:     log.context.sessionAge,
    });

    return doc.save();
  }

  async getUserAuditLogs(userId: string, limit = 50) {
    return this.auditModel.find({ userId }).sort({ timestamp: -1 }).limit(limit);
  }

  async getSuspiciousActivity(limit = 100) {
    return this.auditModel
      .find({ isSuspicious: true })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async markAsSuspicious(logId: string, reason: string) {
    return this.auditModel.findByIdAndUpdate(
      logId,
      { isSuspicious: true, suspiciousReason: reason },
      { returnDocument: 'after' },
    );
  }

  async getRecentLogs(limit = 200) {
    return this.auditModel
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}