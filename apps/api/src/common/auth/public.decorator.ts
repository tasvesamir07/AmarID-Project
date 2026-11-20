import { SetMetadata } from '@nestjs/common';

/** Marks an endpoint as publicly accessible (no auth required). */
export const Public = () => SetMetadata('isPublic', true);
