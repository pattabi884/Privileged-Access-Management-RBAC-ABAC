"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessRequestSchema = exports.AccessRequest = exports.AccessRequestStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var AccessRequestStatus;
(function (AccessRequestStatus) {
    AccessRequestStatus["PENDING"] = "pending";
    AccessRequestStatus["APPROVED"] = "approved";
    AccessRequestStatus["REJECTED"] = "rejected";
    AccessRequestStatus["REVOKED"] = "revoked";
})(AccessRequestStatus || (exports.AccessRequestStatus = AccessRequestStatus = {}));
let AccessRequest = class AccessRequest {
};
exports.AccessRequest = AccessRequest;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AccessRequest.prototype, "requesterId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AccessRequest.prototype, "requesterEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AccessRequest.prototype, "resource", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AccessRequest.prototype, "justification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AccessRequest.prototype, "requestedDuration", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(AccessRequestStatus),
        default: AccessRequestStatus.PENDING,
    }),
    __metadata("design:type", String)
], AccessRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], AccessRequest.prototype, "reviewerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], AccessRequest.prototype, "reviewerEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], AccessRequest.prototype, "reviewNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], AccessRequest.prototype, "reviewedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AccessRequest.prototype, "requesterIp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AccessRequest.prototype, "requesterUserAgent", void 0);
exports.AccessRequest = AccessRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], AccessRequest);
exports.AccessRequestSchema = mongoose_1.SchemaFactory.createForClass(AccessRequest);
exports.AccessRequestSchema.index({ status: 1 });
exports.AccessRequestSchema.index({ requesterId: 1 });
//# sourceMappingURL=access-request.schema.js.map