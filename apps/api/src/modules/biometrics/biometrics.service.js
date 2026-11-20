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
exports.BiometricsService = void 0;
const common_1 = require("@nestjs/common");
let BiometricsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BiometricsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BiometricsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        finger;
        constructor(prisma, finger) {
            this.prisma = prisma;
            this.finger = finger;
        }
        async enrollTemplate(identityId, modality, protectedBlob, keyVersion = 1) {
            return this.prisma.BioTemplate.create({
                data: { identityId, modality, protectedBlob, keyVersion },
            });
        }
        async getTemplates(identityId) {
            return this.prisma.BioTemplate.findMany({ where: { identityId }, select: { id: true, modality: true, keyVersion: true, createdAt: true } });
        }
        async dedupFace(identityId, probe) {
            // 1:N dedup against protected templates (mock matcher; production runs in isolated enclave)
            const templates = await this.prisma.BioTemplate.findMany({ where: { modality: 'face' }, select: { id: true, identityId: true, protectedBlob: true } });
            let bestScore = 0;
            let bestId = null;
            for (const t of templates) {
                const score = this.compare(probe, t.protectedBlob);
                if (score > bestScore) {
                    bestScore = score;
                    bestId = t.identityId;
                }
            }
            const threshold = Number(process.env.FACE_DEDUP_THRESHOLD ?? 0.85);
            if (bestScore >= threshold && bestId && bestId !== identityId) {
                throw new common_1.ConflictException('DUPLICATE_BIOMETRIC');
            }
            return { duplicate: false, bestScore, ambiguous: Math.abs(bestScore - threshold) < 0.05 };
        }
        compare(a, b) {
            // Mock similarity; production uses secure-sketch / encrypted-domain similarity
            const la = Math.min(a.length, b.length);
            let matches = 0;
            for (let i = 0; i < la; i++)
                if (a[i] === b[i])
                    matches++;
            return matches / la;
        }
    };
    return BiometricsService = _classThis;
})();
exports.BiometricsService = BiometricsService;
