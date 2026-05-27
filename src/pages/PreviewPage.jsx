import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { buildPageConfigFromOnboarding } from '../landing/pageConfig.js';
import { themeToCssVars } from '../landing/theme.js';
import {
  CenteredState,
  ConversionModule,
  FAQModule,
  FinalCTAModule,
  FooterModule,
  GalleryModule,
  HeaderModule,
  HeroModule,
  ServicesModule,
  SignatureModule,
  TestimonialsModule,
  ThemeSettingsPanel,
} from '../landing/modules.jsx';

export default function PreviewPage() {
  const slug = normalizeSlug(window.location.pathname.replace('/preview/', '').replace(/\/$/, ''));
  const [submission, setSubmission] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadSubmission() {
      if (!isSupabaseConfigured) {
        setStatus('error');
        setErrorMessage('Supabase não está configurado no .env.');
        return;
      }

      const { data, error } = await supabase
        .from('onboarding_submissions')
        .select('business_name, slug, segment, whatsapp, email, hero_image_url, payload, status, created_at')
        .eq('slug', slug)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      if (!data) {
        setStatus('not-found');
        return;
      }

      setSubmission(data);
      setStatus('ready');
    }

    loadSubmission();
  }, [slug]);

  if (status === 'loading') {
    return <CenteredState title="Carregando preview" description="Buscando os dados preenchidos no Supabase." />;
  }

  if (status === 'not-found') {
    return <CenteredState title="Preview não encontrado" description={`Não existe uma submissão com o slug /${slug}.`} />;
  }

  if (status === 'error') {
    return <CenteredState title="Não foi possível carregar" description={errorMessage} />;
  }

  return <PreviewLanding submission={submission} />;
}

function PreviewLanding({ submission }) {
  const storedTheme = localStorage.getItem(`preview-theme:${submission.slug}`);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeKey, setThemeKey] = useState(storedTheme || '');
  const config = useMemo(() => buildPageConfigFromOnboarding(submission, themeKey), [submission, themeKey]);
  const themeStyle = useMemo(() => themeToCssVars(config.theme), [config.theme]);
  const modules = config.enabledModules;

  useEffect(() => {
    localStorage.setItem(`preview-theme:${submission.slug}`, config.theme.key);
  }, [config.theme.key, submission.slug]);

  function handleThemeSelect(nextThemeKey) {
    setThemeKey(nextThemeKey);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--preview-bg)] text-[var(--preview-text)]" style={themeStyle}>
      <HeaderModule config={config} theme={config.theme} onOpenSettings={() => setSettingsOpen(true)} />
      <ThemeSettingsPanel
        open={settingsOpen}
        currentTheme={config.theme.key}
        slug={submission.slug}
        onClose={() => setSettingsOpen(false)}
        onSelect={handleThemeSelect}
      />

      <main>
        {modules.hero && <HeroModule config={config} theme={config.theme} />}
        {modules.services && <ServicesModule config={config} theme={config.theme} />}
        {modules.services && <SignatureModule config={config} theme={config.theme} />}
        {modules.gallery && <GalleryModule config={config} theme={config.theme} />}
        {modules.schedule && <ConversionModule config={config} theme={config.theme} />}
        {modules.testimonials && <TestimonialsModule config={config} theme={config.theme} />}
        {modules.faq && <FAQModule config={config} theme={config.theme} />}
        {modules.finalCta && <FinalCTAModule config={config} theme={config.theme} />}
      </main>

      {modules.footer && <FooterModule config={config} theme={config.theme} />}
    </div>
  );
}

function normalizeSlug(value) {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
