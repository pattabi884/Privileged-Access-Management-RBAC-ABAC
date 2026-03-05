import { PermissionDecision, PermissionContext } from './permission-context.interface';
export declare class ContextEvaluatorService {
    evaluatePermission(permission: string, context: PermissionContext): PermissionDecision;
    private evaluateRule;
    private checkSameDepartment;
    private checkBusinessHours;
    private checkMFA;
    private checkTrustedIP;
    private checkResourceOwner;
    private checkSessionAge;
    private checkWeekday;
}
