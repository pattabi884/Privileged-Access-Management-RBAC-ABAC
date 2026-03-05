import { Cache } from 'cache-manager';
export declare class RbacCacheService {
    private cacheManager;
    private readonly TTL;
    constructor(cacheManager: Cache);
    getUserPermissions(userId: string): Promise<string[] | null>;
    setUserPermissions(userId: string, permissions: string[]): Promise<void>;
    invalidateUserCache(userId: string): Promise<void>;
    private getRoleUsers;
    addUserToRoleIndex(roleId: string, userId: string): Promise<void>;
    removeUserFromRoleIndex(roleId: string, userId: string): Promise<void>;
    invalidateRoleCache(roleId: string): Promise<void>;
}
