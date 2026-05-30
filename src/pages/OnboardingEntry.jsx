import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';
import OnboardingPage from './OnboardingPage.jsx';

export default function OnboardingEntry() {
  const forceNew = new URLSearchParams(window.location.search).get('new') === '1';
  const [status, setStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (forceNew) {
      setStatus('new');
      return undefined;
    }

    let active = true;

    async function routeUser() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!active) return;

      if (userError || !userData.user) {
        setStatus('new');
        return;
      }

      const { data, error } = await supabase
        .from('onboarding_submissions')
        .select('id')
        .eq('owner_id', userData.user.id)
        .limit(1);

      if (!active) return;

      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }

      if (data?.length) {
        window.location.replace('/dashboard');
        return;
      }

      setStatus('new');
    }

    routeUser();

    return () => {
      active = false;
    };
  }, [forceNew]);

  if (status === 'checking') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8fbff] px-5">
        <section className="w-full max-w-md rounded-[2rem] border border-white bg-white p-7 text-center shadow-soft">
          <Loader2 size={28} className="mx-auto animate-spin text-brand-600" />
          <h1 className="mt-5 text-2xl font-black text-brand-900">Conferindo suas páginas</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
            Se você já tiver uma página criada, vamos abrir seu painel automaticamente.
          </p>
        </section>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8fbff] px-5">
        <section className="w-full max-w-md rounded-[2rem] border border-white bg-white p-7 shadow-soft">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white">
            <Plus size={22} />
          </span>
          <h1 className="mt-5 text-2xl font-black text-brand-900">Não foi possível carregar suas páginas</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{errorMessage}</p>
          <a href="/dashboard" className="pill-button mt-6 bg-brand-600 text-white shadow-glow">
            Ir para o painel
            <ArrowRight size={18} />
          </a>
        </section>
      </main>
    );
  }

  return <OnboardingPage />;
}
