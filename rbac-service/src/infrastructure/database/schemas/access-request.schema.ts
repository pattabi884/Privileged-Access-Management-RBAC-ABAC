import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccessRequestDocument = AccessRequest & Document;

export enum AccessRequestStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVOKED  = 'revoked',
  EXPIRED  = 'expired',   // set by BullMQ processor when grant TTL elapses
}

@Schema({ timestamps: true })
export class AccessRequest {
  @Prop({ required: true })
  requesterId: string;

  @Prop({ required: true })
  requesterEmail: string;

  @Prop({ required: true })
  resource: string;

  @Prop({ required: true })
  justification: string;

  @Prop({ required: true })
  requestedDuration: string;

  @Prop({
    type: String,
    enum: Object.values(AccessRequestStatus),
    default: AccessRequestStatus.PENDING,
  })
  status: AccessRequestStatus;

  // ── Temporal grant fields ──────────────────────────────────────────────────
  //
  // These three fields are all null/false at creation time and get populated
  // at the moment of approval. Nothing sets them before that point.

  // The absolute timestamp when this grant stops being valid.
  // Null for permanent grants. Mirrors the Redis EX TTL exactly —
  // if Redis says 120 seconds, expiresAt is Date.now() + 120000.
  @Prop({ type: Date, default: null })
  expiresAt: Date | null;

  // Stored explicitly rather than derived from expiresAt === null
  // so intent is unambiguous in queries and audit logs.
  @Prop({ default: false })
  isPermanent: boolean;

  // Set to true only by the BullMQ grant-expiry processor.
  // False means a human revoked it. True means the timer fired.
  // These are different events and the frontend shows them differently.
  @Prop({ default: false })
  autoExpired: boolean;

  // ── Review fields ──────────────────────────────────────────────────────────

  @Prop({ type: String, default: null })
  reviewerId: string | null;

  @Prop({ type: String, default: null })
  reviewerEmail: string | null;

  @Prop({ type: String, default: null })
  reviewNote: string | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  @Prop({ required: true })
  requesterIp: string;

  @Prop({ required: true })
  requesterUserAgent: string;
}

export const AccessRequestSchema = SchemaFactory.createForClass(AccessRequest);

// Existing indexes — keep these
AccessRequestSchema.index({ status: 1 });
AccessRequestSchema.index({ requesterId: 1 });

// Compound index for expiry queries:
// "find all approved grants where expiresAt < X" — used by future admin dashboard
// showing grants expiring in the next hour. Without this it's a full scan.
AccessRequestSchema.index({ status: 1, expiresAt: 1 });