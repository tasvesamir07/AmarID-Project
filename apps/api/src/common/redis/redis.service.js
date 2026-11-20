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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Redis service for OTP challenges, rate limiting, sessions, and challenges.
 * All keys namespaced with `amarid:` prefix.
 */
let RedisService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RedisService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RedisService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        config;
        logger = new common_1.Logger(RedisService.name);
        client;
        constructor(config) {
            this.config = config;
        }
        onModuleInit() {
            this.client = new ioredis_1.default({
                host: this.config.get('REDIS_HOST', 'localhost'),
                port: this.config.get('REDIS_PORT', 6379),
                lazyConnect: true,
                maxRetriesPerRequest: 3,
            });
            this.client.connect().then(() => this.logger.log('Connected to Redis'));
            this.client.on('error', (err) => this.logger.error('Redis error', err.message));
        }
        onModuleDestroy() {
            return this.client?.quit();
        }
        get clientOrThrow() {
            if (!this.client)
                throw new Error('Redis not initialized');
            return this.client;
        }
        key(...parts) {
            return `amarid:${parts.join(':')}`;
        }
        async get(key) {
            return this.clientOrThrow.get(key);
        }
        async set(key, value, ttlSeconds) {
            if (ttlSeconds) {
                await this.clientOrThrow.setex(key, ttlSeconds, value);
            }
            else {
                await this.clientOrThrow.set(key, value);
            }
        }
        async del(key) {
            await this.clientOrThrow.del(key);
        }
        async incr(key, ttlSeconds) {
            const multi = this.clientOrThrow.multi();
            multi.incr(key);
            if (ttlSeconds)
                multi.expire(key, ttlSeconds);
            const execResult = await multi.exec();
            const results = execResult ?? [];
            return results[0]?.[1] ?? 0;
        }
        // Atomic get-and-delete (OTP single-use, Lua-safe via GETDEL)
        async getdel(key) {
            return this.clientOrThrow.getdel(key);
        }
    };
    return RedisService = _classThis;
})();
exports.RedisService = RedisService;
