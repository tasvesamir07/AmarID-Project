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
exports.AdaptersModule = exports.DECEASED_REGISTRY = exports.MAILER = exports.SMS_GATEWAY = exports.FINGERPRINT_MATCHER = exports.LIVENESS_PROVIDER = exports.SIM_REGISTRY = exports.NID_PROVIDER = void 0;
const common_1 = require("@nestjs/common");
exports.NID_PROVIDER = Symbol('NID_PROVIDER');
exports.SIM_REGISTRY = Symbol('SIM_REGISTRY');
exports.LIVENESS_PROVIDER = Symbol('LIVENESS_PROVIDER');
exports.FINGERPRINT_MATCHER = Symbol('FINGERPRINT_MATCHER');
exports.SMS_GATEWAY = Symbol('SMS_GATEWAY');
exports.MAILER = Symbol('MAILER');
exports.DECEASED_REGISTRY = Symbol('DECEASED_REGISTRY');
/* ---------- Mock NID Provider ---------- */
let MockNidProvider = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MockNidProvider = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MockNidProvider = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async verify(input) {
            // DEMO_SCENARIO can force mismatch/timeout/duplicate via env
            const scenario = process.env.DEMO_SCENARIO || 'success';
            if (scenario === 'timeout')
                throw new Error('NID provider timeout');
            if (scenario === 'mismatch') {
                return { verified: false, name: null, dob: null, docType: input.docType, matchScore: 0.1, reason: 'Name/DOB mismatch' };
            }
            // success: accept well-formed NID-like input, never store raw
            const verified = !!input.number && input.number.length >= 5;
            return {
                verified,
                name: verified ? 'Demo Citizen' : null,
                dob: verified ? '1990-01-01' : null,
                docType: input.docType,
                matchScore: verified ? 0.98 : null,
                reason: null,
            };
        }
    };
    return MockNidProvider = _classThis;
})();
/* ---------- Mock SIM Registry ---------- */
let MockSimRegistry = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MockSimRegistry = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MockSimRegistry = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async ownerMatches(msisdn, docRef) {
            const scenario = process.env.DEMO_SCENARIO || 'success';
            if (scenario === 'timeout')
                throw new Error('SIM registry timeout');
            if (scenario === 'mismatch') {
                return { ownerMatches: false, operator: 'Grameenphone', reason: 'SIM not registered to document holder' };
            }
            return { ownerMatches: true, operator: 'Grameenphone', reason: null };
        }
    };
    return MockSimRegistry = _classThis;
})();
/* ---------- Mock Liveness Provider ---------- */
let MockLivenessProvider = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MockLivenessProvider = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MockLivenessProvider = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async verify(sessionId, _frame) {
            const scenario = process.env.DEMO_SCENARIO || 'success';
            if (scenario === 'timeout')
                throw new Error('Liveness provider timeout');
            if (scenario === 'mismatch') {
                return { passed: false, score: 0.3, presentationAttackDetected: true, reason: 'Presentation attack detected' };
            }
            return { passed: true, score: 0.94, presentationAttackDetected: false, reason: null };
        }
    };
    return MockLivenessProvider = _classThis;
})();
/* ---------- Mock Fingerprint Matcher ---------- */
let MockFingerprintMatcher = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MockFingerprintMatcher = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MockFingerprintMatcher = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async extract(raw) {
            // In mock, produce a deterministic protected-ish template from raw (never store raw)
            const { createHash } = require('crypto');
            const template = createHash('sha256').update(raw).digest();
            return { template };
        }
        async match(probe, enrolled) {
            const scenario = process.env.DEMO_SCENARIO || 'success';
            if (scenario === 'mismatch') {
                return { matched: false, score: 0.2, templateId: null, reason: 'Fingerprint mismatch' };
            }
            return { matched: true, score: 0.91, templateId: null, reason: null };
        }
    };
    return MockFingerprintMatcher = _classThis;
})();
/* ---------- Console SMS Gateway (dev) ---------- */
let ConsoleSmsGateway = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ConsoleSmsGateway = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ConsoleSmsGateway = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async send(to, text) {
            // eslint-disable-next-line no-console
            console.log(`[SMS MOCK] to=${to} body=${text}`);
            return { messageId: `mock-sms-${Date.now()}` };
        }
    };
    return ConsoleSmsGateway = _classThis;
})();
/* ---------- Dev Mailer (logs to console; Mailpit in docker) ---------- */
let DevMailer = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DevMailer = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DevMailer = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async send(message) {
            // eslint-disable-next-line no-console
            console.log(`[EMAIL MOCK] to=${message.to} subject=${message.subject}`);
        }
    };
    return DevMailer = _classThis;
})();
/* ---------- Mock Deceased Registry ---------- */
let MockDeceasedRegistry = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MockDeceasedRegistry = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MockDeceasedRegistry = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async check(_docRef) {
            return { deceased: false, source: null };
        }
    };
    return MockDeceasedRegistry = _classThis;
})();
let AdaptersModule = (() => {
    let _classDecorators = [(0, common_1.Global)(), (0, common_1.Module)({
            providers: [
                { provide: exports.NID_PROVIDER, useClass: MockNidProvider },
                { provide: exports.SIM_REGISTRY, useClass: MockSimRegistry },
                { provide: exports.LIVENESS_PROVIDER, useClass: MockLivenessProvider },
                { provide: exports.FINGERPRINT_MATCHER, useClass: MockFingerprintMatcher },
                { provide: exports.SMS_GATEWAY, useClass: ConsoleSmsGateway },
                { provide: exports.MAILER, useClass: DevMailer },
                { provide: exports.DECEASED_REGISTRY, useClass: MockDeceasedRegistry },
            ],
            exports: [exports.NID_PROVIDER, exports.SIM_REGISTRY, exports.LIVENESS_PROVIDER, exports.FINGERPRINT_MATCHER, exports.SMS_GATEWAY, exports.MAILER, exports.DECEASED_REGISTRY],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AdaptersModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AdaptersModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return AdaptersModule = _classThis;
})();
exports.AdaptersModule = AdaptersModule;
