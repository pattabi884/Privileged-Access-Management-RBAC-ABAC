import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { UserDocument } from '@infrastructure/database/schemas/user.schema';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private userModel;
    constructor(configService: ConfigService, userModel: Model<UserDocument>);
    validate(payload: {
        userId: string;
        email: string;
        loginTime: Date;
        department: string | null;
        mfaVerified: boolean;
    }): Promise<{
        userId: string;
        email: string;
        name: string;
        department: string | null;
        mfaVerified: boolean;
        loginTime: Date;
    }>;
}
export {};
