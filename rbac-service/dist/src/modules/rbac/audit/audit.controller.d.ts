import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getRecent(limit: number): Promise<(import("mongoose").Document<unknown, {}, import("../../../infrastructure/database/schemas/audit-log.schema").AuditLog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../infrastructure/database/schemas/audit-log.schema").AuditLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getSuspicious(limit: number): Promise<(import("mongoose").Document<unknown, {}, import("../../../infrastructure/database/schemas/audit-log.schema").AuditLog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../infrastructure/database/schemas/audit-log.schema").AuditLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getUserLogs(userId: string, limit: number): Promise<(import("mongoose").Document<unknown, {}, import("../../../infrastructure/database/schemas/audit-log.schema").AuditLog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../infrastructure/database/schemas/audit-log.schema").AuditLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
}
