import { Model } from 'mongoose';
import { UserDocument } from '@infrastructure/database/schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(data: {
        email: string;
        name: string;
        passwordHash: string;
    }): Promise<UserDocument>;
    findAll(): Promise<UserDocument[]>;
    findOne(id: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    update(id: string, data: Partial<{
        name: string;
        email: string;
        isActive: boolean;
        department: string;
    }>): Promise<UserDocument>;
    deactivate(id: string): Promise<UserDocument>;
}
