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
exports.EkycController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/auth/jwt-auth.guard");
let EkycController = (() => {
    let _classDecorators = [(0, common_1.Controller)('v1/ekyc')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _request_decorators;
    let _approve_decorators;
    let _get_decorators;
    let _status_decorators;
    var EkycController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _request_decorators = [(0, common_1.Post)('requests'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
            _approve_decorators = [(0, common_1.Post)('requests/:id/approve')];
            _get_decorators = [(0, common_1.Get)('requests/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
            _status_decorators = [(0, common_1.Get)('identities/:pairwiseSub/status')];
            __esDecorate(this, null, _request_decorators, { kind: "method", name: "request", static: false, private: false, access: { has: obj => "request" in obj, get: obj => obj.request }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _approve_decorators, { kind: "method", name: "approve", static: false, private: false, access: { has: obj => "approve" in obj, get: obj => obj.approve }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _status_decorators, { kind: "method", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EkycController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        s = __runInitializers(this, _instanceExtraInitializers);
        constructor(s) {
            this.s = s;
        }
        async request(identityId, body) {
            return this.s.request(body.clientId, identityId, body.level, body.purpose, body.retentionDays);
        }
        async approve(id, body) {
            return this.s.approve(id, body.attestationJws);
        }
        async get(identityId, id, body) {
            return this.s.get(id, body.clientId);
        }
        async status(pairwiseSub) {
            return this.s.status(pairwiseSub);
        }
    };
    return EkycController = _classThis;
})();
exports.EkycController = EkycController;
