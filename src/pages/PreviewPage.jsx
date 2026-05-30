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
        .select('id, owner_id, business_name, slug, segment, whatsapp, email, hero_image_url, payload, status, created_at')
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
  const [localSubmission, setLocalSubmission] = useState(submission);
  const [session, setSession] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeKey, setThemeKey] = useState(storedTheme || '');
  const [editStatus, setEditStatus] = useState({ type: 'idle', message: '' });
  const config = useMemo(() => buildPageConfigFromOnboarding(localSubmission, themeKey), [localSubmission, themeKey]);
  const themeStyle = useMemo(() => themeToCssVars(config.theme), [config.theme]);
  const modules = config.enabledModules;
  const canEdit = Boolean(session?.user?.id && localSubmission.owner_id && session.user.id === localSubmission.owner_id);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(`preview-theme:${localSubmission.slug}`, config.theme.key);
  }, [config.theme.key, localSubmission.slug]);

  function handleThemeSelect(nextThemeKey) {
    setThemeKey(nextThemeKey);
  }

  async function saveSubmission(nextSubmission, successMessage = 'Alteração salva.') {
    setEditStatus({ type: 'saving', message: 'Salvando...' });
    const business = nextSubmission.payload?.businesses || {};
    const branding = nextSubmission.payload?.business_branding || {};
    const { error } = await supabase
      .from('onboarding_submissions')
      .update({
        business_name: business.name || nextSubmission.business_name,
        segment: business.segment || nextSubmission.segment,
        whatsapp: business.whatsapp || nextSubmission.whatsapp,
        email: business.email || nextSubmission.email,
        hero_image_url: branding.hero_image_url || nextSubmission.hero_image_url,
        payload: nextSubmission.payload,
        status: nextSubmission.status === 'published' ? 'published' : 'preview',
      })
      .eq('id', nextSubmission.id);

    if (error) {
      setEditStatus({ type: 'error', message: error.message });
      return false;
    }

    setEditStatus({ type: 'success', message: successMessage });
    window.setTimeout(() => setEditStatus({ type: 'idle', message: '' }), 2200);
    return true;
  }

  async function updateHeroText(field, value) {
    const cleanValue = String(value || '').trim();
    if (!cleanValue || cleanValue === config.branding[field]) return;
    const nextSubmission = withBrandingField(localSubmission, field, cleanValue);
    setLocalSubmission(nextSubmission);
    await saveSubmission(nextSubmission);
  }

  async function uploadHeroImage(file) {
    if (!file || !session?.user?.id) return;
    if (!file.type.startsWith('image/')) {
      setEditStatus({ type: 'error', message: 'Escolha um arquivo de imagem.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditStatus({ type: 'error', message: 'Use uma imagem com até 5 MB.' });
      return;
    }

    setEditStatus({ type: 'saving', message: 'Enviando imagem...' });
    const extension = getFileExtension(file);
    const path = `${session.user.id}/${localSubmission.slug}/hero-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('landing-assets')
      .upload(path, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      setEditStatus({
        type: 'error',
        message: uploadError.message.includes('Bucket not found')
          ? 'Bucket landing-assets não encontrado. Execute o SQL de storage no Supabase.'
          : uploadError.message,
      });
      return;
    }

    const { data } = supabase.storage.from('landing-assets').getPublicUrl(path);
    const publicUrl = data.publicUrl;
    const nextSubmission = withBrandingField(localSubmission, 'hero_image_url', publicUrl);
    setLocalSubmission(nextSubmission);
    await saveSubmission(nextSubmission, 'Imagem atualizada.');
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--preview-bg)] text-[var(--preview-text)]" style={themeStyle}>
      <HeaderModule
        config={config}
        theme={config.theme}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={signOut}
        canEdit={canEdit}
      />
      <ThemeSettingsPanel
        open={settingsOpen}
        currentTheme={config.theme.key}
        slug={localSubmission.slug}
        onClose={() => setSettingsOpen(false)}
        onSelect={handleThemeSelect}
      />

      <main>
        {modules.hero && (
          <HeroModule
            config={config}
            theme={config.theme}
            editMode={canEdit}
            editStatus={editStatus}
            onHeroTextChange={updateHeroText}
            onHeroImageUpload={uploadHeroImage}
          />
        )}
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

function withBrandingField(submission, field, value) {
  const payload = submission.payload || {};
  const nextBranding = {
    ...(payload.business_branding || {}),
    [field]: value,
  };

  return {
    ...submission,
    hero_image_url: field === 'hero_image_url' ? value : submission.hero_image_url,
    payload: {
      ...payload,
      business_branding: nextBranding,
    },
  };
}

function getFileExtension(file) {
  const fromName = file.name?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  return file.type.split('/')[1] || 'jpg';
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
