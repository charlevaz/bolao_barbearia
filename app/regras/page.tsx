import Link from 'next/link';

export default function Regras() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', color: '#fff' }}>
      <Link href="/" style={{ color: 'var(--color-primary-light)', marginBottom: '2rem', display: 'inline-block' }}>← Voltar para a Home</Link>
      
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }}>
        Bolão Barbearia Capitão
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--color-primary-light)', textTransform: 'uppercase', textAlign: 'center' }}>
        Prêmios Exclusivos
      </h2>

      <p style={{ marginBottom: '2rem', fontSize: '1.2rem', textAlign: 'center' }}>
        Os <strong>CLIENTES</strong> com mais pontos ganham <strong>PRÊMIOS INCRÍVEIS</strong>
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <section style={{ backgroundColor: 'var(--color-primary-dark)', border: '1px solid var(--color-primary-light)', padding: '2rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-primary-light)', textAlign: 'center' }}>Sistema de Pontuação</h2>
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

        <section style={{ backgroundColor: 'var(--color-primary-dark)', border: '1px solid var(--color-primary-light)', padding: '2rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-primary-light)', textAlign: 'center' }}>Prêmios</h2>
          <ul style={{ listStyle: 'none', padding: 0, fontWeight: 'bold' }}>
            <li style={{ marginBottom: '0.5rem', color: '#4ade80' }}>1º R$ 300,00</li>
            <li style={{ marginBottom: '0.5rem', color: '#4ade80' }}>2º R$ 200,00</li>
            <li style={{ marginBottom: '0.5rem', color: '#4ade80' }}>3º R$ 100,00</li>
            <li style={{ marginBottom: '0.5rem', color: 'var(--color-primary-light)' }}>4º Serviço de Corte</li>
          </ul>
        </section>
      </div>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary-light)' }}>Regras Gerais</h2>
        <ul style={{ listStylePosition: 'inside', opacity: 0.9, paddingLeft: '1rem', lineHeight: '1.8' }}>
          <li>Para ser elegível ao prêmio, o cliente precisa ter realizado pelo menos 1 serviço na barbearia e ter o e-mail previamente liberado.</li>
          <li>Será permitido apenas 1 palpite por jogo por CPF;</li>
          <li>Os palpites devem ser enviados antes do início da partida;</li>
          <li>Não será permitido alterar palpites após o fechamento.</li>
        </ul>
        <p style={{ marginTop: '1.5rem', opacity: 0.9 }}>
          Ao final do torneio, os 4 clientes com maior pontuação no ranking geral serão premiados!
        </p>
      </section>

    </div>
  );
}
