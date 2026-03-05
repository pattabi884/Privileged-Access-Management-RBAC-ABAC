"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextEvaluatorService = void 0;
const common_1 = require("@nestjs/common");
const attribute_rules_1 = require("./attribute-rules");
let ContextEvaluatorService = class ContextEvaluatorService {
    evaluatePermission(permission, context) {
        const rules = attribute_rules_1.PERMISSION_RULES[permission] || [];
        if (rules.length === 0) {
            return {
                granted: true,
                reason: 'No attribute rules defined',
                evaluatedRules: [],
            };
        }
        const evaluatedRules = [];
        for (const rule of rules) {
            const result = this.evaluateRule(rule, context);
            evaluatedRules.push(`${rule.condition}: ${result.passed ? 'PASS' : 'FAIL'}`);
            if (!result.passed) {
                return {
                    granted: false,
                    reason: rule.errorMessage,
                    evaluatedRules,
                };
            }
        }
        return {
            granted: true,
            reason: 'All attribute rules satisfied',
            evaluatedRules,
        };
    }
    evaluateRule(rule, context) {
        switch (rule.condition) {
            case attribute_rules_1.RuleCondition.SAME_DEPARTMENT:
                return this.checkSameDepartment(context);
            case attribute_rules_1.RuleCondition.BUSINESS_HOURS:
                if (!rule.params) {
                    return { passed: false, details: 'Missing params for BUSINESS_HOURS rule' };
                }
                return this.checkBusinessHours(context, rule.params);
            case attribute_rules_1.RuleCondition.MFA_REQUIRED:
                return this.checkMFA(context);
            case attribute_rules_1.RuleCondition.TRUSTED_IP:
                if (!rule.params) {
                    return { passed: false, details: 'Missing params for TRUSTED_IP rule' };
                }
                return this.checkTrustedIP(context, rule.params);
            case attribute_rules_1.RuleCondition.RESOURCE_OWNER:
                return this.checkResourceOwner(context);
            case attribute_rules_1.RuleCondition.MAX_SESSION_AGE:
                if (!rule.params) {
                    return { passed: false, details: 'Missing params for MAX_SESSION_AGE rule' };
                }
                return this.checkSessionAge(context, rule.params);
            case attribute_rules_1.RuleCondition.WEEKDAY_ONLY:
                return this.checkWeekday(context);
            default:
                return { passed: false, details: 'Unknown rule condition' };
        }
    }
    checkSameDepartment(context) {
        if (!context.userDepartment || !context.resourceDepartment) {
            return { passed: false };
        }
        return {
            passed: context.userDepartment === context.resourceDepartment
        };
    }
    checkBusinessHours(context, params) {
        const hour = context.timestamp.getHours();
        const { start, end } = params;
        return { passed: hour >= start && hour < end };
    }
    checkMFA(context) {
        return { passed: context.hasMFA === true };
    }
    checkTrustedIP(context, params) {
        const { allowedRanges } = params;
        const ipPrefix = context.ipAddress.split('.').slice(0, 3).join('.');
        const isAllowed = allowedRanges.some(range => {
            const rangePrefix = range.split('/')[0].split('.').slice(0, 3).join('.');
            return ipPrefix === rangePrefix;
        });
        return { passed: isAllowed };
    }
    checkResourceOwner(context) {
        if (!context.resourceOwnerId) {
            return { passed: false };
        }
        return { passed: context.userId === context.resourceOwnerId };
    }
    checkSessionAge(context, params) {
        const { maxMinutes } = params;
        return { passed: context.sessionAge <= maxMinutes };
    }
    checkWeekday(context) {
        const dayOfWeek = context.timestamp.getDay();
        return { passed: dayOfWeek >= 1 && dayOfWeek <= 5 };
    }
};
exports.ContextEvaluatorService = ContextEvaluatorService;
exports.ContextEvaluatorService = ContextEvaluatorService = __decorate([
    (0, common_1.Injectable)()
], ContextEvaluatorService);
//# sourceMappingURL=context-evaluator.service.js.map