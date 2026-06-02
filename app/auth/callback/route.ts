import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'
  // Validar redirect para evitar open redirect (ex: //evil.com)
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    // Se der erro na troca do código, enviar a mensagem de erro na URL para depuração
    return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(`Erro na autenticação: ${error.message}`)}`)
  }

  return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent('Código de autenticação não encontrado na URL.')}`)
}
