import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
import {
  AccessRequest,
  AccessRequestDocument,
  AccessRequestStatus,
} from '@infrastructure/database/schemas/access-request.schema';
import { GrantCacheService } from '@infrastructure/cache/grant-cache.service';
import { AuditService } from '@modules/rbac/audit/audit.service';

// Exported so access-requests.service.ts can import the type
// when it builds the job payload. Keeping the type here means
// the processor owns the shape of its own job data.
export interface GrantExpiryJobData {
  requestId: string;
}

@Processor('grants')
export class GrantExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(GrantExpiryProcessor.name);

  constructor(
    @InjectModel(AccessRequest.name)
    private readonly accessRequestModel: Model<AccessRequestDocument>,
    private readonly grantCacheService: GrantCacheService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async process(job: Job<GrantExpiryJobData>): Promise<void> {
    const { requestId } = job.data;
    this.logger.log(`Grant expiry job fired for request: ${requestId}`);

    const request = await this.accessRequestModel.findById(requestId);

    if (!request) {
      // Job data points to a document that no longer exists —
      // log and exit cleanly, don't throw (throwing retries the job)
      this.logger.warn(`Grant expiry job fired for unknown request: ${requestId}`);
      return;
    }

    // ── Guard — same pattern as your Pokémon battle processor ─────────────
    //
    // if (battle.status !== 'active') return;
    //
    // The manager may have manually revoked this grant between approval
    // and now. If status is REVOKED, we must not overwrite it with EXPIRED.
    // autoExpired: false on a REVOKED document means a human did it —
    // that distinction matters in security reviews.
    if (request.status !== AccessRequestStatus.APPROVED) {
      this.logger.log(
        `Request ${requestId} is already ${request.status} — skipping expiry write`,
      );
      return;
    }

    // ── Write EXPIRED back to MongoDB ──────────────────────────────────────
    //
    // autoExpired: true is the signal that this was a timer firing,
    // not a human action. The frontend renders this differently —
    // "⏱ auto-expired" badge vs "revoked" badge.
    request.status      = AccessRequestStatus.EXPIRED;
    request.autoExpired = true;
    await request.save();

    // ── Belt-and-suspenders Redis cleanup ──────────────────────────────────
    //
    // The EX TTL likely already deleted this key. deleteGrant on a
    // missing key is a Redis no-op — always safe to call.
    await this.grantCacheService.deleteGrantKey(
      request.requesterId,
      request.resource,
    );

    // ── Audit log entry ────────────────────────────────────────────────────
    //
    // ipAddress: 'system' and userAgent: 'grant-expiry-processor' make
    // it unambiguous in the audit log that this was automated, not a user.
    await this.auditService.logPermissionCheck({
      userId:     request.requesterId,
      permission: `${request.resource}:access`,
      granted:    false,
      reason:     `Temporal grant auto-expired after ${request.requestedDuration}`,
      context: {
        userId:        request.requesterId,
        userEmail:     request.requesterEmail,
        resourceType:  'access-request',
        resourceId:    requestId,
        ipAddress:     'system',
        userAgent:     'grant-expiry-processor',
        timestamp:     new Date(),
        hasMFA:        false,
        sessionAge:    0,
        deviceTrusted: false,
      },
    });

    this.logger.log(
      `Grant expired: ${request.requesterEmail} → ${request.resource} (duration: ${request.requestedDuration})`,
    );
  }
}