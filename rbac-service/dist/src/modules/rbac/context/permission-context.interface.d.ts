export interface PermissionContext {
    userId: string;
    userEmail: string;
    userDepartment?: string;
    userRole?: string;
    resourceId?: string;
    resourceType: string;
    resourceDepartment?: string;
    resourceOwnerId?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    hasMFA: boolean;
    sessionAge: number;
    deviceTrusted: boolean;
}
export interface PermissionDecision {
    granted: boolean;
    reason: string;
    evaluatedRules: string[];
}
