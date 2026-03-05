"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSessionAge = calculateSessionAge;
exports.getClientIp = getClientIp;
function calculateSessionAge(loginTime) {
    if (!loginTime)
        return 9999;
    const diffMs = Date.now() - new Date(loginTime).getTime();
    return Math.floor(diffMs / 1000 / 60);
}
function getClientIp(request) {
    return (request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        request.headers['x-real-ip'] ||
        request.connection?.remoteAddress ||
        request.socket?.remoteAddress ||
        'unknown');
}
//# sourceMappingURL=auth.utils.js.map