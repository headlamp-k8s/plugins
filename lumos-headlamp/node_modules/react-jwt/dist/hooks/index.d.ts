/**
 * This function will help you to decode a JWT and know if it's expired or not
 * @param userJwt - Your JWT
 * @returns An object containing the properties isExpired, decodedToken and reEvaluateToken
 */
export declare function useJwt<T>(userJwt: string): IUseJwt<T>;
export declare function useJwt(userJwt: string): IUseJwt;
interface IUseJwt<T = Object> {
    isExpired: boolean;
    decodedToken: T | null;
    reEvaluateToken: (token: string) => void;
}
export {};
