"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Public = void 0;
const common_1 = require("@nestjs/common");
/** Marks an endpoint as publicly accessible (no auth required). */
const Public = () => (0, common_1.SetMetadata)('isPublic', true);
exports.Public = Public;
