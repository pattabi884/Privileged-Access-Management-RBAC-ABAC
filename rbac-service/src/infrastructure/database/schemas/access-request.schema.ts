import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccessRequestDocument = AccessRequest & Document;
export enum AccessRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    REVOKED = 'revoked',
}
@Schema({ timestamps: true })
export class AccessRequest {
    //who is requesting 
    @Prop({ required: true })
    requesterId: string;

    @Prop({ required: true })
    requesterEmail: string;
    //what they wann aacess free orm string 
    @Prop({ required: true})
    resource: string;

    @Prop({ required: true })
    justification: string;

    @Prop({ required: true })
    requestedDuration: string;

    //request lifecycle 
     @Prop({
    type: String,
    enum: Object.values(AccessRequestStatus),
    default: AccessRequestStatus.PENDING,
  })
  status: AccessRequestStatus;


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

// Index on status so the approver queue query (find all pending) is fast.
// Index on requesterId so "my requests" queries are fast.

AccessRequestSchema.index({ status: 1 });
AccessRequestSchema.index({ requesterId: 1 });
