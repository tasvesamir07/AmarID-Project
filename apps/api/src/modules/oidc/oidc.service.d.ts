import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
export declare class OidcService {
    private prisma;
    private redis;
    private readonly logger;
    private signingKey;
    private jwks;
    constructor(prisma: PrismaService, redis: RedisService);
    private initKeys;
    getJwks(): any;
    getDiscovery(issuer: string): {
        issuer: string;
        authorization_endpoint: string;
        token_endpoint: string;
        userinfo_endpoint: string;
        jwks_uri: string;
        scopes_supported: string[];
        response_types_supported: string[];
        subject_types_supported: string[];
        id_token_signing_alg_values_supported: string[];
        code_challenge_methods_supported: string[];
    };
    authorize(p: {
        client_id: string;
        redirect_uri: string;
        scope: string;
        state: string;
        nonce: string;
        code_challenge: string;
        identityId: string;
    }): Promise<{
        requestId: any;
        client: {
            name: any;
        };
        scopes: string[];
    }>;
    consent(requestId: string, identityId: string, approve: boolean, scopes: string[]): Promise<{
        approved: boolean;
        code?: undefined;
        redirect_uri?: undefined;
        state?: undefined;
    } | {
        approved: boolean;
        code: any;
        redirect_uri: any;
        state: any;
    }>;
    token(p: {
        grant_type: string;
        code?: string;
        code_verifier?: string;
        redirect_uri?: string;
        client_id: string;
        refresh_token?: string;
    }): Promise<{
        access_token: string;
        id_token: string;
        refresh_token: any;
        token_type: string;
        expires_in: number;
    }>;
    private issueTokens;
    userinfo(accessToken: string): Promise<{
        sub: string | undefined;
        acr: string;
        name_verified: boolean;
        age_over_18: boolean;
        phone_verified: boolean;
        status_active: boolean;
    }>;
}
