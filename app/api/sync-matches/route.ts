import { NextResponse } from 'next/server';

const flagMap: Record<string, string> = {
  'Brazil': 'br', 'Argentina': 'ar', 'Mexico': 'mx', 'USA': 'us', 'Canada': 'ca',
  'France': 'fr', 'England': 'gb-eng', 'Spain': 'es', 'Germany': 'de', 'Portugal': 'pt',
  'Italy': 'it', 'Netherlands': 'nl', 'Uruguay': 'uy', 'Colombia': 'co', 'Senegal': 'sn',
  'Morocco': 'ma', 'Japan': 'jp', 'South Korea': 'kr', 'Australia': 'au', 'Croatia': 'hr',
  'Belgium': 'be', 'Switzerland': 'ch'
};

export async function GET() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Falha ao buscar dados do GitHub' }, { status: 400 });
    }

    const data = await response.json();
    
    if (!data.matches || data.matches.length === 0) {
      return NextResponse.json({ error: 'Nenhum jogo encontrado no JSON.' }, { status: 404 });
    }

    // Mapear os 104 jogos para o formato do nosso banco de dados
    const matches = data.matches.map((item: any) => {
      // Parse timezone from "HH:MM UTC-X"
      const timeParts = item.time.split(' UTC');
      let timeString = timeParts[0];
      let offsetString = '-06:00'; // Fallback
      if (timeParts.length > 1) {
        const offset = timeParts[1]; // e.g. "-4", "-7"
        const sign = offset.startsWith('-') ? '-' : '+';
        const hours = offset.replace(/[+-]/, '').padStart(2, '0');
        offsetString = `${sign}${hours}:00`;
      }
      
      return {
        team_a: item.team1,
        team_b: item.team2,
        flag_a: flagMap[item.team1] || 'un',
        flag_b: flagMap[item.team2] || 'un',
        match_date: new Date(`${item.date}T${timeString}:00${offsetString}`).toISOString(),
        // item.group é usado na fase de grupos ("Group A"), item.round nas eliminatórias
        group_name: item.group || item.round || 'A Definir',
        venue: item.ground || 'A Definir',
        status: 'pending'
      };
    });

    return NextResponse.json({ matches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
