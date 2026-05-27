import { useEffect, useState } from 'react';
import { Lock, LogIn, Mail, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient.js';

export function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('missing-config');
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? 'ready' : 'signed-out');
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'ready' : 'signed-out');
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (status === 'loading') {
    return <AuthShell title="Validando acesso" description="Conferindo sua sessão de acesso." />;
  }

  if (status === 'missing-config') {
    return (
      <AuthShell
        title="Supabase não configurado"
        description="Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env."
      />
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  return children;
}

function AuthForm() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  async function submitPassword(event) {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Validando credenciais...' });

    const payload = { email: email.trim(), password };
    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword(payload)
      : await supabase.auth.signUp(payload);

    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }

    setStatus({
      type: 'success',
      message: mode === 'signin'
        ? 'Acesso liberado.'
        : 'Conta criada. Para liberar o acesso, valide seu e-mail pelo link recebido. A mensagem pode chegar com remetente do Supabase; confira também a caixa de spam ou lixo eletrônico.',
    });
  }

  async function sendMagicLink() {
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Informe o e-mail para enviar o link mágico.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Enviando link de acesso...' });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    });

    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }

    setStatus({ type: 'success', message: 'Link mágico enviado. Confira seu e-mail.' });
  }

  return (
    <AuthShell
      title={mode === 'signin' ? 'Acesso ao painel' : 'Criar acesso'}
      description="Entre para gerenciar páginas, agenda, depoimentos e configurações."
    >
      <form onSubmit={submitPassword} className="mt-8 grid gap-4">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            <Mail size={15} />
            E-mail
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="voce@email.com"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            <Lock size={15} />
            Senha
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="Mínimo de 6 caracteres"
            required
          />
        </label>

        <button
          type="submit"
          disabled={status.type === 'loading'}
          className="pill-button bg-brand-600 text-white shadow-glow disabled:opacity-60"
        >
          <LogIn size={18} />
          {mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </button>

        <button
          type="button"
          onClick={sendMagicLink}
          disabled={status.type === 'loading'}
          className="pill-button border border-slate-200 bg-white text-brand-900 disabled:opacity-60"
        >
          Enviar link mágico
        </button>
      </form>

      {status.message && (
        <p
          className={`mt-5 rounded-2xl p-4 text-sm font-bold leading-6 ${
            status.type === 'error'
              ? 'bg-red-50 text-red-600'
              : status.type === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-brand-50 text-brand-700'
          }`}
        >
          {status.message}
        </p>
      )}

      <button
        type="button"
        onClick={() => setMode((current) => (current === 'signin' ? 'signup' : 'signin'))}
        className="mt-6 text-sm font-extrabold text-brand-700"
      >
        {mode === 'signin' ? 'Criar uma nova conta' : 'Já tenho conta'}
      </button>
    </AuthShell>
  );
}

function AuthShell({ title, description, children }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f8fbff] px-5 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-white bg-white/90 p-7 shadow-soft backdrop-blur-xl">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
          <Sparkles size={24} />
        </span>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.03em] text-brand-900">{title}</h1>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">{description}</p>
        {children}
      </section>
    </main>
  );
}
