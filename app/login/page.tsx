"use client";

import { createClient } from '@/utils/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const supabase = createClient();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Interceptar e traduzir erros do Supabase Auth no cliente
  const originalSignUp = supabase.auth.signUp.bind(supabase.auth);
  supabase.auth.signUp = async (credentials) => {
    const res = await originalSignUp(credentials);
    if (res.error) {
      const translateAuthError = (message: string): string => {
        const msg = message.toLowerCase();
        if (msg.includes('database error saving new user') || msg.includes('database error')) {
          return 'E-mail não autorizado pela Gestão.';
        }
        if (msg.includes('invalid login credentials')) {
          return 'E-mail ou senha incorretos.';
        }
        if (msg.includes('user already registered')) {
          return 'Este e-mail já está cadastrado.';
        }
        if (msg.includes('email not confirmed')) {
          return 'Por favor, confirme seu e-mail.';
        }
        if (msg.includes('password should be at least 6 characters')) {
          return 'A senha deve ter pelo menos 6 caracteres.';
        }
        if (msg.includes('signup requires a valid email')) {
          return 'Por favor, insira um e-mail válido.';
        }
        return message;
      };
      (res.error as any).message = translateAuthError(res.error.message);
    }
    return res;
  };

  const originalSignIn = supabase.auth.signInWithPassword.bind(supabase.auth);
  supabase.auth.signInWithPassword = async (credentials) => {
    const res = await originalSignIn(credentials);
    if (res.error) {
      const translateAuthError = (message: string): string => {
        const msg = message.toLowerCase();
        if (msg.includes('invalid login credentials')) {
          return 'E-mail ou senha incorretos.';
        }
        if (msg.includes('email not confirmed')) {
          return 'Por favor, confirme seu e-mail.';
        }
        return message;
      };
      (res.error as any).message = translateAuthError(res.error.message);
    }
    return res;
  };

  useEffect(() => {
    // Escutar mudanças de autenticação (quando o usuário loga com sucesso)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/');
      }
    });

    // Checar se já está logado inicialmente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/');
      } else {
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  if (checking) return <div style={{ padding: '4rem', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <Link href="/" style={{ color: 'var(--color-primary-light)', marginBottom: '2rem' }}>← Voltar para Home</Link>

      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', color: '#333', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center', color: 'var(--color-primary-dark)' }}>
          Identificação VIP
        </h1>
        <p style={{ textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem', color: '#666' }}>
          Seu e-mail deve estar autorizado pela gestão para você conseguir criar sua conta.
        </p>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'var(--color-primary-light)',
                  brandAccent: '#1a4bb3',
                  messageText: '#ff4444',
                }
              }
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                email_input_placeholder: 'Seu e-mail',
                password_input_placeholder: 'Sua senha',
                link_text: 'Já tem uma conta? Faça Login'
              },
              sign_up: {
                email_label: 'E-mail Corporativo',
                password_label: 'Crie uma Senha Forte',
                button_label: 'Cadastrar',
                loading_button_label: 'Cadastrando...',
                email_input_placeholder: 'Seu e-mail',
                password_input_placeholder: 'Sua senha',
                link_text: 'Não tem uma senha? Crie sua conta'
              },
              forgotten_password: {
                link_text: 'Esqueceu sua senha?',
                button_label: 'Recuperar Senha',
                password_label: 'Sua Senha',
                email_label: 'E-mail'
              }
            }
          }}
          theme="light"
          providers={[]} // Desabilitar logins de terceiros (Google/Facebook)
          redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined}
        />

      </div>
    </div>
  );
}
