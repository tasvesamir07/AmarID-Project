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
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@amarid/shared");
const shared_2 = require("@amarid/shared");
let HttpExceptionFilter = (() => {
    let _classDecorators = [(0, common_1.Catch)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var HttpExceptionFilter = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HttpExceptionFilter = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new common_1.Logger(HttpExceptionFilter.name);
        catch(exception, host) {
            const ctx = host.switchToHttp();
            const response = ctx.getResponse();
            const request = ctx.getRequest();
            const traceId = request.traceId || 'unknown';
            let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            let code = 'INTERNAL_ERROR';
            let message = 'Internal server error';
            let isPublic = false;
            if (exception instanceof common_1.HttpException) {
                status = exception.getStatus();
                const res = exception.getResponse();
                code = res?.code || 'HTTP_ERROR';
                message = res?.message || exception.message;
                isPublic = status < 500;
            }
            else if (exception instanceof shared_1.AmaridError) {
                status = exception.statusCode;
                code = exception.code;
                message = exception.message;
                isPublic = exception.isPublic;
            }
            // Log internal errors fully; public errors lightly
            if (status >= 500) {
                this.logger.error(`${request.method} ${request.url} - ${status} ${code}`, exception.stack);
            }
            else {
                this.logger.warn(`${request.method} ${request.url} - ${status} ${code} - ${message}`);
            }
            const baseUrl = process.env.API_URL || 'http://localhost:4000';
            const envelope = (0, shared_2.toErrorEnvelope)({ message, name: code, traceId }, baseUrl);
            // Override with our structured values
            envelope.code = code;
            envelope.traceId = traceId;
            envelope.detail = isPublic ? message : undefined;
            envelope.title = status >= 500 ? 'Server Error' : message;
            response.status(status).json({
                ...envelope,
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
            });
        }
    };
    return HttpExceptionFilter = _classThis;
})();
exports.HttpExceptionFilter = HttpExceptionFilter;
