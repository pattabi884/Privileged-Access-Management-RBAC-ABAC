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
export declare class AuditService {
    private auditModel;
    private auditQueue;
    constructor(auditModel: Model<AuditLog>, auditQueue: Queue);
    logPermissionCheck(log: PermissionCheckLog): Promise<void>;
    storeAuditLog(log: PermissionCheckLog): Promise<import("mongoose").Document<unknown, {}, AuditLog, {}, import("mongoose").DefaultSchemaOptions> & AuditLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getUserAuditLogs(userId: string, limit?: number): Promise<(import("mongoose").Document<unknown, {}, AuditLog, {}, import("mongoose").DefaultSchemaOptions> & AuditLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getSuspiciousActivity(limit?: number): Promise<(import("mongoose").Document<unknown, {}, AuditLog, {}, import("mongoose").DefaultSchemaOptions> & AuditLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    markAsSuspicious(logId: string, reason: string): Promise<(import("mongoose").Document<unknown, {}, AuditLog, {}, import("mongoose").DefaultSchemaOptions> & AuditLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    getRecentLogs(limit?: number): Promise<(import("mongoose").Document<unknown, {}, AuditLog, {}, import("mongoose").DefaultSchemaOptions> & AuditLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
}
