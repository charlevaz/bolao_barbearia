import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function RegrasColaborador() {
  const supabase = createClient();
  
  // Apenas logados podem acessar
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Apenas colaboradores podem acessar
  const { data: profile } = await supabase.from('profiles').select('user_group').eq('id', user.id).single();
  if (profile?.user_group !== 'colaborador') {
    redirect('/dashboard');
  }

  // Buscar se o usuário está pago (se ainda quiser exibir algo, opcional, mas vamos manter simples)

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', color: '#fff' }}>
      <Link href="/dashboard" style={{ color: '#60a5fa', marginBottom: '2rem', display: 'inline-block' }}>← Voltar para o Dashboard</Link>
      
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }}>
        Bolão dos Colaboradores
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#10b981', textTransform: 'uppercase', textAlign: 'center' }}>
        Copa do Mundo 2026
      </h2>

      <p style={{ marginBottom: '2rem', fontSize: '1.2rem', textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px' }}>
        Bem-vindo à área de regras exclusivas para a equipe interna (Colaboradores).
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <section style={{ backgroundColor: '#0F1849', border: '1px solid #1e3a8a', padding: '2rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#60a5fa', textAlign: 'center' }}>Sistema de Pontuação</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              Acertou o placar exato do jogo → <strong style={{ color: '#4ade80' }}>+10</strong>
            </li>
            <li style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              Acertou apenas o vencedor da partida → <strong style={{ color: '#4ade80' }}>+3</strong>
            </li>
            <li style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              Acertou que o jogo terminaria empatado → <strong style={{ color: '#4ade80' }}>+3</strong>
            </li>
            <li>
              Acertou apenas a quantidade de gols de uma das equipes → <strong style={{ color: '#4ade80' }}>+1</strong>
            </li>
          </ul>
        </section>

        <section style={{ backgroundColor: '#f0fdf4', border: '1px solid #16a34a', padding: '2rem', borderRadius: '16px', color: '#333' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#16a34a', textAlign: 'center' }}>💰 Premiação Oficial</h2>
          
          <ul style={{ listStyle: 'none', padding: 0, fontWeight: 'bold' }}>
            <li style={{ marginBottom: '0.8rem', color: '#d97706', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>🥇 1º Lugar</span> <span>R$ 500,00</span>
            </li>
            <li style={{ marginBottom: '0.8rem', color: '#64748b', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>🥈 2º Lugar</span> <span>R$ 300,00</span>
            </li>
            <li style={{ marginBottom: '0.8rem', color: '#b45309', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>🥉 3º Lugar</span> <span>R$ 100,00</span>
            </li>
            <li style={{ marginBottom: '0.8rem', color: '#16a34a', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>🏅 4º Lugar</span> <span>R$ 50,00</span>
            </li>
            <li style={{ marginBottom: '0.8rem', color: '#16a34a', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>🏅 5º Lugar</span> <span>R$ 10,00</span>
            </li>
            <li style={{ marginBottom: '1.5rem', color: '#16a34a', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>🏅 6º Lugar</span> <span>R$ 1,00</span>
            </li>
          </ul>
        </section>
      </div>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#60a5fa' }}>Regras Gerais (Colaboradores)</h2>
        <ul style={{ listStylePosition: 'inside', opacity: 0.9, paddingLeft: '1rem', lineHeight: '1.8' }}>
          <li>Apenas colaboradores ativos das 3 franquias (Sumarezinho, Aldeota e Recreio) poderão participar. Não é mais necessário pagar nenhuma taxa para participar;</li>
          <li>Será permitido apenas 1 palpite por jogo por E-mail;</li>
          <li>Os palpites devem ser enviados antes do início da partida;</li>
          <li>Não será permitido alterar palpites após o fechamento.</li>
          <li>A premiação será distribuída de forma fixa para os 6 primeiros colocados no ranking final.</li>
        </ul>
      </section>

    </div>
  );
}
