"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

const TABS = ['ranking', 'usuarios', 'emails', 'dicionario', 'jogos', 'fases'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  ranking:    '🏆 Ranking',
  usuarios:   '👑 Usuários',
  emails:     '📧 Participantes',
  dicionario: '🌍 Dicionário',
  jogos:      '⚽ Jogos',
  fases:      '🔓 Fases',
};

const PHASES = [
  { key: 'group', label: 'Fase de Grupos' },
  { key: 'round_of_32', label: 'Oitavas de Final' },
  { key: 'round_of_16', label: 'Quartas de Final' },
  { key: 'quarter', label: 'Semifinais' },
  { key: 'semi', label: 'Final e 3º Lugar' },
  { key: 'final', label: 'Grande Final' },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('ranking');

  // Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  // Emails
  const [emailToAdd, setEmailToAdd] = useState('');
  const [cpfToAdd, setCpfToAdd] = useState('');
  const [emailGroup, setEmailGroup] = useState('cliente');
  const [emailMessage, setEmailMessage] = useState('');
  const [allowedEmails, setAllowedEmails] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvMessage, setCsvMessage] = useState('');
  const [csvConflicts, setCsvConflicts] = useState<any[]>([]);
  const [csvToInsert, setCsvToInsert] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailSearch, setEmailSearch] = useState('');
  const [emailFilter, setEmailFilter] = useState('todos');

  // Users (profiles)
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profileSearch, setProfileSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState('todos');

  // Dictionary
  const [translations, setTranslations] = useState<any[]>([]);

  // Ranking
  const [ranking, setRanking] = useState<any[]>([]);
  const [rankingFilter, setRankingFilter] = useState('cliente');

  // Matches
  const [matches, setMatches] = useState<any[]>([]);
  const [scores, setScores] = useState<{[key: string]: {a: string, b: string}}>({});
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [flagA, setFlagA] = useState('un');
  const [flagB, setFlagB] = useState('un');
  const [matchDate, setMatchDate] = useState('');
  const [matchMessage, setMatchMessage] = useState('');

  // Fases
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({});
  const [phaseMessage, setPhaseMessage] = useState('');
  const [phaseTableReady, setPhaseTableReady] = useState(false);

  // Bolão de Colaboradores
  const [poolSettings, setPoolSettings] = useState<any>({
    value_per_person: 10,
    pct_1st: 50, pct_2nd: 30, pct_3rd: 20,
    prize_4th: '', prize_5th: '', prize_6th: '', prize_7th: '',
    prize_8th: '', prize_9th: '', prize_10th: '',
    config_locked: false
  });
  const [poolLoaded, setPoolLoaded] = useState(false);
  const [poolMessage, setPoolMessage] = useState('');
  const [colabEmails, setColabEmails] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function loadAdminData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!profile || profile.role !== 'admin') { window.location.href = '/dashboard'; return; }
      setIsAdmin(true);
      setChecking(false);
      loadAll();
    }
    loadAdminData();
  }, []);

  const loadAll = () => {
    loadEmails();
    loadProfiles();
    loadMatches();
    loadTranslations();
    loadRanking();
    loadPhases();
    loadPoolSettings();
    loadColabEmails();
  };

  // ── Helper Pagination ───────────────────────────────────────────────────────
  const fetchAllRows = async (tableName: string, orderBy: string, ascending: boolean = false) => {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase.from(tableName).select('*').order(orderBy, { ascending }).range(from, from + step - 1);
      if (error || !data || data.length === 0) break;
      allData = [...allData, ...data];
      if (data.length < step) break;
      from += step;
    }
    return allData;
  };

  // ── Emails ────────────────────────────────────────────────────────────────
  const loadEmails = async () => {
    const data = await fetchAllRows('allowed_emails', 'created_at', false);
    setAllowedEmails(data);
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage('Adicionando...');
    const cleanCpf = cpfToAdd.replace(/\D/g, '') || null;
    const { error } = await supabase.from('allowed_emails').insert([{ email: emailToAdd, cpf: cleanCpf, user_group: emailGroup }]);
    if (error) {
      if (error.message.includes('unique constraint')) {
        setEmailMessage('Erro: Este E-mail ou CPF já está cadastrado.');
      } else {
        setEmailMessage(`Erro: ${error.message}`);
      }
    } else { 
      setEmailMessage('E-mail autorizado!'); 
      setEmailToAdd(''); 
      setCpfToAdd(''); 
      loadEmails(); 
    }
  };

  const handleDeleteEmail = async (id: string, email: string) => {
    const isAdminUser = profiles.some(p => p.email === email && p.role === 'admin');
    if (isAdminUser) {
      alert(`⚠️ Não é possível remover o e-mail ${email} porque ele pertence a um Administrador. Remova o acesso de Admin primeiro na aba Usuários.`);
      return;
    }

    if (!window.confirm(`Remover autorização de ${email}?`)) return;
    await supabase.from('allowed_emails').delete().eq('id', id);
    loadEmails();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    // Identificar quais e-mails pertencem a admins para proteger
    const adminEmails = profiles.filter(p => p.role === 'admin').map(p => p.email);
    
    const idsToDelete: string[] = [];
    let skipCount = 0;
    
    for (const id of selectedIds) {
      const item = allowedEmails.find(a => a.id === id);
      if (item && adminEmails.includes(item.email)) {
        skipCount++;
      } else {
        idsToDelete.push(id);
      }
    }

    if (idsToDelete.length === 0) {
      alert('⚠️ Todos os e-mails selecionados pertencem a Administradores e não podem ser removidos.');
      return;
    }

    let confirmMsg = `Tem certeza que deseja remover os ${idsToDelete.length} e-mails selecionados?`;
    if (skipCount > 0) {
      confirmMsg += `\n\n(Nota de segurança: ${skipCount} e-mail(s) de Administrador foram protegidos e NÃO serão apagados).`;
    }

    if (!window.confirm(confirmMsg)) return;
    
    const chunkSize = 20; // Reduzido para 20 para garantir que a URL fique curta
    let hasError = false;
    let successCount = 0;
    
    for (let i = 0; i < idsToDelete.length; i += chunkSize) {
      const chunk = idsToDelete.slice(i, i + chunkSize);
      // Ao deletar por ID evitamos qualquer bug do PostgREST com caracteres especiais no e-mail
      const { data, error } = await supabase.from('allowed_emails').delete().in('id', chunk).select('id');
      if (error) {
        console.error('Erro ao deletar lote:', error);
        hasError = true;
      } else if (data) {
        successCount += data.length;
      }
    }
    
    if (hasError) {
      alert(`Ocorreu um erro ao tentar remover alguns e-mails. ${successCount} foram removidos com sucesso.`);
    } else {
      alert(`✅ ${successCount} e-mails removidos com sucesso!`);
    }
    
    setSelectedIds([]);
    loadEmails();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const filtered = allowedEmails
        .filter(item => emailFilter === 'todos' || item.user_group === emailFilter)
        .filter(item => emailSearch === '' || 
          item.email.toLowerCase().includes(emailSearch.toLowerCase()) ||
          (item.cpf && item.cpf.includes(emailSearch))
        );
      setSelectedIds(filtered.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectId = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleToggleEligibility = async (email: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Atualizar lista
    await supabase.from('allowed_emails').update({ eligible: newStatus }).eq('email', email);
    // Atualizar ranking / perfil do usuario instantaneamente
    await supabase.from('profiles').update({ eligible: newStatus }).eq('email', email);
    
    loadEmails();
    loadProfiles();
  };

  const handleDownloadEmails = () => {
    if (allowedEmails.length === 0) { alert('Nenhum dado para exportar.'); return; }
    const headers = ['E-mail', 'CPF', 'Grupo', 'Elegível', 'Data de Inclusão'];
    const rows = allowedEmails.map(r => [
      `"${r.email}"`,
      `"${r.cpf || ''}"`,
      `"${r.user_group}"`,
      r.eligible === false ? 'Nao' : 'Sim',
      `"${new Date(r.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}"`
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `participantes_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const executeCsvUpsert = async (data: any[]) => {
    if (data.length === 0) return true;
    const { error } = await supabase.from('allowed_emails').upsert(data, { onConflict: 'email' });
    if (error) {
      setCsvMessage(`Erro: ${error.message}`);
      return false;
    } else {
      for (const item of data) {
        const updateData: any = { user_group: item.user_group, eligible: item.eligible };
        if (item.cpf) updateData.cpf = item.cpf;
        await supabase.from('profiles').update(updateData).eq('email', item.email);
      }
      setCsvFile(null);
      loadEmails();
      loadProfiles();
      return true;
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setCsvMessage('Lendo planilha...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      
      const parsed = lines.map(line => {
        const parts = line.split(',');
        const email = parts[0]?.trim();
        const cpf = parts[1]?.trim().replace(/\D/g, '') || null;
        let ug = parts[2]?.trim().toLowerCase();
        if (ug !== 'cliente' && ug !== 'colaborador') ug = 'colaborador';
        
        let eligible = true;
        if (parts.length > 3) {
          const elStr = parts[3]?.trim().toLowerCase();
          if (elStr === 'inelegivel' || elStr === 'inelegível' || elStr === 'false' || elStr === 'nao' || elStr === 'não') {
            eligible = false;
          }
        }
        
        return { email, cpf, user_group: ug, eligible };
      }).filter(i => i.email && i.email.includes('@'));
      
      const existing = await fetchAllRows('allowed_emails', 'created_at', false);
      const toUpdateOrInsert: any[] = [];
      const conflicts: any[] = [];
      const seenCpfsInCsv = new Map<string, string>();

      parsed.forEach(item => {
        if (item.cpf) {
          const matchedByCpf = existing?.find(e => e.cpf === item.cpf);
          if (matchedByCpf && matchedByCpf.email !== item.email) {
            conflicts.push({ email_csv: item.email, reason: `CPF já associado a ${matchedByCpf.email}` });
            return;
          }
          if (seenCpfsInCsv.has(item.cpf)) {
            const firstEmail = seenCpfsInCsv.get(item.cpf);
            if (firstEmail !== item.email) {
              conflicts.push({ email_csv: item.email, reason: `CPF duplicado nesta mesma planilha (conflita com ${firstEmail})` });
              return;
            }
          }
          seenCpfsInCsv.set(item.cpf, item.email);
        }
        toUpdateOrInsert.push(item);
      });

      setCsvConflicts(conflicts);
      
      if (toUpdateOrInsert.length > 0) {
        setCsvMessage('Atualizando banco de dados...');
        const success = await executeCsvUpsert(toUpdateOrInsert);
        if (success) {
          setCsvMessage(conflicts.length > 0 ? `Foram processados ${toUpdateOrInsert.length} e-mails. Algumas linhas foram ignoradas.` : 'Lista importada com sucesso!');
        }
      } else {
        if (conflicts.length > 0) {
          setCsvMessage('Nenhum registro válido. Todos apresentaram conflitos de duplicidade.');
        } else {
          setCsvMessage('Nenhum dado válido encontrado na planilha.');
        }
      }
    };
    reader.readAsText(csvFile);
  };

  const handleCsvRemove = async () => {
    if (!csvFile) return;
    setCsvMessage('Lendo planilha para remoção...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      
      // Assume a primeira coluna é o e-mail (ignora cabeçalhos se não for e-mail)
      const rawEmailsToRemove = lines.map(line => {
        const parts = line.split(',');
        return parts[0]?.trim();
      }).filter(email => email && email.includes('@'));

      // Filtrar admins
      const adminEmails = profiles.filter(p => p.role === 'admin').map(p => p.email);
      const emailsToRemove = rawEmailsToRemove.filter(e => !adminEmails.includes(e));
      const adminsToSkip = rawEmailsToRemove.filter(e => adminEmails.includes(e));
      
      if (emailsToRemove.length === 0) {
        setCsvMessage('Nenhum e-mail válido para remover (os encontrados são admins protegidos).');
        return;
      }

      let confirmMsg = `Tem certeza que deseja remover ${emailsToRemove.length} e-mails autorizados em massa?`;
      if (adminsToSkip.length > 0) {
        confirmMsg += `\n\n(Nota de segurança: ${adminsToSkip.length} e-mail(s) de Administrador na planilha foram protegidos).`;
      }

      if (!window.confirm(confirmMsg)) {
        setCsvMessage('');
        return;
      }

      const chunkSize = 50;
      let hasError = false;
      let lastError = '';
      
      for (let i = 0; i < emailsToRemove.length; i += chunkSize) {
        const chunk = emailsToRemove.slice(i, i + chunkSize);
        const { error } = await supabase.from('allowed_emails').delete().in('email', chunk);
        if (error) {
          hasError = true;
          lastError = error.message;
        }
      }
      
      if (hasError) {
        setCsvMessage(`Erro ao remover alguns e-mails: ${lastError}`);
      } else {
        setCsvMessage(`🗑️ ${emailsToRemove.length} e-mails removidos com sucesso!`);
        setCsvFile(null); 
        loadEmails();
      }
    };
    reader.readAsText(csvFile);
  };

  // ── Profiles ──────────────────────────────────────────────────────────────
  const loadProfiles = async () => {
    const data = await fetchAllRows('profiles', 'points', false);
    setProfiles(data);
  };

  const handleToggleAdmin = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Alterar para ${newRole}?`)) return;
    await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    loadProfiles();
  };

  // ── Translations ──────────────────────────────────────────────────────────
  const loadTranslations = async () => {
    let { data } = await supabase.from('team_translations').select('*').order('api_name', { ascending: true });
    if (!data || data.length === 0) {
      const { data: mData } = await supabase.from('matches').select('team_a, team_b');
      if (mData && mData.length > 0) {
        const teams = new Set<string>();
        mData.forEach((m: any) => { if (m.team_a) teams.add(m.team_a); if (m.team_b) teams.add(m.team_b); });
        const inserts = Array.from(teams).map(t => ({ api_name: t, pt_name: t, flag_code: 'un' }));
        await supabase.from('team_translations').upsert(inserts, { onConflict: 'api_name', ignoreDuplicates: true });
        const { data: newData } = await supabase.from('team_translations').select('*').order('api_name', { ascending: true });
        if (newData) data = newData;
      }
    }
    if (data) setTranslations(data);
  };

  // ── Ranking ───────────────────────────────────────────────────────────────
  const loadRanking = async () => {
    // Busca dados com paginação para evitar o limite de 1000 do supabase
    let guessesData: any[] = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase.from('guesses').select('points_earned, guess_score_a, guess_score_b, user_id').not('points_earned', 'is', null).range(from, from + step - 1);
      if (error || !data || data.length === 0) break;
      guessesData = [...guessesData, ...data];
      if (data.length < step) break;
      from += step;
    }

    const profilesData = await fetchAllRows('profiles', 'id', true);
    if (!profilesData) return;
    const statsMap: any = {};
    profilesData.forEach((p: any) => {
      statsMap[p.id] = { id: p.id, name: p.name, email: p.email, user_group: p.user_group, points: 0, exact: 0, winner: 0, tie: 0, single_goal: 0 };
    });
    if (guessesData) {
      guessesData.forEach((g: any) => {
        if (!statsMap[g.user_id] || !g.points_earned) return;
        statsMap[g.user_id].points += g.points_earned;
        if (g.points_earned === 10) statsMap[g.user_id].exact++;
        else if (g.points_earned === 3) {
          if (g.guess_score_a === g.guess_score_b) statsMap[g.user_id].tie++;
          else statsMap[g.user_id].winner++;
        } else if (g.points_earned === 1) statsMap[g.user_id].single_goal++;
      });
    }
    const sorted = Object.values(statsMap).sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exact !== a.exact) return b.exact - a.exact;
      if (b.winner !== a.winner) return b.winner - a.winner;
      if (b.tie !== a.tie) return b.tie - a.tie;
      return b.single_goal - a.single_goal;
    });
    setRanking(sorted);
  };

  const handleDownloadRanking = () => {
    const list = ranking.filter(r => r.user_group === rankingFilter).slice(0, 50);
    if (list.length === 0) { alert('Nenhum dado para exportar.'); return; }
    const headers = ['Posição', 'Nome', 'E-mail', 'Grupo', 'Pontos', 'Exatos(+10)', 'Vencedor(+3)', 'Empate(+3)', 'Gol(+1)'];
    const rows = list.map((r, i) => [i + 1, `"${r.name}"`, `"${r.email}"`, `"${r.user_group}"`, r.points, r.exact, r.winner, r.tie, r.single_goal]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `top50_${rankingFilter}_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── Matches ───────────────────────────────────────────────────────────────
  const loadMatches = async () => {
    const { data } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
    if (data) {
      setMatches(data);
      const init: any = {};
      data.forEach(m => { init[m.id] = { a: '', b: '' }; });
      setScores(init);
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatchMessage('Salvando...');
    const { error } = await supabase.from('matches').insert([{
      team_a: teamA, team_b: teamB, flag_a: flagA, flag_b: flagB,
      match_date: new Date(matchDate).toISOString(), status: 'pending'
    }]);
    if (error) setMatchMessage(`Erro: ${error.message}`);
    else { setMatchMessage('Jogo cadastrado!'); setTeamA(''); setTeamB(''); setMatchDate(''); loadMatches(); }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!window.confirm('Excluir este jogo permanentemente?')) return;
    await supabase.from('matches').delete().eq('id', id);
    loadMatches();
  };

  const handleFinishMatch = async (matchId: string, isFinished: boolean) => {
    const sA = scores[matchId]?.a;
    const sB = scores[matchId]?.b;
    if (sA === '' || sB === '') { alert('Digite o placar completo!'); return; }
    
    if (isFinished) {
      if (!window.confirm('Atenção: Este jogo já foi finalizado. Tem certeza que deseja RECALCULAR os pontos baseando-se nesse novo placar? Os pontos anteriores serão subtraídos e os novos serão somados.')) return;
      const { error } = await supabase.rpc('recalculate_match', { p_match_id: matchId, p_new_score_a: parseInt(sA), p_new_score_b: parseInt(sB) });
      if (error) alert(`Erro: ${error.message}`);
      else { alert('Pontos recalculados com sucesso!'); loadMatches(); loadRanking(); }
    } else {
      if (!window.confirm('Encerrar o jogo e distribuir pontos?')) return;
      const { error } = await supabase.rpc('finish_match', { p_match_id: matchId, p_real_score_a: parseInt(sA), p_real_score_b: parseInt(sB) });
      if (error) alert(`Erro: ${error.message}`);
      else { alert('Pontos distribuídos!'); loadMatches(); loadRanking(); }
    }
  };

  const handleSyncApi = async () => {
    if (!window.confirm('Buscar os 104 jogos da Copa 2026?')) return;
    setMatchMessage('Baixando...');
    try {
      const res = await fetch('/api/sync-matches');
      const data = await res.json();
      if (data.error) { setMatchMessage(`Erro: ${data.error}`); return; }

      // Verificar se já existem jogos
      const { count } = await supabase.from('matches').select('id', { count: 'exact', head: true });
      if ((count ?? 0) > 0) {
        const ok = window.confirm(
          `Já existem ${count} jogos cadastrados.\n\n` +
          `Deseja APAGAR todos e ressincronizar?\n` +
          `(Os palpites existentes também serão apagados)`
        );
        if (!ok) {
          setMatchMessage('Sincronização cancelada.');
          return;
        }
        // Apagar palpites e jogos antigos
        await supabase.from('guesses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        setMatchMessage('Jogos antigos removidos. Inserindo novos...');
      }

      // Upsert traduções de times
      const uniqueTeams = new Set<string>();
      data.matches.forEach((m: any) => { uniqueTeams.add(m.team_a); uniqueTeams.add(m.team_b); });
      const inserts = Array.from(uniqueTeams).map(t => ({ api_name: t, pt_name: t, flag_code: 'un' }));
      await supabase.from('team_translations').upsert(inserts, { onConflict: 'api_name', ignoreDuplicates: true });

      const { error } = await supabase.from('matches').insert(data.matches);
      if (error) setMatchMessage(`Erro: ${error.message}`);
      else { setMatchMessage(`🎉 ${data.matches.length} jogos sincronizados com sucesso!`); loadMatches(); loadTranslations(); }
    } catch (err: any) { setMatchMessage(`Erro: ${err.message}`); }
  };

  // Atualiza apenas os nomes das fases sem apagar jogos/palpites
  const handleFixGroupNames = async () => {
    setMatchMessage('Corrigindo nomes das fases...');
    try {
      const res = await fetch('/api/sync-matches');
      const data = await res.json();
      if (data.error) { setMatchMessage(`Erro: ${data.error}`); return; }
      // Buscar todos os jogos existentes
      const { data: existing } = await supabase.from('matches').select('id, team_a, team_b, match_date');
      if (!existing) { setMatchMessage('Nenhum jogo encontrado.'); return; }
      let updated = 0;
      for (const apiMatch of data.matches) {
        // Encontrar o jogo correspondente por time e data similar
        const match = existing.find(e =>
          e.team_a === apiMatch.team_a && e.team_b === apiMatch.team_b
        );
        if (match && apiMatch.group_name) {
          await supabase.from('matches').update({ group_name: apiMatch.group_name }).eq('id', match.id);
          updated++;
        }
      }
      setMatchMessage(`✅ ${updated} jogos tiveram o nome da fase corrigido!`);
      loadMatches();
    } catch (err: any) { setMatchMessage(`Erro: ${err.message}`); }
  };

  const handleClearAll = async () => {
    if (!window.confirm(
      'Apagar TODOS OS PALPITES e resetar os resultados dos jogos?\n\n' +
      '• Os jogos continuarão no sistema (não serão apagados)\n' +
      '• Os placares/resultados serão zerados\n' +
      '• Todos os palpites serão removidos\n' +
      '• Os pontos de todos os jogadores serão zerados\n\n' +
      'Esta ação é irreversível!'
    )) return;
    setMatchMessage('Resetando...');
    // 1. Apaga todos os palpites
    const { error: gErr } = await supabase.from('guesses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (gErr) { setMatchMessage(`Erro ao apagar palpites: ${gErr.message}`); return; }
    // 2. Zera pontos e placares exatos (apenas colunas que existem)
    await supabase.from('profiles').update({ points: 0, exact_scores: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    // 3. Reseta resultados dos jogos (mantém os jogos, zera placar)
    await supabase.from('matches').update({ score_a: null, score_b: null, status: 'pending' }).neq('id', '00000000-0000-0000-0000-000000000000');
    setMatchMessage('✅ Palpites apagados, pontos zerados e resultados resetados!');
    loadMatches();
    loadRanking();
  };

  const handleDownloadAudit = async () => {
    setMatchMessage('Gerando auditoria...');
    try {
      const { data, error } = await supabase.from('guesses').select(`
        guess_score_a, guess_score_b, points_earned, created_at,
        profiles (name, email, user_group),
        matches (team_a, team_b, match_date, score_a, score_b)
      `);
      if (error) { setMatchMessage(`Erro: ${error.message}`); return; }
      if (!data || data.length === 0) { setMatchMessage('Nenhum palpite ainda.'); return; }

      const getTipoPonto = (g: any) => {
        if (!g.points_earned || g.points_earned === 0) return 'Sem pontos';
        if (g.points_earned === 10) return 'Placar Exato';
        if (g.points_earned === 3) {
          if (g.guess_score_a === g.guess_score_b) return 'Empate Acertado';
          return 'Vencedor Acertado';
        }
        if (g.points_earned === 1) return 'Gol Isolado';
        return `+${g.points_earned}`;
      };

      const headers = ['Nome', 'E-mail', 'Grupo', 'Data do Jogo', 'Jogo', 'Palpite A', 'Palpite B', 'Placar Real', 'Pontos', 'Tipo de Ponto', 'Data/Hora do Palpite'];
      const rows = data.map((g: any) => [
        `"${g.profiles?.name || ''}"`, `"${g.profiles?.email || ''}"`, `"${g.profiles?.user_group || ''}"`,
        `"${g.matches?.match_date ? new Date(g.matches.match_date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : ''}"`,
        `"${g.matches?.team_a} x ${g.matches?.team_b}"`,
        g.guess_score_a, g.guess_score_b,
        g.matches?.score_a !== null ? `"${g.matches?.score_a} x ${g.matches?.score_b}"` : '"Pendente"',
        g.points_earned, `"${getTipoPonto(g)}"`, `"${new Date(g.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}"` 
      ]);
      const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `auditoria_${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setMatchMessage('Planilha gerada!');
    } catch (err: any) { setMatchMessage(`Erro: ${err.message}`); }
  };

  // ── Fases ─────────────────────────────────────────────────────────────────
  const loadPhases = async () => {
    const { data, error } = await supabase.from('phase_settings').select('*');
    if (error) {
      // Tabela não existe ou sem permissão
      setPhaseTableReady(false);
      return;
    }
    // Tabela existe (mesmo que vazia)
    setPhaseTableReady(true);
    const map: any = {};
    (data || []).forEach((p: any) => { map[p.phase_key] = p.is_open; });
    setOpenPhases(map);
  };

  const handleTogglePhase = async (key: string) => {
    const current = openPhases[key] ?? false;
    const newVal = !current;
    setPhaseMessage('Salvando...');
    const { error } = await supabase.from('phase_settings').upsert({ phase_key: key, is_open: newVal }, { onConflict: 'phase_key' });
    if (error) {
      setPhaseMessage(`Erro: ${error.message}`);
    } else {
      setOpenPhases(prev => ({ ...prev, [key]: newVal }));
      setPhaseMessage(`${newVal ? '🔓 Fase aberta' : '🔒 Fase fechada'} com sucesso!`);
      setTimeout(() => setPhaseMessage(''), 3000);
    }
  };

  // ── Bolão Colaborador ─────────────────────────────────────────────────
  const loadPoolSettings = async () => {
    const { data, error } = await supabase.from('pool_settings').select('*').eq('id', 1).single();
    if (!error && data) {
      setPoolSettings(data);
      setPoolLoaded(true);
    }
  };

  const loadColabEmails = async () => {
    const data = await fetchAllRows('allowed_emails', 'created_at', false);
    if (data) {
      const colabs = data.filter(e => e.user_group === 'colaborador');
      setColabEmails(colabs);
    }
  };

  const handleTogglePaid = async (id: string, currentPaid: boolean) => {
    const newPaid = !currentPaid;
    const { error } = await supabase.from('allowed_emails').update({ paid: newPaid }).eq('id', id);
    if (!error) loadColabEmails();
  };

  const handleSavePool = async () => {
    const total = Number(poolSettings.pct_1st) + Number(poolSettings.pct_2nd) + Number(poolSettings.pct_3rd);
    if (total > 100) {
      setPoolMessage(`⚠️ A soma dos percentuais (${total}%) não pode ultrapassar 100%.`);
      return;
    }
    setPoolMessage('Salvando...');
    const { error } = await supabase.from('pool_settings').update({
      value_per_person: poolSettings.value_per_person,
      pct_1st: poolSettings.pct_1st,
      pct_2nd: poolSettings.pct_2nd,
      pct_3rd: poolSettings.pct_3rd,
      prize_4th: poolSettings.prize_4th,
      prize_5th: poolSettings.prize_5th,
      prize_6th: poolSettings.prize_6th,
      prize_7th: poolSettings.prize_7th,
      prize_8th: poolSettings.prize_8th,
      prize_9th: poolSettings.prize_9th,
      prize_10th: poolSettings.prize_10th,
      updated_at: new Date().toISOString()
    }).eq('id', 1);
    if (error) setPoolMessage(`Erro: ${error.message}`);
    else { setPoolMessage('✅ Configurações salvas com sucesso!'); setTimeout(() => setPoolMessage(''), 3000); }
  };

  const handleLockPool = async () => {
    if (!window.confirm('Bloquear a configuração do bolão? Após isso, você não poderá alterar os percentuais ou o valor. Os pagamentos ainda poderão ser marcados.')) return;
    const { error } = await supabase.from('pool_settings').update({ config_locked: true }).eq('id', 1);
    if (!error) { setPoolSettings((p: any) => ({ ...p, config_locked: true })); setPoolMessage('🔒 Configuração bloqueada!'); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (checking) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-primary-dark)', color: '#fff', fontSize: '1.2rem' }}>Verificando credenciais...</div>;
  if (!isAdmin) return <div style={{ padding: '4rem', textAlign: 'center' }}><h1 style={{ color: '#ef4444' }}>Acesso Negado</h1><Link href="/">Voltar</Link></div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      {/* HEADER */}
      <header style={{ backgroundColor: 'var(--color-primary-dark)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>⚙️ Painel do Administrador</h1>
          <Link href="/dashboard" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>← Voltar ao Dashboard</Link>
        </div>
      </header>

      {/* TABS */}
      <nav style={{ backgroundColor: '#fff', borderBottom: '2px solid #e2e8f0', display: 'flex', overflowX: 'auto', gap: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid var(--color-primary-light)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab ? 'var(--color-primary-light)' : '#64748b',
              fontWeight: activeTab === tab ? '700' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* ── TAB: RANKING ───────────────────────────────────────────── */}
        {activeTab === 'ranking' && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.5rem' }}>🏆 Top 50 — Ranking Detalhado</h2>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <select value={rankingFilter} onChange={e => setRankingFilter(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="cliente">clientees</option>
                  <option value="colaborador">Colaboradores</option>
                </select>
                <button onClick={handleDownloadRanking} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#eab308', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  📊 Exportar Excel
                </button>
                <button onClick={loadRanking} style={{ padding: '0.6rem 1rem', backgroundColor: 'var(--color-primary-light)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🔄 Atualizar
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', fontSize: '0.8rem', color: '#64748b' }}>
                    <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Pos</th>
                    <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Nome</th>
                    <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Pontos</th>
                    <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Exatos</th>
                    <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Vencedor</th>
                    <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Empate</th>
                    <th style={{ padding: '0.8rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Gol Iso.</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.filter(r => r.user_group === rankingFilter).slice(0, 50).map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i < 3 ? '#fffbeb' : 'transparent' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 'bold', color: i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#555' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                      </td>
                      <td style={{ padding: '0.8rem' }}>
                        <span style={{ fontWeight: '700', color: 'var(--color-primary-dark)' }}>{r.name}</span>
                        <br /><span style={{ fontSize: '0.75rem', color: '#888' }}>{r.email}</span>
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', fontSize: '1.1rem', fontWeight: '900', color: 'var(--color-primary-light)' }}>{r.points}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: '600' }}>{r.exact}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: '600' }}>{r.winner}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: '600' }}>{r.tie}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--color-primary-dark)', fontWeight: '600' }}>{r.single_goal}</td>
                    </tr>
                  ))}
                  {ranking.filter(r => r.user_group === rankingFilter).length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Ninguém pontuou ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: USUÁRIOS ──────────────────────────────────────────── */}
        {activeTab === 'usuarios' && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>👑 Gestão de Usuários</h2>
                <input type="text" placeholder="Pesquisar nome, e-mail ou CPF..." value={profileSearch} onChange={e => setProfileSearch(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                <select value={profileFilter} onChange={e => setProfileFilter(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="todos">Todos</option>
                  <option value="cliente">clientees</option>
                  <option value="colaborador">Colaboradores</option>
                </select>
              </div>
              <button onClick={loadProfiles} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary-light)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Atualizar</button>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
              {profiles
                .filter(user => profileFilter === 'todos' || user.user_group === profileFilter)
                .filter(user => profileSearch === '' || 
                  user.email.toLowerCase().includes(profileSearch.toLowerCase()) || 
                  user.name.toLowerCase().includes(profileSearch.toLowerCase()) || 
                  (user.cpf && user.cpf.includes(profileSearch))
                )
                .slice(0, 100)
                .map(user => (
                <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f0f0f0', backgroundColor: user.role === 'admin' ? '#eff6ff' : '#fff' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{user.name}</span>
                    {user.role === 'admin' && <span style={{ fontSize: '0.7rem', backgroundColor: '#eab308', color: '#000', padding: '2px 6px', borderRadius: '10px', marginLeft: '0.5rem' }}>Admin</span>}
                    <br />
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{user.email} · CPF: {user.cpf || 'Não inf.'} · {user.user_group} · {user.points} pts</span>
                  </div>
                  <button onClick={() => handleToggleAdmin(user.id, user.role)} style={{ padding: '0.4rem 0.8rem', backgroundColor: user.role === 'admin' ? '#ef4444' : 'var(--color-primary-light)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                  </button>
                </div>
              ))}
              {profiles.filter(user => profileFilter === 'todos' || user.user_group === profileFilter)
                 .filter(user => profileSearch === '' || user.email.toLowerCase().includes(profileSearch.toLowerCase()) || user.name.toLowerCase().includes(profileSearch.toLowerCase()) || (user.cpf && user.cpf.includes(profileSearch)))
                 .length > 100 && (
                <p style={{ padding: '1rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>Mostrando os 100 primeiros resultados. Refine a busca para encontrar mais usuários.</p>
              )}
              {profiles.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Nenhum usuário cadastrado ainda.</p>}
            </div>
          </div>
        )}

        {/* ── TAB: E-MAILS ───────────────────────────────────────────── */}
        {activeTab === 'emails' && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1.5rem' }}>📧 Cadastro de Participantes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ color: '#666', marginBottom: '1rem' }}>Adicionar E-mail</h3>
                <form onSubmit={handleAddEmail} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="email" placeholder="E-mail" value={emailToAdd} onChange={e => setEmailToAdd(e.target.value)} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <input type="text" placeholder="CPF (Apenas números)" value={cpfToAdd} onChange={e => setCpfToAdd(e.target.value)} maxLength={14} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <select value={emailGroup} onChange={e => setEmailGroup(e.target.value)} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <option value="cliente">cliente</option>
                    <option value="colaborador">Colaborador</option>
                  </select>
                  <button type="submit" style={{ padding: '0.8rem', backgroundColor: 'var(--color-primary-light)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Adicionar</button>
                </form>
                {emailMessage && <div style={{ marginTop: '0.5rem', color: '#16a34a', fontSize: '0.9rem' }}>{emailMessage}</div>}
              </div>
              <div>
                <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Importar CSV</h3>
                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                  Formato esperado (sem cabeçalho):<br/>
                  <b>email,cpf,grupo,elegibilidade</b><br/>
                  Ex: <i>joao@email.com,12345678900,cliente,sim</i>
                </p>
                <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files ? e.target.files[0] : null)} style={{ padding: '0.5rem' }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" disabled={!csvFile} style={{ flex: 1, padding: '0.8rem', backgroundColor: csvFile ? '#16a34a' : '#ccc', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: csvFile ? 'pointer' : 'not-allowed' }}>Adicionar em Massa</button>
                    <button type="button" onClick={handleCsvRemove} disabled={!csvFile} style={{ flex: 1, padding: '0.8rem', backgroundColor: csvFile ? '#ef4444' : '#ccc', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: csvFile ? 'pointer' : 'not-allowed' }}>Remover em Massa</button>
                  </div>
                </form>
                {csvMessage && <div style={{ marginTop: '0.5rem', color: 'var(--color-primary-light)', fontSize: '0.9rem', fontWeight: 'bold' }}>{csvMessage}</div>}
                {csvConflicts.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '8px' }}>
                    <h4 style={{ color: '#b45309', margin: '0 0 0.5rem 0' }}>Itens Ignorados (Duplicidade)</h4>
                    <p style={{ fontSize: '0.8rem', color: '#92400e', margin: '0 0 1rem 0' }}>Os seguintes itens não foram importados pois o CPF já pertence a outra conta.</p>
                    <ul style={{ fontSize: '0.8rem', color: '#333', paddingLeft: '1.5rem', marginBottom: '0' }}>
                      {csvConflicts.slice(0, 10).map((c, i) => (
                        <li key={i}><b>{c.email_csv}</b>: {c.reason}</li>
                      ))}
                      {csvConflicts.length > 10 && <li>...e mais {csvConflicts.length - 10} itens</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <h3 style={{ color: '#666', margin: 0 }}>E-mails Autorizados ({allowedEmails.length})</h3>
                <button onClick={handleDownloadEmails} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#eab308', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  📊 Exportar Planilha
                </button>
                <input type="text" placeholder="Pesquisar e-mail ou CPF..." value={emailSearch} onChange={e => setEmailSearch(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                <select value={emailFilter} onChange={e => setEmailFilter(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="todos">Todos</option>
                  <option value="cliente">clientees</option>
                  <option value="colaborador">Colaboradores</option>
                </select>
              </div>
              {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🗑️ Remover Selecionados ({selectedIds.length})
                </button>
              )}
            </div>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
              {allowedEmails.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0.8rem', borderBottom: '2px solid #eee', backgroundColor: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}>
                  <input 
                    type="checkbox" 
                    checked={
                      selectedIds.length > 0 && 
                      selectedIds.length === allowedEmails
                        .filter(item => emailFilter === 'todos' || item.user_group === emailFilter)
                        .filter(item => emailSearch === '' || 
                          item.email.toLowerCase().includes(emailSearch.toLowerCase()) ||
                          (item.cpf && item.cpf.includes(emailSearch))
                        )
                        .length
                    } 
                    onChange={handleSelectAll} 
                    style={{ marginRight: '1rem', width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold', color: '#666', fontSize: '0.85rem' }}>Selecionar Todos visíveis</span>
                </div>
              )}
              {allowedEmails
                .filter(item => emailFilter === 'todos' || item.user_group === emailFilter)
                .filter(item => emailSearch === '' || 
                  item.email.toLowerCase().includes(emailSearch.toLowerCase()) ||
                  (item.cpf && item.cpf.includes(emailSearch))
                )
                .slice(0, 100)
                .map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', borderBottom: '1px solid #f0f0f0', backgroundColor: selectedIds.includes(item.id) ? '#eff6ff' : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(item.id)} 
                      onChange={() => handleSelectId(item.id)} 
                      style={{ marginRight: '1rem', width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                    />
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>{item.email}</span>
                      <br />
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>
                        {item.user_group} {item.cpf ? `· CPF: ${item.cpf}` : ''}
                      </span>
                      {item.eligible === false && <span style={{ marginLeft: '0.5rem', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>Inelegível</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => handleToggleEligibility(item.email, item.eligible !== false)} style={{ padding: '0.4rem 0.8rem', backgroundColor: item.eligible !== false ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {item.eligible !== false ? '✅ Elegível' : '❌ Inelegível'}
                    </button>
                    <button onClick={() => handleDeleteEmail(item.id, item.email)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                  </div>
                </div>
              ))}
              {allowedEmails.filter(item => emailFilter === 'todos' || item.user_group === emailFilter)
                 .filter(item => emailSearch === '' || item.email.toLowerCase().includes(emailSearch.toLowerCase()) || (item.cpf && item.cpf.includes(emailSearch)))
                 .length > 100 && (
                <p style={{ padding: '1rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>Mostrando os 100 primeiros resultados. Refine a busca para encontrar mais e-mails.</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: DICIONÁRIO ─────────────────────────────────────────── */}
        {activeTab === 'dicionario' && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>🌍 Dicionário de Seleções</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Traduza os nomes das seleções e defina a sigla ISO de 2 letras para exibir a bandeira correta.</p>
            <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9f9fa', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '0.8rem', borderBottom: '1px solid #ddd', color: '#666', textAlign: 'left' }}>Nome API</th>
                    <th style={{ padding: '0.8rem', borderBottom: '1px solid #ddd', color: '#666', textAlign: 'left' }}>Português</th>
                    <th style={{ padding: '0.8rem', borderBottom: '1px solid #ddd', color: '#666', textAlign: 'left' }}>Sigla</th>
                    <th style={{ padding: '0.8rem', borderBottom: '1px solid #ddd', color: '#666', textAlign: 'left' }}>Salvar</th>
                  </tr>
                </thead>
                <tbody>
                  {translations.map((t, index) => (
                    <tr key={t.api_name} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#888', fontWeight: 'bold', fontSize: '0.85rem' }}>{t.api_name}</td>
                      <td style={{ padding: '0.4rem' }}>
                        <input type="text" value={t.pt_name} onChange={e => { const a = [...translations]; a[index] = { ...a[index], pt_name: e.target.value }; setTranslations(a); }} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <input type="text" maxLength={6} value={t.flag_code} onChange={e => { const a = [...translations]; a[index] = { ...a[index], flag_code: e.target.value.toLowerCase() }; setTranslations(a); }} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <button onClick={async () => { await supabase.from('team_translations').update({ pt_name: t.pt_name, flag_code: t.flag_code }).eq('api_name', t.api_name); }} style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--color-primary-light)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          ✅ Salvar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {translations.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Nenhuma seleção. Sincronize os jogos primeiro.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: JOGOS ──────────────────────────────────────────────── */}
        {activeTab === 'jogos' && (
          <div>
            {/* Ações */}
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button onClick={handleSyncApi} style={{ padding: '0.7rem 1.2rem', backgroundColor: 'var(--color-primary-light)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Sincronizar Copa 2026</button>
              <button onClick={handleFixGroupNames} style={{ padding: '0.7rem 1.2rem', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🏷️ Corrigir Nomes das Fases</button>
              <button onClick={handleDownloadAudit} style={{ padding: '0.7rem 1.2rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Baixar Auditoria</button>
              <button onClick={handleClearAll} style={{ padding: '0.7rem 1.2rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🗑 Limpar Palpites/Reset</button>
            </div>
            {matchMessage && <div style={{ marginBottom: '1rem', padding: '0.8rem', backgroundColor: '#eff6ff', borderRadius: '8px', color: 'var(--color-primary-light)', fontWeight: 'bold' }}>{matchMessage}</div>}

            {/* Agendar jogo */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>➕ Agendar Nova Partida</h3>
              <form onSubmit={handleAddMatch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '1rem', alignItems: 'end' }}>
                <div><label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Time A</label><input type="text" value={teamA} onChange={e => setTeamA(e.target.value)} required style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Sigla A (ex: br)</label><input type="text" value={flagA} onChange={e => setFlagA(e.target.value.toLowerCase())} required style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Time B</label><input type="text" value={teamB} onChange={e => setTeamB(e.target.value)} required style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Sigla B (ex: ar)</label><input type="text" value={flagB} onChange={e => setFlagB(e.target.value.toLowerCase())} required style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Data e Hora</label><input type="datetime-local" value={matchDate} onChange={e => setMatchDate(e.target.value)} required style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd' }} /></div>
                <button type="submit" style={{ gridColumn: '1 / -1', padding: '0.8rem', backgroundColor: 'var(--color-primary-dark)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Jogo</button>
              </form>
            </div>

            {/* Lista jogos */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>Partidas Cadastradas ({matches.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '600px', overflowY: 'auto' }}>
                {matches.map(match => (
                  <div key={match.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', border: '1px solid #eee', borderRadius: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => handleDeleteMatch(match.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Excluir">🗑️</button>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(match.match_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} | {match.status === 'pending' ? '⏳ Pendente' : '✅ Encerrado'}</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{match.team_a} x {match.team_b}</div>
                    </div>
                    {match.status === 'pending' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input type="number" min="0" value={scores[match.id]?.a || ''} onChange={e => setScores({ ...scores, [match.id]: { ...scores[match.id], a: e.target.value } })} style={{ width: '45px', padding: '0.4rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <span>x</span>
                        <input type="number" min="0" value={scores[match.id]?.b || ''} onChange={e => setScores({ ...scores, [match.id]: { ...scores[match.id], b: e.target.value } })} style={{ width: '45px', padding: '0.4rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <button onClick={() => handleFinishMatch(match.id, false)} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#eab308', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Encerrar</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input type="number" min="0" placeholder={match.score_a} value={scores[match.id]?.a || ''} onChange={e => setScores({ ...scores, [match.id]: { ...scores[match.id], a: e.target.value } })} style={{ width: '45px', padding: '0.4rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>x</span>
                        <input type="number" min="0" placeholder={match.score_b} value={scores[match.id]?.b || ''} onChange={e => setScores({ ...scores, [match.id]: { ...scores[match.id], b: e.target.value } })} style={{ width: '45px', padding: '0.4rem', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <button onClick={() => handleFinishMatch(match.id, true)} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Recalcular</button>
                      </div>
                    )}
                  </div>
                ))}
                {matches.length === 0 && <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>Nenhum jogo cadastrado.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: FASES ──────────────────────────────────────────────── */}
        {activeTab === 'fases' && (
          <div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>🔓 Controle de Fases</h2>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                A <strong>Fase de Grupos</strong> já está sempre liberada. Quando as fases eliminatórias estiverem definidas (com os times confirmados), abra cada fase aqui para liberar os palpites dos usuários.
              </p>
              {phaseMessage && <div style={{ marginBottom: '1rem', padding: '0.8rem', backgroundColor: '#eff6ff', borderRadius: '8px', color: 'var(--color-primary-light)', fontWeight: 'bold' }}>{phaseMessage}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {PHASES.map(phase => {
                  const isOpen = phase.key === 'group' ? true : (openPhases[phase.key] ?? false);
                  const isFixed = phase.key === 'group';
                  return (
                    <div key={phase.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', border: `2px solid ${isOpen ? '#10b981' : '#e2e8f0'}`, borderRadius: '12px', backgroundColor: isOpen ? '#f0fdf4' : '#f8fafc' }}>
                      <div>
                        <span style={{ fontWeight: '700', color: 'var(--color-primary-dark)', fontSize: '1rem' }}>{phase.label}</span>
                        {isFixed && <span style={{ marginLeft: '0.8rem', fontSize: '0.7rem', backgroundColor: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>Sempre aberta</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isOpen ? '#10b981' : '#94a3b8' }}>
                          {isOpen ? '🔓 ABERTA' : '🔒 FECHADA'}
                        </span>
                        {!isFixed && (
                          <button
                            onClick={() => handleTogglePhase(phase.key)}
                            style={{
                              padding: '0.5rem 1.2rem',
                              backgroundColor: isOpen ? '#ef4444' : '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.85rem'
                            }}
                          >
                            {isOpen ? 'Fechar Fase' : 'Abrir Fase'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {!phaseTableReady && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '12px', padding: '1rem 1.5rem' }}>
                <h3 style={{ color: '#b45309', margin: '0 0 0.5rem 0' }}>⚠️ Ação necessária no banco de dados</h3>
                <p style={{ color: '#92400e', fontSize: '0.9rem', margin: 0 }}>
                  Para a aba de Fases funcionar, crie a tabela <strong>phase_settings</strong> no Supabase SQL Editor:
                </p>
                <pre style={{ backgroundColor: '#fff', padding: '0.8rem', borderRadius: '6px', fontSize: '0.8rem', marginTop: '0.8rem', overflowX: 'auto', color: '#333' }}>
{`CREATE TABLE IF NOT EXISTS public.phase_settings (
  phase_key TEXT PRIMARY KEY,
  is_open BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.phase_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON public.phase_settings FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "public_read" ON public.phase_settings FOR SELECT USING (true);`}
                </pre>
                <button onClick={loadPhases} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', backgroundColor: 'var(--color-primary-light)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🔄 Verificar novamente
                </button>
              </div>
            )}
            {phaseTableReady && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #10b981', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <p style={{ color: '#065f46', fontWeight: 'bold', margin: 0 }}>Tabela de fases conectada com sucesso! Os toggles estão funcionando.</p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
