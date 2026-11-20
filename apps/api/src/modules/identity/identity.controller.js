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
exports.IdentityController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/auth/jwt-auth.guard");
const public_decorator_1 = require("../../common/auth/public.decorator");
let IdentityController = (() => {
    let _classDecorators = [(0, common_1.Controller)('v1')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _me_decorators;
    let _card_decorators;
    let _status_decorators;
    let _suspend_decorators;
    var IdentityController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _me_decorators = [(0, common_1.Get)('me'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
            _card_decorators = [(0, common_1.Get)('me/card'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
            _status_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Get)('identities/:universalId/status')];
            _suspend_decorators = [(0, common_1.Post)('admin/identities/:id/suspend'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
            __esDecorate(this, null, _me_decorators, { kind: "method", name: "me", static: false, private: false, access: { has: obj => "me" in obj, get: obj => obj.me }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _card_decorators, { kind: "method", name: "card", static: false, private: false, access: { has: obj => "card" in obj, get: obj => obj.card }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _status_decorators, { kind: "method", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _suspend_decorators, { kind: "method", name: "suspend", static: false, private: false, access: { has: obj => "suspend" in obj, get: obj => obj.suspend }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IdentityController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        identity = __runInitializers(this, _instanceExtraInitializers);
        constructor(identity) {
            this.identity = identity;
        }
        async me(identityId) {
            return this.identity.getProfile(identityId);
        }
        async card(identityId) {
            return this.identity.getCard(identityId);
        }
        async status(universalId) {
            return { universalId, status: 'active' }; // coarse public status only
        }
        async suspend(id, body) {
            return this.identity.suspend(id, body.reason);
        }
    };
    return IdentityController = _classThis;
})();
exports.IdentityController = IdentityController;
