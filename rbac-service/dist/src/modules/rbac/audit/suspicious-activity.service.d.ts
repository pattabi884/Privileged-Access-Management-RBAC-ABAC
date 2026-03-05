import { AuditLog } from '@infrastructure/database/schemas/audit-log.schema';
import { Model } from 'mongoose';
export declare class SuspiciousActivityService {
    private auditModel;
    constructor(auditModel: Model<AuditLog>);
    analyze(userId: string, log: any): Promise<{
        detected: boolean;
        reason?: undefined;
    } | {
        detected: boolean;
        reason: string;
    }>;
    private checkRapidDenials;
    private checkOffHours;
}
