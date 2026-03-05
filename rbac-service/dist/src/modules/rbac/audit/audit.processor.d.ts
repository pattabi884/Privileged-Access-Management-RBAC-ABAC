import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AuditService } from './audit.service';
import { SuspiciousActivityService } from './suspicious-activity.service';
export declare class AuditProcessor extends WorkerHost {
    private auditService;
    private suspiciousService;
    private logger;
    constructor(auditService: AuditService, suspiciousService: SuspiciousActivityService);
    process(job: Job<any>): Promise<void>;
}
