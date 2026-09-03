import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const CANONICAL_HOST = "navride-web.vercel.app";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host === "web-navride.vercel.app") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const embed = request.nextUrl.searchParams.get('embed')

  // ── Rutas privadas generales (requieren sesión) ──────────────────────────────
  // embed=navride-app: editor presentation layer inside Flutter WebView — no web login.
  const privatePaths = ['/mi-garaje', '/editor-gpx', '/perfil']
  const isPrivate = privatePaths.some((p) => pathname.startsWith(p))
  const isAppEmbedEditor =
    pathname.startsWith('/editor-gpx') && embed === 'navride-app'
  if (isPrivate && !user && !isAppEmbedEditor) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Panel policial: proteger todo excepto /panel-policial/login ──────────────
  const isPolicePanelProtected =
    pathname.startsWith('/panel-policial') &&
    !pathname.startsWith('/panel-policial/login')

  if (isPolicePanelProtected) {
    if (!user) {
      return NextResponse.redirect(new URL('/panel-policial/login', request.url))
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as string | undefined
    if (role !== 'police' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
