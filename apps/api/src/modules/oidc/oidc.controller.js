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
exports.OidcController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../common/auth/public.decorator");
let OidcController = (() => {
    let _classDecorators = [(0, common_1.Controller)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _discovery_decorators;
    let _jwks_decorators;
    let _authorize_decorators;
    let _consent_decorators;
    let _token_decorators;
    let _userinfo_decorators;
    var OidcController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _discovery_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Get)('.well-known/openid-configuration')];
            _jwks_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Get)('jwks.json')];
            _authorize_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Post)('authorize')];
            _consent_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Post)('consent')];
            _token_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Post)('token')];
            _userinfo_decorators = [(0, public_decorator_1.Public)(), (0, common_1.Post)('userinfo')];
            __esDecorate(this, null, _discovery_decorators, { kind: "method", name: "discovery", static: false, private: false, access: { has: obj => "discovery" in obj, get: obj => obj.discovery }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _jwks_decorators, { kind: "method", name: "jwks", static: false, private: false, access: { has: obj => "jwks" in obj, get: obj => obj.jwks }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _authorize_decorators, { kind: "method", name: "authorize", static: false, private: false, access: { has: obj => "authorize" in obj, get: obj => obj.authorize }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _consent_decorators, { kind: "method", name: "consent", static: false, private: false, access: { has: obj => "consent" in obj, get: obj => obj.consent }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _token_decorators, { kind: "method", name: "token", static: false, private: false, access: { has: obj => "token" in obj, get: obj => obj.token }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _userinfo_decorators, { kind: "method", name: "userinfo", static: false, private: false, access: { has: obj => "userinfo" in obj, get: obj => obj.userinfo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OidcController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        oidc = __runInitializers(this, _instanceExtraInitializers);
        constructor(oidc) {
            this.oidc = oidc;
        }
        discovery(issuer) {
            return this.oidc.getDiscovery(issuer || 'http://localhost:4000');
        }
        jwks() {
            return this.oidc.getJwks();
        }
        async authorize(body) {
            return this.oidc.authorize({
                client_id: body.client_id, redirect_uri: body.redirect_uri, scope: body.scope,
                state: body.state, nonce: body.nonce, code_challenge: body.code_challenge,
                identityId: body.identityId,
            });
        }
        async consent(body) {
            return this.oidc.consent(body.requestId, body.identityId, body.approve, body.scopes);
        }
        async token(body) {
            return this.oidc.token(body);
        }
        async userinfo(body) {
            return this.oidc.userinfo(body.accessToken);
        }
    };
    return OidcController = _classThis;
})();
exports.OidcController = OidcController;
