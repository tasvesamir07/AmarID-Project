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
exports.EnrollmentController = void 0;
const common_1 = require("@nestjs/common");
let EnrollmentController = (() => {
    let _classDecorators = [(0, common_1.Controller)('v1/enrollments')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _start_decorators;
    let _document_decorators;
    let _simOtpRequest_decorators;
    let _simOtpVerify_decorators;
    let _livenessSession_decorators;
    let _livenessResult_decorators;
    let _fingerprint_decorators;
    let _finalize_decorators;
    var EnrollmentController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _start_decorators = [(0, common_1.Post)()];
            _document_decorators = [(0, common_1.Post)(':id/document')];
            _simOtpRequest_decorators = [(0, common_1.Post)(':id/sim/otp/request')];
            _simOtpVerify_decorators = [(0, common_1.Post)(':id/sim/otp/verify')];
            _livenessSession_decorators = [(0, common_1.Post)(':id/liveness/session')];
            _livenessResult_decorators = [(0, common_1.Post)(':id/liveness/result')];
            _fingerprint_decorators = [(0, common_1.Post)(':id/fingerprint')];
            _finalize_decorators = [(0, common_1.Post)(':id/finalize')];
            __esDecorate(this, null, _start_decorators, { kind: "method", name: "start", static: false, private: false, access: { has: obj => "start" in obj, get: obj => obj.start }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _document_decorators, { kind: "method", name: "document", static: false, private: false, access: { has: obj => "document" in obj, get: obj => obj.document }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _simOtpRequest_decorators, { kind: "method", name: "simOtpRequest", static: false, private: false, access: { has: obj => "simOtpRequest" in obj, get: obj => obj.simOtpRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _simOtpVerify_decorators, { kind: "method", name: "simOtpVerify", static: false, private: false, access: { has: obj => "simOtpVerify" in obj, get: obj => obj.simOtpVerify }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _livenessSession_decorators, { kind: "method", name: "livenessSession", static: false, private: false, access: { has: obj => "livenessSession" in obj, get: obj => obj.livenessSession }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _livenessResult_decorators, { kind: "method", name: "livenessResult", static: false, private: false, access: { has: obj => "livenessResult" in obj, get: obj => obj.livenessResult }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _fingerprint_decorators, { kind: "method", name: "fingerprint", static: false, private: false, access: { has: obj => "fingerprint" in obj, get: obj => obj.fingerprint }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _finalize_decorators, { kind: "method", name: "finalize", static: false, private: false, access: { has: obj => "finalize" in obj, get: obj => obj.finalize }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EnrollmentController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        s = __runInitializers(this, _instanceExtraInitializers);
        constructor(s) {
            this.s = s;
        }
        start(body) {
            return this.s.start({ docType: body.docType, docNumber: body.docNumber, msisdn: body.msisdn, email: body.email, cfp: body.clientFingerprintHash });
        }
        async document(id, body) {
            return this.s.document(id, { docType: body.docType, number: body.docNumber, image: body.image });
        }
        async simOtpRequest(id, body) {
            return this.s.simOtpRequest(id, body.msisdn);
        }
        async simOtpVerify(id, body) {
            return this.s.simOtpVerify({ enrollmentId: id, msisdn: body.msisdn, challengeId: body.challengeId, code: body.code });
        }
        async livenessSession(id) {
            return this.s.livenessSession(id);
        }
        async livenessResult(id, body) {
            return this.s.livenessResult({ enrollmentId: id, sessionId: body.sessionId, passed: body.passed });
        }
        async fingerprint(id, body) {
            return this.s.fingerprint(id, body.template);
        }
        async finalize(id) {
            return this.s.finalize(id);
        }
    };
    return EnrollmentController = _classThis;
})();
exports.EnrollmentController = EnrollmentController;
