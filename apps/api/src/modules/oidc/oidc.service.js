"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@amarid/shared");
let OidcService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OidcService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OidcService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        redis;
        logger = new common_1.Logger(OidcService.name);
        signingKey;
        jwks;
        constructor(prisma, redis) {
            this.prisma = prisma;
            this.redis = redis;
            this.initKeys();
        }
        async initKeys() {
            const { generateKeyPair, exportJWK } = await Promise.resolve().then(() => __importStar(require('jose')));
            const pair = await generateKeyPair('ES256');
            const pubJWK = await exportJWK(pair.publicKey);
            this.signingKey = pair.privateKey;
            this.jwks = { keys: [{ ...pubJWK, alg: 'ES256', use: 'sig', kid: 'amarid-v1' }] };
        }
        getJwks() { return this.jwks; }
        getDiscovery(issuer) {
            return {
                issuer,
                authorization_endpoint: `${issuer}/authorize`,
                token_endpoint: `${issuer}/token`,
                userinfo_endpoint: `${issuer}/userinfo`,
                jwks_uri: `${issuer}/jwks.json`,
                scopes_supported: ['openid', 'profile.name', 'age.over_18', 'contact.phone_verified', 'uniqueness.promo', 'kyc.level', 'status.active', 'offline_access'],
                response_types_supported: ['code'],
                subject_types_supported: ['pairwise'],
                id_token_signing_alg_values_supported: ['ES256'],
                code_challenge_methods_supported: ['S256'],
            };
        }
        async authorize(p) {
            const client = await this.prisma.oidcClient.findUnique({ where: { clientId: p.client_id } });
            if (!client)
                throw new common_1.NotFoundException('Unknown client');
            if (!client.redirectUris.includes(p.redirect_uri))
                throw new common_1.ForbiddenException('Redirect mismatch');
            const reqId = (0, shared_1.randomHex)(16);
            await this.redis.set(this.redis.key('oidc', 'authreq', reqId), JSON.stringify(p), 600);
            return { requestId: reqId, client: { name: client.name }, scopes: p.scope.split(' ') };
        }
        async consent(requestId, identityId, approve, scopes) {
            const raw = await this.redis.get(this.redis.key('oidc', 'authreq', requestId));
            if (!raw)
                throw new common_1.NotFoundException('Request expired');
            const req = JSON.parse(raw);
            if (req.identityId !== identityId)
                throw new common_1.ForbiddenException('Not your request');
            if (!approve) {
                await this.redis.del(this.redis.key('oidc', 'authreq', requestId));
                return { approved: false };
            }
            const code = (0, shared_1.randomHex)(24);
            await this.redis.set(this.redis.key('oidc', 'code', code), JSON.stringify({ ...req, approvedScopes: scopes.join(' ') }), 600);
            await this.redis.del(this.redis.key('oidc', 'authreq', requestId));
            return { approved: true, code, redirect_uri: req.redirect_uri, state: req.state };
        }
        async token(p) {
            const { grant_type, code, code_verifier, client_id } = p;
            if (grant_type !== 'authorization_code')
                throw new common_1.BadRequestException('Unsupported grant');
            if (!code || !code_verifier)
                throw new common_1.BadRequestException('Missing code/verifier');
            const raw = await this.redis.get(this.redis.key('oidc', 'code', code));
            if (!raw)
                throw new common_1.NotFoundException('Invalid/expired code');
            const req = JSON.parse(raw);
            if (req.client_id !== client_id)
                throw new common_1.ForbiddenException('Client mismatch');
            if ((0, shared_1.sha256Hex)(code_verifier) !== req.code_challenge)
                throw new common_1.ForbiddenException('PKCE mismatch');
            const tokens = await this.issueTokens(req.identityId, client_id, req.approvedScopes || req.scope, req.nonce);
            await this.redis.del(this.redis.key('oidc', 'code', code));
            return tokens;
        }
        async issueTokens(identityId, clientId, scopes, nonce) {
            const { SignJWT } = await Promise.resolve().then(() => __importStar(require('jose')));
            const client = await this.prisma.oidcClient.findUnique({ where: { clientId } });
            const sector = client?.sectorIdentifier || clientId;
            const sub = (0, shared_1.sha256Hex)(`${identityId}|${sector}`); // pairwise sub
            const issuer = process.env.OIDC_ISSUER || 'http://localhost:4000';
            const now = Math.floor(Date.now() / 1000);
            const header = { alg: 'ES256', kid: 'amarid-v1' };
            const accessToken = await new SignJWT({ sub, clientId, scopes }).setProtectedHeader(header).setIssuer(issuer).setSubject(sub).setAudience(clientId).setIssuedAt(now).setExpirationTime(now + 600).sign(this.signingKey);
            const idToken = await new SignJWT({ sub, clientId, scopes, nonce, acr: 'aid:loa3', auth_time: now }).setProtectedHeader(header).setIssuer(issuer).setSubject(sub).setAudience(clientId).setIssuedAt(now).setExpirationTime(now + 900).sign(this.signingKey);
            const refreshToken = (0, shared_1.randomHex)(32);
            await this.redis.set(this.redis.key('oidc', 'refresh', refreshToken), JSON.stringify({ sub, clientId, scopes }), 30 * 86400);
            return { access_token: accessToken, id_token: idToken, refresh_token: refreshToken, token_type: 'Bearer', expires_in: 600 };
        }
        async userinfo(accessToken) {
            const { jwtVerify, importSPKI } = await Promise.resolve().then(() => __importStar(require('jose')));
            const pair = (await importSPKI(this.jwks.keys[0], 'ES256'));
            const { payload } = await jwtVerify(accessToken, pair.publicKey, { algorithms: ['ES256'] });
            return { sub: payload.sub, acr: 'aid:loa3', name_verified: true, age_over_18: true, phone_verified: true, status_active: true };
        }
    };
    return OidcService = _classThis;
})();
exports.OidcService = OidcService;
