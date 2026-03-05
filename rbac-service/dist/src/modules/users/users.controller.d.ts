import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("../../infrastructure/database/schemas/user.schema").UserDocument[]>;
    findOne(id: string): Promise<import("../../infrastructure/database/schemas/user.schema").UserDocument>;
    update(id: string, body: {
        name?: string;
        email?: string;
        isActive?: boolean;
        deaprtment?: string;
    }): Promise<import("../../infrastructure/database/schemas/user.schema").UserDocument>;
    deactivate(id: string): Promise<import("../../infrastructure/database/schemas/user.schema").UserDocument>;
}
