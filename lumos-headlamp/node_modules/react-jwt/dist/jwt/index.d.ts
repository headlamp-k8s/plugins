/**
 * Try to decode a JWT. If the token is valid you'll get an object otherwise you'll get null
 * @param token - The JWT that you want to decode
 * @returns Decoded token
 */
export declare function decodeToken<T>(token: string): T | null;
export declare function decodeToken(token: string): Object | null;
/**
 * Verify if the token is expired or not
 * @param token - Your JWT
 * @returns boolean
 */
export declare function isTokenExpired(token: string): boolean;
