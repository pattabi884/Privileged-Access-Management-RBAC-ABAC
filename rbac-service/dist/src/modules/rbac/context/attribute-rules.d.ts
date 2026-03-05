export declare enum RuleCondition {
    SAME_DEPARTMENT = "SAME_DEPARTMENT",
    BUSINESS_HOURS = "BUSINESS_HOURS",
    MFA_REQUIRED = "MFA_REQUIRED",
    TRUSTED_IP = "TRUSTED_IP",
    RESOURCE_OWNER = "RESOURCE_OWNER",
    MAX_SESSION_AGE = "MAX_SESSION_AGE",
    WEEKDAY_ONLY = "WEEKDAY_ONLY"
}
export interface AttributeRule {
    condition: RuleCondition;
    params?: Record<string, any>;
    errorMessage: string;
}
export declare const PERMISSION_RULES: Record<string, AttributeRule[]>;
