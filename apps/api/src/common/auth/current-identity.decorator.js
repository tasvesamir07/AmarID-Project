"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentIdentity = void 0;
const common_1 = require("@nestjs/common");
/** Injects the authenticated identity ID (sub) into the handler. */
exports.CurrentIdentity = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sub;
});
