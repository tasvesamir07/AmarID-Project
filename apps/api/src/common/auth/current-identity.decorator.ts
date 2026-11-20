import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Injects the authenticated identity ID (sub) into the handler. */
export const CurrentIdentity = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sub;
  },
);
