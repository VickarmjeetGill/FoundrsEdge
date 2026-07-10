import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { encrypt, decrypt } from './tokens';
import { prisma } from './prisma';


/**
 * Sets secure access (session) and refresh cookies, and stores the refresh token in the database.
 */
export async function setSession(userId: string, impersonatorId?: string) {
    // 1. Retrieve the user's actual role from the database
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });
    const role = user?.role ?? "MEMBER";

    const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 2. Generate both session JWT (30m) and refresh JWT (7d), carrying the role
    const session = await encrypt({ userId, role, impersonatorId }, '30m');
    const refreshToken = await encrypt({ userId, role, impersonatorId }, '7d');

    const cookieStore = await cookies();

    // 3. Set the 15-minute access token cookie
    cookieStore.set('session', session, {
        expires: sessionExpiry,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
    });

    // 4. Set the 7-day refresh token cookie
    cookieStore.set('refreshToken', refreshToken, {
        expires: refreshExpiry,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
    });

    // 5. Persist the refresh token in the Supabase database for extra security verification
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: refreshToken }
    });
}

/**
 * Completely clears all session and refresh cookies from the browser.
 */
export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    cookieStore.delete('refreshToken');
}

/**
 * Destroys session cookies and redirects user to login page.
 */
export async function logout() {
    await deleteSession();
    redirect('/login');
}
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) return null;

    const payload = await decrypt(sessionCookie);

    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: payload.userId as string },
    });

    if (!user || user.status === 'DEACTIVATED') return null;

    return user;
}