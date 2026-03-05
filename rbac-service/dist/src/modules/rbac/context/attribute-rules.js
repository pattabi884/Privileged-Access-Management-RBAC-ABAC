"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_RULES = exports.RuleCondition = void 0;
var RuleCondition;
(function (RuleCondition) {
    RuleCondition["SAME_DEPARTMENT"] = "SAME_DEPARTMENT";
    RuleCondition["BUSINESS_HOURS"] = "BUSINESS_HOURS";
    RuleCondition["MFA_REQUIRED"] = "MFA_REQUIRED";
    RuleCondition["TRUSTED_IP"] = "TRUSTED_IP";
    RuleCondition["RESOURCE_OWNER"] = "RESOURCE_OWNER";
    RuleCondition["MAX_SESSION_AGE"] = "MAX_SESSION_AGE";
    RuleCondition["WEEKDAY_ONLY"] = "WEEKDAY_ONLY";
})(RuleCondition || (exports.RuleCondition = RuleCondition = {}));
exports.PERMISSION_RULES = {
    'access:approve': [
        {
            condition: RuleCondition.MFA_REQUIRED,
            errorMessage: 'MFA verification required to approve acess requests',
        },
        {
            condition: RuleCondition.WEEKDAY_ONLY,
            errorMessage: 'Session expired, Please re-login to approve requests'
        },
    ],
    'access:revoke': [
        {
            condition: RuleCondition.MFA_REQUIRED,
            errorMessage: 'MFA verification required to revoke acess requests',
        },
    ],
    'users:delete': [
        {
            condition: RuleCondition.SAME_DEPARTMENT,
            errorMessage: 'Can only delete users from your department',
        },
        {
            condition: RuleCondition.BUSINESS_HOURS,
            params: { start: 9, end: 18 },
            errorMessage: 'User deletion only allowed during business hours (9 AM - 6 PM)',
        },
        {
            condition: RuleCondition.MFA_REQUIRED,
            errorMessage: 'MFA verification required for user deletion',
        },
    ],
    'users:update': [
        {
            condition: RuleCondition.BUSINESS_HOURS,
            params: { start: 9, end: 18 },
            errorMessage: 'User updates only allowed during business hours',
        },
    ],
    'invoices:approve': [
        {
            condition: RuleCondition.MFA_REQUIRED,
            errorMessage: 'MFA required for invoice approval',
        },
        {
            condition: RuleCondition.WEEKDAY_ONLY,
            errorMessage: 'Invoice approval only allowed on weekdays',
        },
        {
            condition: RuleCondition.MAX_SESSION_AGE,
            params: { maxMinutes: 30 },
            errorMessage: 'Session too old. Please re-login to approve invoices',
        },
    ],
    'reports:export': [
        {
            condition: RuleCondition.TRUSTED_IP,
            params: { allowedRanges: ['192.168.1.0/24', '10.0.0.0/8'] },
            errorMessage: 'Report export only allowed from company network',
        },
    ],
};
//# sourceMappingURL=attribute-rules.js.map