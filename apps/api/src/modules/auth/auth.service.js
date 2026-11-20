"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@amarid/shared");
const shared_2 = require("@amarid/shared");
let AuthService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        redis;
        jwt;
        config;
        mailer;
        sms;
        logger = new common_1.Logger(AuthService.name);
        constructor(prisma, redis, jwt, config, mailer, sms) {
            this.prisma = prisma;
            this.redis = redis;
            this.jwt = jwt;
            this.config = config;
            this.mailer = mailer;
            this.sms = sms;
        }
        pepper = process.env.PEPPER_HEX || 'dev';
        /* ============ OTP (file 03) ============ */
        async requestOtp(params) {
            const { purpose, channel, destination, ip, deviceFingerprint } = params;
            const [destCount, ipCount, devCount] = await Promise.all([
                this.redis.incr(this.redis.key('otp', 'rate', 'dest', channel, destination), 86400),
                this.redis.incr(this.redis.key('otp', 'rate', 'ip', ip), 3600),
                this.redis.incr(this.redis.key('otp', 'rate', 'dev', deviceFingerprint), 3600),
            ]);
            if (destCount > shared_2.OTP.destinationPerDay || ipCount > shared_2.OTP.ipPerHour || devCount > shared_2.OTP.devicePerHour) {
                throw new common_1.ConflictException('OTP_RATE_LIMITED');
            }
            const challengeId = (0, shared_1.randomHex)(16);
            const otp = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
            const ttl = channel === 'sms' ? shared_2.OTP.smsTtlSeconds : shared_2.OTP.emailTtlSeconds;
            // Never store plain OTP — store HMAC(otp + challengeId) (file 03 rule)
            const stored = (0, shared_1.hmacSha256Hex)(otp + challengeId, this.pepper);
            const key = this.redis.key('otp', purpose, channel, destination, challengeId);
            await this.redis.set(key, stored, ttl);
            await this.redis.set(this.redis.key('otp', 'resend', challengeId), Date.now().toString(), ttl);
            if (channel === 'sms') {
                await this.sms.send(destination, `AmarID: ${otp} is your verification code. Valid for ${shared_2.OTP.smsTtlSeconds / 60} minutes. Never share it with anyone.\n@amarid.local #${otp}`);
            }
            else {
                await this.mailer.send({
                    to: destination,
                    subject: 'AmarID verification code',
                    text: `Your code is ${otp}. Valid for ${shared_2.OTP.emailTtlSeconds / 60} minutes.`,
                    html: `<p>Your code is <b>${otp}</b>. Valid for ${shared_2.OTP.emailTtlSeconds / 60} minutes.</p>`,
                });
            }
            if (process.env.OTP_DEV_MODE === 'true') {
                this.logger.warn(`[DEV OTP] ${channel}=${destination} code=${otp}`);
            }
            return {
                challengeId,
                expiresAt: new Date(Date.now() + ttl * 1000),
                resendAvailableAt: new Date(Date.now() + shared_2.OTP.resendCooldownSeconds * 1000),
            };
        }
        async verifyOtp(params) {
            const { purpose, channel, destination, challengeId, code } = params;
            const key = this.redis.key('otp', purpose, channel, destination, challengeId);
            const stored = await this.redis.get(key);
            if (!stored)
                throw new common_1.UnauthorizedException('OTP_INVALID');
            const expected = (0, shared_1.hmacSha256Hex)(code + challengeId, this.pepper);
            if (!(0, shared_1.constantTimeEqual)(stored, expected))
                throw new common_1.UnauthorizedException('OTP_INVALID');
            await this.redis.del(key); // single use
            const proofToken = (0, shared_1.randomHex)(24);
            await this.redis.set(this.redis.key('otp', 'proof', proofToken), JSON.stringify({ purpose, channel, destination, verifiedAt: Date.now() }), 300);
            return { verified: true, proofToken };
        }
        async resendOtp(challengeId) {
            const cooldownKey = this.redis.key('otp', 'resend', challengeId);
            const last = await this.redis.get(cooldownKey);
            if (last) {
                const now = Date.now();
                if (now - Number(last) < shared_2.OTP.resendCooldownSeconds * 1000) {
                    throw new common_1.ConflictException('OTP_RATE_LIMITED');
                }
            }
            await this.redis.set(cooldownKey, Date.now().toString(), shared_2.OTP.smsTtlSeconds);
            return { ok: true };
        }
        /* ============ Sessions / JWT ============ */
        async issueSession(identityId) {
            const accessToken = this.jwt.sign({ sub: identityId, typ: 'access' }, {
                expiresIn: `${shared_2.SESSION.accessTokenTtlSeconds}s`,
            });
            const refreshToken = (0, shared_1.randomHex)(32);
            const refreshHash = (0, shared_1.sha256Hex)(refreshToken);
            await this.redis.set(this.redis.key('session', 'refresh', identityId), refreshHash, shared_2.SESSION.refreshMaxAgeDays * 86400);
            return { accessToken, refreshToken, expiresIn: shared_2.SESSION.accessTokenTtlSeconds };
        }
        async verifyRefresh(identityId, refreshToken) {
            const stored = await this.redis.get(this.redis.key('session', 'refresh', identityId));
            if (!stored)
                throw new common_1.UnauthorizedException('SESSION_EXPIRED');
            if (!(0, shared_1.constantTimeEqual)(stored, (0, shared_1.sha256Hex)(refreshToken))) {
                // reuse detection -> revoke family
                await this.redis.del(this.redis.key('session', 'refresh', identityId));
                throw new common_1.UnauthorizedException('REFRESH_REUSE');
            }
            return this.issueSession(identityId);
        }
        async revokeSession(identityId) {
            await this.redis.del(this.redis.key('session', 'refresh', identityId));
        }
    };
    return AuthService = _classThis;
})();
exports.AuthService = AuthService;
