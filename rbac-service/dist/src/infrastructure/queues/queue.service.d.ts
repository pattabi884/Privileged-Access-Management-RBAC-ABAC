import { Queue } from 'bullmq';
export interface AuditJobData {
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    resourceId?: string;
    granted: boolean;
    reason: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    meatdata?: Record<string, any>;
}
export declare class QueueService {
    private auditQueue;
    constructor(auditQueue: Queue);
    addAuditLog(data: AuditJobData): Promise<void>;
    getQueueStatus(): Promise<{
        waiting: number;
        active: number;
        failed: number;
    }>;
}
