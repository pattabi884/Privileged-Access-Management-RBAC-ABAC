import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true})
    email: string;

    @Prop({ required: true})
    name: string;

    @Prop({required: true})
    passwordHash: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Date })
    lastLoginAt?: Date;

    @Prop({ type: String })
    department?: string;
  
    @Prop({ default: false })
    mfaVerified: boolean;
  
    @Prop({ type: String, select: false})
    mfaSecret?: string;

}
export const UserSchema = SchemaFactory.createForClass(User)