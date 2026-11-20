"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../common/auth/public.decorator");
let AuthController = (() => {
    let _classDecorators = [(0, common_1.Controller)('v1')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _requestOtp_decorators;
    let _verifyOtp_decorators;
    let _resendOtp_decorators;
    let _issueSession_decorators;
    let _refresh_decorators;
    let _revoke_decorators;
    var AuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _requestOtp_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Post)('otp/request'), (0, common_1.HttpCode)(200)];
            _verifyOtp_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Post)('otp/verify'), (0, common_1.HttpCode)(200)];
            _resendOtp_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Post)('otp/resend'), (0, common_1.HttpCode)(200)];
            _issueSession_decorators = [(0, common_1.Post)('auth/session')];
            _refresh_decorators = [(0, common_1.Post)('auth/refresh')];
            _revoke_decorators = [(0, common_1.Post)('auth/revoke')];
            __esDecorate(this, null, _requestOtp_decorators, { kind: "method", name: "requestOtp", static: false, private: false, access: { has: obj => "requestOtp" in obj, get: obj => obj.requestOtp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _verifyOtp_decorators, { kind: "method", name: "verifyOtp", static: false, private: false, access: { has: obj => "verifyOtp" in obj, get: obj => obj.verifyOtp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resendOtp_decorators, { kind: "method", name: "resendOtp", static: false, private: false, access: { has: obj => "resendOtp" in obj, get: obj => obj.resendOtp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _issueSession_decorators, { kind: "method", name: "issueSession", static: false, private: false, access: { has: obj => "issueSession" in obj, get: obj => obj.issueSession }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _refresh_decorators, { kind: "method", name: "refresh", static: false, private: false, access: { has: obj => "refresh" in obj, get: obj => obj.refresh }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _revoke_decorators, { kind: "method", name: "revoke", static: false, private: false, access: { has: obj => "revoke" in obj, get: obj => obj.revoke }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        auth = __runInitializers(this, _instanceExtraInitializers);
        constructor(auth) {
            this.auth = auth;
        }
        async requestOtp(body, req) {
            return this.auth.requestOtp({
                purpose: body.purpose,
                channel: body.channel,
                destination: body.destination,
                ip: req.ip,
                deviceFingerprint: req.headers['x-device-fingerprint'] || 'unknown',
            });
        }
        async verifyOtp(body) {
            return this.auth.verifyOtp({
                purpose: body.purpose,
                channel: body.channel,
                destination: body.destination,
                challengeId: body.challengeId,
                code: body.code,
            });
        }
        async resendOtp(body) {
            return this.auth.resendOtp(body.challengeId);
        }
        async issueSession(body) {
            return this.auth.issueSession(body.identityId);
        }
        async refresh(body) {
            return this.auth.verifyRefresh(body.identityId, body.refreshToken);
        }
        async revoke(body) {
            return this.auth.revokeSession(body.identityId);
        }
    };
    return AuthController = _classThis;
})();
exports.AuthController = AuthController;
