import { OidcService } from './oidc.service';
export declare class OidcController {
    private readonly oidc;
    constructor(oidc: OidcService);
    discovery(issuer: string): {
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
    jwks(): any;
    authorize(body: any): Promise<{
        requestId: any;
        client: {
            name: any;
        };
        scopes: string[];
    }>;
    consent(body: {
        requestId: string;
        identityId: string;
        approve: boolean;
        scopes: string[];
    }): Promise<{
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
    token(body: any): Promise<{
        access_token: string;
        id_token: string;
        refresh_token: any;
        token_type: string;
        expires_in: number;
    }>;
    userinfo(body: {
        accessToken: string;
    }): Promise<{
        sub: string | undefined;
        acr: string;
        name_verified: boolean;
        age_over_18: boolean;
        phone_verified: boolean;
        status_active: boolean;
    }>;
}
