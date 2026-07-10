import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, encrypt } from '@/lib/tokens';

export default async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    const isProtectedRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/admin');

    if (isProtectedRoute) {
        const session = request.cookies.get('session')?.value;
        const decodedSession = await decrypt(session);

        if (decodedSession) {
            if (path.startsWith('/admin') && decodedSession.role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
            }

            return NextResponse.next();
        }

        const refreshToken = request.cookies.get('refreshToken')?.value;
        const decodedRefresh = await decrypt(refreshToken);

        if (decodedRefresh && decodedRefresh.userId) {
            const role = decodedRefresh.role ?? 'MEMBER';

            if (path.startsWith('/admin') && role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
            }

            const newSession = await encrypt({ userId: decodedRefresh.userId, role }, '30m');
            const response = NextResponse.next();

            response.cookies.set('session', newSession, {
                expires: new Date(Date.now() + 30 * 60 * 1000),
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',
            });

            return response;
        }

        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.search = '';
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
   
}

export const config = {
   matcher: ['/dashboard/:path*', '/admin/:path*'],
};