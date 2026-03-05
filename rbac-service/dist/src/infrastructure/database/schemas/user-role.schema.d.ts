import { Document, Types } from 'mongoose';
export type UserRoleDocument = UserRole & Document;
export declare class UserRole {
    userId: Types.ObjectId;
    roleId: Types.ObjectId;
    assignedAt: Date;
    assignedBy: string;
    expiresAt?: Date;
}
export declare const UserRoleSchema: import("mongoose").Schema<UserRole, import("mongoose").Model<UserRole, any, any, any, (Document<unknown, any, UserRole, any, import("mongoose").DefaultSchemaOptions> & UserRole & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, UserRole, any, import("mongoose").DefaultSchemaOptions> & UserRole & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, UserRole>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserRole, Document<unknown, {}, UserRole, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserRole & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserRole, Document<unknown, {}, UserRole, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserRole & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    roleId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserRole, Document<unknown, {}, UserRole, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserRole & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    assignedAt?: import("mongoose").SchemaDefinitionProperty<Date, UserRole, Document<unknown, {}, UserRole, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserRole & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    assignedBy?: import("mongoose").SchemaDefinitionProperty<string, UserRole, Document<unknown, {}, UserRole, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserRole & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, UserRole, Document<unknown, {}, UserRole, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserRole & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, UserRole>;
