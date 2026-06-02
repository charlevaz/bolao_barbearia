import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { searchParams, pathname } = request.nextUrl

    // Se a URL contém ?code= e está na raiz (/), redireciona para /reset-password
    if (searchParams.has('code') && pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/reset-password'
      return NextResponse.redirect(url)
    }

    // Criar response mutável para atualizar cookies de sessão
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Segurança: se as variáveis do Supabase não estiverem definidas, apenas continua sem quebrar
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Middleware: Supabase environment variables are missing!');
      return response;
    }

    // Criar cliente Supabase no middleware para refresh de sessão
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Refresh da sessão (IMPORTANTE: mantém o token atualizado)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Middleware Auth Error:', authError);
    }

    // Rotas protegidas: redireciona para login se não autenticado
    const protectedRoutes = ['/dashboard', '/admin']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('message', 'Faça login para acessar essa página.')
      return NextResponse.redirect(url)
    }

    // Rota admin: verificação extra de role
    if (pathname.startsWith('/admin') && user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Middleware Profile Error:', profileError);
      }

      if (!profile || profile.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    return response
  } catch (e) {
    console.error('CRITICAL MIDDLEWARE ERROR:', e);
    // Para não travar a página, apenas continua
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Rodar middleware em todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
