import Link from 'next/link';

export default function Regras() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', color: '#fff' }}>
      <Link href="/" style={{ color: '#60a5fa', marginBottom: '2rem', display: 'inline-block' }}>← Voltar para a Home</Link>
      
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }}>
        Bolão EntreGô Sumarezinho, Aldeota e Recreio
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#60a5fa', textTransform: 'uppercase', textAlign: 'center' }}>
        Copa do Mundo 2026
      </h2>

      <p style={{ marginBottom: '2rem', fontSize: '1.2rem', textAlign: 'center' }}>
        Os <strong>50 ENTREGADORES</strong> com mais pontos ao final da Copa ganham <strong>PRÊMIOS EXCLUSIVOS</strong>
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

        <section style={{ backgroundColor: '#0F1849', border: '1px solid #1e3a8a', padding: '2rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#60a5fa', textAlign: 'center' }}>Prêmios</h2>
          <ul style={{ listStyle: 'none', padding: 0, fontWeight: 'bold' }}>
            <li style={{ marginBottom: '0.5rem', color: '#4ade80' }}>1º R$ 1.000,00</li>
            <li style={{ marginBottom: '0.5rem', color: '#4ade80' }}>2º R$ 500,00</li>
            <li style={{ marginBottom: '0.5rem', color: '#4ade80' }}>3º R$ 300,00</li>
            <li style={{ marginBottom: '0.5rem', color: '#60a5fa' }}>4º ao 10º Jaqueta Reforçada</li>
            <li style={{ marginBottom: '0.5rem', color: '#60a5fa' }}>11º ao 20º Jaqueta Corta Vento</li>
            <li style={{ marginBottom: '0.5rem', color: '#60a5fa' }}>21º ao 30º Capa de Chuva Oficial</li>
            <li style={{ marginBottom: '0.5rem', color: '#60a5fa' }}>31º ao 40º Camiseta</li>
            <li style={{ color: '#60a5fa' }}>41º ao 50º Bag</li>
          </ul>
        </section>
      </div>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#60a5fa' }}>Regras Gerais</h2>
        <ul style={{ listStylePosition: 'inside', opacity: 0.9, paddingLeft: '1rem', lineHeight: '1.8' }}>
          <li>Para ser elegível ao prêmio, o entregador precisa ter feito pelo menos 10 rotas completas por semana durante a promoção. Para entregadores novos, a contagem inicia a partir da segunda semana que o cadastro foi ativado. No período de apuração final da Copa, é obrigatório estar ativo em uma das 3 franquias (Sumarezinho, Aldeota ou Recreio);</li>
          <li>Será permitido apenas 1 palpite por jogo por CPF;</li>
          <li>Os palpites devem ser enviados antes do início da partida;</li>
          <li>Não será permitido alterar palpites após o fechamento.</li>
          <li>Válido durante a copa (11 de Junho a 19 de Julho).</li>
        </ul>
        <p style={{ marginTop: '1.5rem', opacity: 0.9 }}>
          Ao final da Copa, os 50 entregadores com maior pontuação no ranking geral serão premiados.
        </p>
      </section>

    </div>
  );
}
