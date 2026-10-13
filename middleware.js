import {NextResponse} from 'next/server';
export function middleware(request){const r=NextResponse.next();r.headers.set('X-Content-Type-Options','nosniff');r.headers.set('X-Frame-Options','SAMEORIGIN');r.headers.set('Referrer-Policy','strict-origin-when-cross-origin');r.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');return r}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
