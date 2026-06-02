import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      
      {/* Logotipo */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '2rem', 
        justifyContent: 'center'
      }}>
        <img src="/logo-capitao.png" alt="Barbearia Capitão da Chácara" style={{ height: '150px', width: 'auto', objectFit: 'contain' }} />
      </div>

      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>
        Bolão <span style={{ color: 'var(--color-primary-light)' }}>Capitão da Chácara</span>
      </h1>
      
      <p style={{ fontSize: '1.2rem', marginBottom: '3rem', textAlign: 'center', maxWidth: '600px', opacity: 0.9 }}>
        Participe do nosso bolão exclusivo. Acerte os placares dos jogos, acumule pontos e ganhe prêmios incríveis como cortes de cabelo e muito mais! Exclusivo para clientes da Barbearia.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%', maxWidth: '300px' }}>
        <Link href="/login" style={{ 
          backgroundColor: 'var(--color-primary-light)', 
          color: '#0f1c3f', 
          border: 'none', 
          padding: '1rem', 
          borderRadius: '8px', 
          fontSize: '1.1rem', 
          fontWeight: 'bold', 
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
          textDecoration: 'none'
        }}>
          Entrar / Cadastrar
        </Link>
        <Link href="/regras" style={{ 
          backgroundColor: 'transparent', 
          color: 'var(--color-primary-light)', 
          border: '2px solid var(--color-primary-light)', 
          padding: '1rem', 
          borderRadius: '8px', 
          fontSize: '1.1rem', 
          fontWeight: 'bold', 
          cursor: 'pointer',
          textAlign: 'center',
          textDecoration: 'none'
        }}>
          Ver Regras e Prêmios
        </Link>
      </div>

      <div style={{ marginTop: '4rem' }}>
        <Link href="/admin" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', textDecoration: 'none' }}>Acesso Restrito</Link>
      </div>

    </div>
  );
}
