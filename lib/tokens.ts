import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

/**
 * Encrypts a payload into a JWT.
 * @param payload - Data to store in the token
 * @param expiry - String duration (e.g., '30m', '7d')
 */
export async function encrypt(payload: any, expiry: string = '30m') {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiry)
        .sign(key);
}

/**
 * Decrypts and verifies a JWT.
 */
export async function decrypt(token: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}
