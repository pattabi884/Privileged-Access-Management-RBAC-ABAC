// src/modules/rbac/audit/suspicious-activity.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuditLog } from '@infrastructure/database/schemas/audit-log.schema';
import { Model } from 'mongoose';

@Injectable()
export class SuspiciousActivityService {
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLog>,
  ) {}

  async analyze(userId: string, log: any) {
    const checks = await Promise.all([
      this.checkRapidDenials(userId, log),
      this.checkOffHours(log),
    ]);
    return checks.find(c => c.detected) || { detected: false };
  }

  private async checkRapidDenials(userId: string, log: any) {
    if (log.granted) return { detected: false };

    const oneHourAgo = new Date(Date.now() - 3600000);
    const count = await this.auditModel.countDocuments({
      userId,
      granted: false,
      timestamp: { $gte: oneHourAgo },
    });

    if (count >= 5) {
      return {
        detected: true,
        reason: `${count} access denials recorded within the last 60 minutes — possible privilege escalation or misconfigured account`,
      };
    }
    return { detected: false };
  }

  private async checkOffHours(log: any) {
    const hour = new Date(log.context.timestamp).getHours();
    if (hour < 8 || hour >= 20) {
      if (log.permission.includes('delete')) {
        return {
          detected: true,
          reason: `Destructive operation attempted outside business hours (${hour}:00)`,
        };
      }
    }
    return { detected: false };
  }
}