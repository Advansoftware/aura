'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface AdminStats {
  totalGames: number;
  totalViews: number;
  syncStatus: 'idle' | 'running' | 'completed' | 'failed';
  syncProgress: number;
  syncCurrentGame: string;
  syncTotalGames: number;
  syncProcessedGames: number;
  lastScrape: string | null;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // Estados para troca de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Verifica se o usuário já possui sessão ativa ao carregar a página
  useEffect(() => {
    fetchStats()
      .then((success) => {
        if (success) {
          setIsLogged(true);
        }
      })
      .finally(() => {
        setInitialLoading(false);
      });

    return () => stopPolling();
  }, []);

  // Monitora o estado de sincronização para iniciar ou pausar o polling
  useEffect(() => {
    if (isLogged && stats && stats.syncStatus === 'running') {
      startPolling();
    } else {
      stopPolling();
    }
  }, [isLogged, stats?.syncStatus]);

  const fetchStats = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Falha ao obter status administrativo:', err);
      return false;
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      fetchStats();
    }, 2000); // Polling a cada 2 segundos durante a sincronização
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsLogged(true);
        setPassword('');
        await fetchStats();
      } else {
        setError(data.error || 'Erro ao efetuar login');
      }
    } catch (err) {
      setError('Falha de conexão com o servidor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSync = async (force: boolean) => {
    if (!confirm(force 
      ? 'Deseja realmente forçar a sincronização total? Isso re-analisará todos os jogos existentes no banco e pode demorar alguns minutos.' 
      : 'Deseja iniciar a sincronização em background para obter novos jogos?'
    )) return;

    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchStats();
      } else {
        setError(data.error || 'Erro ao iniciar sincronização');
      }
    } catch (err) {
      setError('Falha de conexão ao disparar sincronização');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Erro ao efetuar logout:', err);
    }
    stopPolling();
    setIsLogged(false);
    setStats(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setActionLoading(true);

    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não conferem!');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordSuccess('Senha alterada com sucesso! Fechando...');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(null);
        }, 1500);
      } else {
        setPasswordError(data.error || 'Erro ao alterar a senha');
      }
    } catch (err) {
      setPasswordError('Falha de conexão com o servidor');
    } finally {
      setActionLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#090b11] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-[#00fe9b] border-t-transparent rounded-full" />
          <span className="text-gray-400 text-sm">Carregando painel...</span>
        </div>
      </div>
    );
  }

  // 1. Renderizador da Tela de Login (Acesso Protegido)
  if (!isLogged) {
    return (
      <div className="min-h-screen bg-[#090b11] flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Glow de fundo sofisticado */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#00fe9b]/10 rounded-full blur-[100px] pointer-events-none z-0" />
        
        <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00fe9b] to-[#00a852] text-black shadow-[0_0_20px_rgba(0,254,155,0.4)] mb-4">
              <svg className="w-7 h-7 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l3.593-1.632A11.962 11.962 0 0012 19c1.66 0 3.238-.34 4.678-1.004L20 21l-.813-5.096A11.97 11.97 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 1.439.32 2.798.887 4.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white text-center">
              RespondiA <span className="text-[#00fe9b]">Games</span>
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Área Administrativa</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="pass" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Senha de Acesso
              </label>
              <input
                id="pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira a senha do admin..."
                className="w-full px-4 py-3 bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#00fe9b] rounded-xl text-white outline-none transition-all placeholder:text-gray-600 text-sm focus:shadow-[0_0_15px_rgba(0,254,155,0.15)]"
                required
                disabled={actionLoading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3 bg-[#00fe9b] hover:bg-[#00d668] text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(0,254,155,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full" />
              ) : (
                'Acessar Painel'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Voltar ao catálogo público
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Renderizador do Painel de Administração
  return (
    <div className="min-h-screen bg-[#090b11] text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#090b11]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00fe9b] to-[#00a852] text-black">
              <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">
              RespondiA <span className="text-[#00fe9b]">Games Admin</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              Catálogo
            </Link>
            <button
              onClick={() => {
                setPasswordError(null);
                setPasswordSuccess(null);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordModal(true);
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-[#00fe9b]/25 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:border-[#00fe9b]/60 hover:text-[#00fe9b]"
            >
              Alterar Senha
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* 1. Grade de Estatísticas do Banco SQLite */}
        {stats && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Total de Jogos Indexados</p>
              <p className="text-3xl font-black text-white">{stats.totalGames}</p>
              <p className="text-xs text-gray-400 mt-2">Jogos salvos localmente no SQLite</p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Soma de Visualizações</p>
              <p className="text-3xl font-black text-[#00fe9b] shadow-sm">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-2">Interesse consolidado dos usuários</p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Último Scrape Efetuado</p>
              <p className="text-lg font-bold text-white mt-1.5 truncate">
                {stats.lastScrape ? new Date(stats.lastScrape).toLocaleDateString('pt-BR', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                }) : 'Nenhum efetuado'}
              </p>
              <p className="text-xs text-gray-400 mt-3">Sincronização agendada ou manual</p>
            </div>
          </section>
        )}

        {/* 2. Seção do Scraper Inteligente em Tempo Real */}
        {stats && (
          <section className="bg-white/5 border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Sincronização de Catálogo
                  {stats.syncStatus === 'running' && (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00fe9b] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00fe9b]"></span>
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-400">Gerencie a coleta em tempo real de novos torrents do site original</p>
              </div>

              {/* Ações de sincronização */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleSync(false)}
                  disabled={stats.syncStatus === 'running' || actionLoading}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:border-[#00fe9b]/50 hover:bg-white/10 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sincronizar (Apenas Novos)
                </button>
                <button
                  onClick={() => handleSync(true)}
                  disabled={stats.syncStatus === 'running' || actionLoading}
                  className="px-4 py-2 bg-[#00fe9b] hover:bg-[#00d668] text-black font-bold rounded-lg text-xs transition-all shadow-[0_0_10px_rgba(0,254,155,0.2)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Forçar Recarga Total
                </button>
              </div>
            </div>

            {/* Detalhes do Progresso do Scraper */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Status do Scraper</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  stats.syncStatus === 'running' 
                    ? 'bg-[#00fe9b]/10 text-[#00fe9b] border border-[#00fe9b]/20 animate-pulse'
                    : stats.syncStatus === 'completed'
                    ? 'bg-[#00fe9b]/15 text-[#00fe9b] border border-[#00fe9b]/30'
                    : stats.syncStatus === 'failed'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-white/5 text-gray-400 border border-white/5'
                }`}>
                  {stats.syncStatus === 'running' 
                    ? 'Rodando em background' 
                    : stats.syncStatus === 'completed'
                    ? 'Concluído com sucesso'
                    : stats.syncStatus === 'failed'
                    ? 'Falhou'
                    : 'Inativo'}
                </span>
              </div>

              {stats.syncStatus === 'running' && (
                <div className="space-y-3 bg-black/30 border border-white/5 rounded-xl p-4 md:p-5 animate-pulse">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="truncate max-w-[70%] font-medium">
                      🚀 {stats.syncCurrentGame || 'Sincronizando...'}
                    </span>
                    <span className="font-bold text-[#00fe9b] shrink-0">
                      {stats.syncProgress}%
                    </span>
                  </div>

                  {/* Barra de Progresso Verde-Néon */}
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00fe9b] to-[#00a852] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,254,155,0.4)]"
                      style={{ width: `${stats.syncProgress}%` }}
                    />
                  </div>

                  {stats.syncTotalGames > 0 && (
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Iniciado do site original</span>
                      <span>
                        {stats.syncProcessedGames} / {stats.syncTotalGames} links analisados
                      </span>
                    </div>
                  )}
                </div>
              )}

              {stats.syncStatus === 'completed' && stats.syncCurrentGame && (
                <div className="p-4 bg-[#00fe9b]/5 border border-[#00fe9b]/15 rounded-xl text-xs text-gray-300">
                  🎉 {stats.syncCurrentGame}
                </div>
              )}

              {stats.syncStatus === 'failed' && (
                <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl text-xs text-red-400">
                  ❌ A sincronização em background falhou.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Modal de Alteração de Senha flutuante */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#0c0e17] border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              {/* Botão de Fechar */}
              <button
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Alterar Senha</h2>
                <p className="text-xs text-gray-400 mt-1">Insira os dados abaixo para modificar a senha administrativa.</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="curr-pass" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Senha Atual
                  </label>
                  <input
                    id="curr-pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Senha atual..."
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#00fe9b] rounded-xl text-white outline-none transition-all placeholder:text-gray-600 text-sm focus:shadow-[0_0_15px_rgba(0,254,155,0.15)]"
                    required
                    disabled={actionLoading}
                  />
                </div>

                <div>
                  <label htmlFor="new-pass" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Nova Senha
                  </label>
                  <input
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres..."
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#00fe9b] rounded-xl text-white outline-none transition-all placeholder:text-gray-600 text-sm focus:shadow-[0_0_15px_rgba(0,254,155,0.15)]"
                    required
                    disabled={actionLoading}
                  />
                </div>

                <div>
                  <label htmlFor="conf-pass" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    id="conf-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha..."
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#00fe9b] rounded-xl text-white outline-none transition-all placeholder:text-gray-600 text-sm focus:shadow-[0_0_15px_rgba(0,254,155,0.15)]"
                    required
                    disabled={actionLoading}
                  />
                </div>

                {passwordError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium text-center">
                    ⚠️ {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-[#00fe9b]/10 border border-[#00fe9b]/20 rounded-xl text-xs text-[#00fe9b] font-medium text-center">
                    ✅ {passwordSuccess}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-[#00fe9b] hover:bg-[#00d668] text-black font-bold rounded-lg text-xs transition-all shadow-[0_0_10px_rgba(0,254,155,0.2)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                    ) : (
                      'Salvar Senha'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
