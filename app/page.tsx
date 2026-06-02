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
      
      {/* Logotipos */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: '#fff', padding: '1rem', borderRadius: '16px' }}>
        <img src="/logo-sumarezinho.png" alt="EntreGô Sumarezinho" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
        <img src="/logo-aldeota.png" alt="EntreGô Aldeota" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
        <img src="/logo-recreio.png" alt="EntreGô Recreio" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
      </div>

      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>
        Bolão <span style={{ color: '#2C67EA' }}>EntreGô Sumarezinho, Aldeota e Recreio</span>
      </h1>
      
      <p style={{ fontSize: '1.2rem', marginBottom: '3rem', textAlign: 'center', maxWidth: '600px', opacity: 0.9 }}>
        Participe do nosso bolão exclusivo da Copa do Mundo 2026. Acerte os placares, acumule pontos e ganhe prêmios incríveis!
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%', maxWidth: '300px' }}>
        <Link href="/login" style={{ 
          backgroundColor: '#2C67EA', 
          color: '#FFFFFF', 
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
          color: '#FFFFFF', 
          border: '2px solid #2C67EA', 
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
