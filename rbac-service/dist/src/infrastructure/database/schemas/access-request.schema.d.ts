import { Document } from 'mongoose';
export type AccessRequestDocument = AccessRequest & Document;
export declare enum AccessRequestStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    REVOKED = "revoked"
}
export declare class AccessRequest {
    requesterId: string;
    requesterEmail: string;
    resource: string;
    justification: string;
    requestedDuration: string;
    status: AccessRequestStatus;
    reviewerId: string | null;
    reviewerEmail: string | null;
    reviewNote: string | null;
    reviewedAt: Date | null;
    requesterIp: string;
    requesterUserAgent: string;
}
export declare const AccessRequestSchema: import("mongoose").Schema<AccessRequest, import("mongoose").Model<AccessRequest, any, any, any, (Document<unknown, any, AccessRequest, any, import("mongoose").DefaultSchemaOptions> & AccessRequest & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, AccessRequest, any, import("mongoose").DefaultSchemaOptions> & AccessRequest & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, AccessRequest>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AccessRequest, Document<unknown, {}, AccessRequest, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    requesterId?: import("mongoose").SchemaDefinitionProperty<string, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    requesterEmail?: import("mongoose").SchemaDefinitionProperty<string, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    resource?: import("mongoose").SchemaDefinitionProperty<string, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    justification?: import("mongoose").SchemaDefinitionProperty<string, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    requestedDuration?: import("mongoose").SchemaDefinitionProperty<string, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<AccessRequestStatus, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reviewerId?: import("mongoose").SchemaDefinitionProperty<string | null, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reviewerEmail?: import("mongoose").SchemaDefinitionProperty<string | null, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reviewNote?: import("mongoose").SchemaDefinitionProperty<string | null, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reviewedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    requesterIp?: import("mongoose").SchemaDefinitionProperty<string, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    requesterUserAgent?: import("mongoose").SchemaDefinitionProperty<string, AccessRequest, Document<unknown, {}, AccessRequest, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AccessRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AccessRequest>;
