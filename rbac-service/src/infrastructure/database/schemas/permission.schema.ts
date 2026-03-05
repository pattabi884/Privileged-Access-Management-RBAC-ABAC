
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true })
  name: string; 


  @Prop({ required: true })
  resource: string; 

  @Prop({ required: true })
  action: string; 

  @Prop()
  description: string; 

  @Prop({ default: true })
  isActive: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

// Index for fast lookups by resource
PermissionSchema.index({ resource: 1 });

