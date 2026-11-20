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
exports.EnrollmentService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@amarid/shared");
const P = process.env.PEPPER_HEX || 'dev';
let EnrollmentService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EnrollmentService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EnrollmentService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        nid;
        sim;
        live;
        finger;
        constructor(prisma, nid, sim, live, finger) {
            this.prisma = prisma;
            this.nid = nid;
            this.sim = sim;
            this.live = live;
            this.finger = finger;
        }
        async start(p) {
            const docH = (0, shared_1.docHmac)(p.docNumber, P);
            const ex = await this.prisma.identity.findUnique({ where: { docHmac: docH } });
            if (ex)
                throw new common_1.ConflictException('ENROLLMENT_DUPLICATE');
            const e = await this.prisma.enrollment.create({ data: { state: 'STARTED', clientFingerprintHash: p.cfp, expiresAt: new Date(Date.now() + 86400000) } });
            return { enrollmentId: e.id, state: e.state, expiresAt: e.expiresAt };
        }
        async document(enrollmentId, input) {
            const e = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
            if (!e)
                throw new common_1.NotFoundException('Enrollment not found');
            if (e.state !== 'STARTED')
                throw new common_1.BadRequestException('INVALID_STATE');
            const r = await this.nid.verify({ docType: input.docType, number: input.number, image: input.image });
            if (!r.verified) {
                await this.prisma.enrollment.update({ where: { id: enrollmentId }, data: { state: 'REJECTED_DOC' } });
                throw new common_1.BadRequestException('DOC_FAILED');
            }
            await this.prisma.enrollment.update({ where: { id: enrollmentId }, data: { state: 'DOC_VERIFIED', docVerifiedAt: new Date() } });
            return { verified: true, docHmac: (0, shared_1.docHmac)(input.number, P) };
        }
        async simOtpRequest(enrollmentId, msisdn) {
            const e = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
            if (!e)
                throw new common_1.NotFoundException('Enrollment not found');
            return { challengeId: `sim-${enrollmentId}`, expiresAt: new Date(Date.now() + 300000) };
        }
        async simOtpVerify(p) {
            const e = await this.prisma.enrollment.findUnique({ where: { id: p.enrollmentId } });
            if (!e)
                throw new common_1.NotFoundException('Enrollment not found');
            if (e.state !== 'DOC_VERIFIED')
                throw new common_1.BadRequestException('INVALID_STATE');
            const sr = await this.sim.ownerMatches(p.msisdn, p.enrollmentId);
            if (!sr.ownerMatches) {
                await this.prisma.enrollment.update({ where: { id: p.enrollmentId }, data: { state: 'REJECTED_DOC' } });
                throw new common_1.BadRequestException('SIM_MISMATCH');
            }
            await this.prisma.enrollment.update({ where: { id: p.enrollmentId }, data: { state: 'SIM_VERIFIED', simVerifiedAt: new Date() } });
            return { verified: true, msisdnHmac: (0, shared_1.msisdnHmac)(p.msisdn, P) };
        }
        async livenessSession(enrollmentId) {
            const e = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
            if (!e)
                throw new common_1.NotFoundException('Enrollment not found');
            if (e.state !== 'SIM_VERIFIED' && e.state !== 'EMAIL_VERIFIED')
                throw new common_1.BadRequestException('INVALID_STATE');
            return { sessionId: `live-${(0, shared_1.randomHex)(8)}` };
        }
        async livenessResult(p) {
            const e = await this.prisma.enrollment.findUnique({ where: { id: p.enrollmentId } });
            if (!e)
                throw new common_1.NotFoundException('Enrollment not found');
            if (!p.passed) {
                await this.prisma.enrollment.update({ where: { id: p.enrollmentId }, data: { state: 'REJECTED_LIVENESS' } });
                throw new common_1.BadRequestException('LIVENESS_FAILED');
            }
            await this.prisma.enrollment.update({ where: { id: p.enrollmentId }, data: { state: 'LIVENESS_PASSED', livenessPassedAt: new Date() } });
            return { passed: true };
        }
        async fingerprint(enrollmentId, template) {
            const e = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
            if (!e)
                throw new common_1.NotFoundException('Enrollment not found');
            if (e.state !== 'LIVENESS_PASSED')
                throw new common_1.BadRequestException('INVALID_STATE');
            await this.prisma.enrollment.update({ where: { id: enrollmentId }, data: { state: 'FINGERPRINT_CAPTURED', fingerprintCapturedAt: new Date() } });
            return { captured: true };
        }
        async finalize(enrollmentId) {
            const e = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
            if (!e)
                throw new common_1.NotFoundException('Enrollment not found');
            if (e.state !== 'FINGERPRINT_CAPTURED')
                throw new common_1.BadRequestException('INVALID_STATE');
            if (process.env.DEMO_SCENARIO === 'duplicate') {
                await this.prisma.enrollment.update({ where: { id: enrollmentId }, data: { state: 'REJECTED_DUPLICATE' } });
                throw new common_1.ConflictException('DUPLICATE_IDENTITY');
            }
            const a = (0, shared_1.randomHex)(4), b = (0, shared_1.randomHex)(4), c = (0, shared_1.randomHex)(4);
            const uid = `AID-${a}-${b}-${c}`;
            const id = await this.prisma.identity.create({ data: { universalId: uid, docHmac: (0, shared_1.docHmac)('DEMO-NID', P), status: 'ACTIVE', assuranceLevel: 'LOA3', issuedAt: new Date(), nextProofOfLifeDueAt: new Date(Date.now() + 365 * 86400000) } });
            await this.prisma.enrollment.update({ where: { id: enrollmentId }, data: { state: 'ISSUED', identityId: id.id, dedupCheckedAt: new Date() } });
            return { universalId: uid, maskedId: `AID-${a}-••••-${c}`, status: 'ACTIVE', assuranceLevel: 'LOA3' };
        }
    };
    return EnrollmentService = _classThis;
})();
exports.EnrollmentService = EnrollmentService;
