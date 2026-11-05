import { useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { getHeaderCtaLabel } from '../landing/HeaderModule.jsx';
import { hasEditorialContent } from '../landing/EditorialHighlightModule.jsx';
import { hasTeamContent } from '../landing/SignatureModule.jsx';
import { normalizeFaqs } from '../landing/landingUtils.js';
import { buttonClass } from '../landing/theme.js';
import { buildPageConfigFromOnboarding, hasServiceName } from '../landing/pageConfig.js';
import { themeToCssVars } from '../landing/theme.js';
import { applyPageSeo, buildSeoFromConfig } from '../landing/seo.js';
import { SubscribeModal } from '../components/SubscribeModal.jsx';
import {
  CenteredState,
  ConversionModule,
  EditorialHighlightModule,
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
  TrustStatsModule,
} from '../landing/modules.jsx';

export default function PreviewPage() {
  const slug = normalizeSlug(window.location.pathname.replace('/preview/', '').replace(/\/$/, ''));
  const [submission, setSubmission] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  // Default true = "fail-open": se a checagem falhar, a página continua no ar.
  const [isLive, setIsLive] = useState(true);

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

      // Muro de publicação: pergunta ao backend se a página deve ficar no ar
      // (trial vigente ou assinatura ativa). Falha = mantém no ar (fail-open).
      try {
        const { data: liveData } = await supabase.rpc('page_is_live', { target_slug: slug });
        if (typeof liveData === 'boolean') setIsLive(liveData);
      } catch {
        // mantém isLive = true
      }

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

  return <PreviewLanding submission={submission} isLive={isLive} />;
}

export function PreviewLanding({ submission, isLive = true }) {
  const storedTheme = localStorage.getItem(`preview-theme:${submission.slug}`);
  const [localSubmission, setLocalSubmission] = useState(submission);
  const [session, setSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [account, setAccount] = useState(null);
  const [trialBarHidden, setTrialBarHidden] = useState(false);
  const [themeKey, setThemeKey] = useState(storedTheme || '');
  const [editStatus, setEditStatus] = useState({ type: 'idle', message: '' });
  const config = useMemo(() => buildPageConfigFromOnboarding(localSubmission, themeKey), [localSubmission, themeKey]);
  const themeStyle = useMemo(() => themeToCssVars(config.theme), [config.theme]);
  const modules = config.enabledModules;
  const canEdit = Boolean(session?.user?.id && localSubmission.owner_id && session.user.id === localSubmission.owner_id);
  const [testimonialsCount, setTestimonialsCount] = useState(0);

  // Visibilidade real de cada seção para o VISITANTE: módulo ativo + conteúdo
  // cadastrado. A navegação e as âncoras são derivadas daqui, então seções
  // ocultas nunca deixam links quebrados nem espaços vazios.
  const visible = useMemo(() => ({
    stats: Boolean(modules.trustStats) && config.trustStats.length > 0,
    services: Boolean(modules.services) && config.services.some(hasServiceName),
    team: Boolean(modules.services) && hasTeamContent(config),
    about: Boolean(modules.editorialHighlight) && hasEditorialContent(config),
    gallery: Boolean(modules.gallery) && config.gallery.some((item) => item?.image_url || item?.url),
    conversion: Boolean(modules.schedule),
    testimonials: Boolean(modules.testimonials) && testimonialsCount > 0,
    faq: Boolean(modules.faq) && normalizeFaqs(config.faqs).length > 0,
  }), [config, modules, testimonialsCount]);

  // Aponta direto para o calendário/formulário (não para o topo da seção,
  // onde ficam contato e localização).
  const bookingHref = visible.conversion ? '#agendar' : '';
  const whatsappDigits = String(config.business.whatsapp || localSubmission.whatsapp || '').replace(/\D/g, '');
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits.length <= 11 ? `55${whatsappDigits}` : whatsappDigits}`
    : '';
  const navItems = [
    visible.services && { href: '#servicos', label: config.preset.sectionLabels.services },
    visible.about && { href: '#sobre', label: 'Sobre' },
    visible.team && { href: '#equipe', label: config.preset.sectionLabels.professionals || 'Equipe' },
    visible.gallery && { href: '#galeria', label: 'Galeria' },
    visible.testimonials && { href: '#depoimentos', label: 'Depoimentos' },
    visible.faq && { href: '#faq', label: 'Dúvidas' },
  ].filter(Boolean);
  const heroPrimaryCta = bookingHref
    ? { href: bookingHref, label: config.branding.cta_primary_text || getHeaderCtaLabel(config.conversion) }
    : whatsappHref
      ? { href: whatsappHref, label: 'Falar no WhatsApp' }
      : null;
  const heroSecondaryCta = visible.services
    ? { href: '#servicos', label: `Ver ${String(config.preset.sectionLabels.services || 'serviços').toLowerCase()}` }
    : null;

  // SEO dinâmico: atualiza título e meta tags para humanos e Google.
  // (Preview de link em redes sem JS é tratado pelo middleware.js na Vercel.)
  useEffect(() => {
    applyPageSeo(buildSeoFromConfig(config));
  }, [config]);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setSessionChecked(true);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setSessionChecked(true);
      }
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

  // Busca a conta do dono (status do plano/trial) para mostrar o aviso de
  // assinatura. RLS permite que o dono leia apenas a própria conta.
  useEffect(() => {
    if (!canEdit || !session?.user?.id) return undefined;
    let active = true;
    supabase
      .from('accounts')
      .select('status, plan, trial_ends_at')
      .eq('owner_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setAccount(data);
      });
    return () => {
      active = false;
    };
  }, [canEdit, session?.user?.id]);

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

  async function updatePrimaryProfessionalText(field, value) {
    const cleanValue = String(value || '').trim();
    if (!cleanValue) return;
    const nextSubmission = withPrimaryProfessionalField(localSubmission, field, cleanValue);
    setLocalSubmission(nextSubmission);
    await saveSubmission(nextSubmission);
  }

  async function updateServiceText(index, field, value) {
    const cleanValue = String(value || '').trim();
    if (!cleanValue) return;
    const nextSubmission = withServiceField(localSubmission, index, field, cleanValue, config.services);
    setLocalSubmission(nextSubmission);
    await saveSubmission(nextSubmission);
  }

  async function updateGalleryText(index, field, value) {
    const cleanValue = String(value || '').trim();
    const nextSubmission = withGalleryField(localSubmission, index, field, cleanValue, config.gallery);
    setLocalSubmission(nextSubmission);
    await saveSubmission(nextSubmission);
  }

  async function updateFinalCtaText(field, value) {
    const cleanValue = String(value || '').trim();
    if (!cleanValue) return;
    const nextSubmission = withFinalCtaField(localSubmission, field, cleanValue);
    setLocalSubmission(nextSubmission);
    await saveSubmission(nextSubmission);
  }

  async function editContactField(field) {
    const labels = { whatsapp: 'WhatsApp com DDD', email: 'e-mail', address: 'endereço', instagram_url: 'Instagram ou URL da rede social' };
    const currentValue = field === 'address'
      ? config.location.address
      : config.business[field] || localSubmission[field] || '';
    const value = window.prompt(`Informe o ${labels[field] || field}:`, currentValue);
    if (value === null || !String(value).trim()) return;
    const nextSubmission = field === 'address'
      ? withLocationField(localSubmission, 'address', String(value).trim())
      : withBusinessField(localSubmission, field, String(value).trim());
    setLocalSubmission(nextSubmission);
    await saveSubmission(nextSubmission, 'Contato atualizado.');
  }

  async function uploadLandingImage(file, pathPrefix) {
    if (!file || !session?.user?.id) return;
    if (!file.type.startsWith('image/')) {
      setEditStatus({ type: 'error', message: 'Escolha um arquivo de imagem.' });
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditStatus({ type: 'error', message: 'Use uma imagem com até 5 MB.' });
      return null;
    }

    setEditStatus({ type: 'saving', message: 'Enviando imagem...' });
    const extension = getFileExtension(file);
    const path = `${session.user.id}/${localSubmission.slug}/${pathPrefix}-${Date.now()}.${extension}`;
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
      return null;
    }

    const { data } = supabase.storage.from('landing-assets').getPublicUrl(path);
    return data.publicUrl;
  }

  async function uploadHeroImage(file) {
    const previousImageUrl = getCurrentHeroImageUrl(localSubmission);
    const publicUrl = await uploadLandingImage(file, 'hero');
    if (!publicUrl) return;

    const nextSubmission = withBrandingField(localSubmission, 'hero_image_url', publicUrl);
    setLocalSubmission(nextSubmission);
    const saved = await saveSubmission(nextSubmission, 'Imagem atualizada.');
    if (saved) {
      await removePreviousLandingAsset(previousImageUrl, publicUrl, session.user.id);
    }
  }

  async function uploadLogo(file) {
    const previousImageUrl = localSubmission.payload?.business_branding?.logo_url || '';
    const publicUrl = await uploadLandingImage(file, 'logo');
    if (!publicUrl) return;

    const nextSubmission = withBrandingField(localSubmission, 'logo_url', publicUrl);
    setLocalSubmission(nextSubmission);
    const saved = await saveSubmission(nextSubmission, 'Logo atualizada.');
    if (saved) {
      await removePreviousLandingAsset(previousImageUrl, publicUrl, session.user.id);
    }
  }

  async function uploadServiceImage(index, file) {
    const previousImageUrl = getServiceImageUrl(localSubmission, index, config.services);
    const publicUrl = await uploadLandingImage(file, `service-${index + 1}`);
    if (!publicUrl) return;

    const nextSubmission = withServiceField(localSubmission, index, 'image_url', publicUrl, config.services);
    setLocalSubmission(nextSubmission);
    const saved = await saveSubmission(nextSubmission, 'Imagem do serviço atualizada.');
    if (saved) {
      await removePreviousLandingAsset(previousImageUrl, publicUrl, session.user.id);
    }
  }

  async function uploadGalleryImage(index, file) {
    const previousImageUrl = getGalleryImageUrl(localSubmission, index, config.gallery);
    const publicUrl = await uploadLandingImage(file, `gallery-${index + 1}`);
    if (!publicUrl) return;

    const nextSubmission = withGalleryField(localSubmission, index, 'image_url', publicUrl, config.gallery);
    setLocalSubmission(nextSubmission);
    const saved = await saveSubmission(nextSubmission, 'Imagem da galeria atualizada.');
    if (saved) {
      await removePreviousLandingAsset(previousImageUrl, publicUrl, session.user.id);
    }
  }

  async function addVisualService() {
    const nextSubmission = withNewService(localSubmission, config.services);
    const newServiceIndex = (nextSubmission.payload.services || []).length - 1;
    setLocalSubmission(nextSubmission);
    window.setTimeout(() => {
      document
        .querySelector(`[data-service-index="${newServiceIndex}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    await saveSubmission(nextSubmission, 'Novo serviço criado.');
  }

  async function removeVisualService(index) {
    if (!window.confirm('Excluir este serviço? Esta ação também removerá a imagem dele do Storage.')) return;

    const previousImageUrl = getServiceImageUrl(localSubmission, index, config.services);
    const nextSubmission = withoutService(localSubmission, index, config.services);
    setLocalSubmission(nextSubmission);
    const saved = await saveSubmission(nextSubmission, 'Serviço excluído.');
    if (saved) {
      await removePreviousLandingAsset(previousImageUrl, '', session.user.id);
    }
  }

  async function removeGalleryItem(index) {
    if (!window.confirm('Excluir esta imagem da galeria? Esta ação também removerá o arquivo do Storage.')) return;

    const previousImageUrl = getGalleryImageUrl(localSubmission, index, config.gallery);
    const nextSubmission = withoutGalleryItem(localSubmission, index, config.gallery);
    setLocalSubmission(nextSubmission);
    const saved = await saveSubmission(nextSubmission, 'Imagem da galeria excluída.');
    if (saved) {
      await removePreviousLandingAsset(previousImageUrl, '', session.user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  // Dias restantes do período de teste (para o aviso ao dono).
  const trialDaysLeft = account?.trial_ends_at
    ? Math.ceil((new Date(account.trial_ends_at).getTime() - Date.now()) / 86400000)
    : null;
  const isTrialing = Boolean(
    account && account.status === 'trialing' && trialDaysLeft !== null && trialDaysLeft > 0,
  );

  // Muro de publicação: quando a página não está "no ar" (trial expirado e
  // sem assinatura), visitantes veem um aviso e o dono vê a página com um
  // banner para assinar. Espera a sessão ser verificada para não piscar a
  // tela errada para o dono.
  if (!isLive) {
    if (!sessionChecked) {
      return <CenteredState title="Carregando" description="Verificando a disponibilidade da página." />;
    }
    if (!canEdit) {
      return (
        <CenteredState
          title="Página temporariamente indisponível"
          description="Esta página não está publicada no momento. Tente novamente mais tarde."
        />
      );
    }
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="landing-root min-h-screen overflow-x-clip bg-[var(--preview-bg)] text-[var(--preview-text)] antialiased" style={themeStyle}>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      {!isLive && canEdit && (
        <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-wrap items-center justify-center gap-3 bg-amber-500 px-4 py-3 text-center text-sm font-bold text-amber-950 shadow-[0_-6px_24px_rgba(0,0,0,0.18)]">
          <span>Seu período de teste terminou — sua página está fora do ar para visitantes.</span>
          <button
            type="button"
            onClick={() => setSubscribeOpen(true)}
            className="rounded-full bg-amber-950 px-4 py-1.5 font-extrabold text-amber-50"
          >
            Assinar para publicar
          </button>
        </div>
      )}

      {isLive && canEdit && isTrialing && !trialBarHidden && (
        <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-wrap items-center justify-center gap-3 bg-violet-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow-[0_-6px_24px_rgba(0,0,0,0.18)]">
          <span>
            Período de teste: {trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}.
          </span>
          <button
            type="button"
            onClick={() => setSubscribeOpen(true)}
            className="rounded-full bg-white px-4 py-1.5 font-extrabold text-violet-700"
          >
            Assinar agora
          </button>
          <button
            type="button"
            onClick={() => setTrialBarHidden(true)}
            aria-label="Fechar aviso"
            className="ml-1 text-lg leading-none text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        accessToken={session?.access_token}
      />
      <HeaderModule
        config={config}
        theme={config.theme}
        navItems={navItems}
        ctaHref={bookingHref}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={signOut}
        onLogoUpload={uploadLogo}
        canEdit={canEdit}
      />
      <ThemeSettingsPanel
        open={settingsOpen}
        currentTheme={config.theme.key}
        slug={localSubmission.slug}
        onClose={() => setSettingsOpen(false)}
        onSelect={handleThemeSelect}
      />

      <main id="conteudo" tabIndex={-1} className="outline-none">
        {modules.hero && (
          <HeroModule
            config={config}
            theme={config.theme}
            editMode={canEdit}
            editStatus={editStatus}
            primaryCta={heroPrimaryCta}
            secondaryCta={heroSecondaryCta}
            onHeroTextChange={updateHeroText}
            onProfessionalTextChange={updatePrimaryProfessionalText}
            onHeroImageUpload={uploadHeroImage}
          />
        )}
        {visible.stats && <TrustStatsModule config={config} theme={config.theme} />}
        {modules.services && (
          <ServicesModule
            config={config}
            theme={config.theme}
            editMode={canEdit}
            bookingHref={bookingHref}
            onServiceTextChange={updateServiceText}
            onServiceImageUpload={uploadServiceImage}
            onAddService={addVisualService}
            onRemoveService={removeVisualService}
          />
        )}
        {visible.about && <EditorialHighlightModule config={config} theme={config.theme} />}
        {modules.services && (
          <SignatureModule
            config={config}
            theme={config.theme}
            editMode={canEdit}
            onProfessionalTextChange={updatePrimaryProfessionalText}
          />
        )}
        {(modules.gallery || canEdit) && (
          <GalleryModule
            config={config}
            theme={config.theme}
            editMode={canEdit}
            onGalleryTextChange={updateGalleryText}
            onGalleryImageUpload={uploadGalleryImage}
            onRemoveGalleryItem={removeGalleryItem}
          />
        )}
        {(modules.testimonials || canEdit) && (
          <TestimonialsModule config={config} theme={config.theme} editMode={canEdit} onCountChange={setTestimonialsCount} />
        )}
        {modules.schedule && <ConversionModule config={config} theme={config.theme} editMode={canEdit} onEditContact={editContactField} />}
        {(modules.faq || canEdit) && <FAQModule config={config} theme={config.theme} editMode={canEdit} />}
        {modules.finalCta && (
          <FinalCTAModule
            config={config}
            theme={config.theme}
            editMode={canEdit}
            ctaHref={bookingHref}
            onFinalCtaTextChange={updateFinalCtaText}
          />
        )}
      </main>

      {modules.footer && (
        <FooterModule
          config={config}
          theme={config.theme}
          navItems={navItems}
          editMode={canEdit}
          onEditContact={editContactField}
          onAddSocial={() => editContactField('instagram_url')}
        />
      )}

      {bookingHref && !(canEdit && (!isLive || (isTrialing && !trialBarHidden))) && (
        <MobileBookingBar theme={config.theme} href={bookingHref} label={heroPrimaryCta?.label || getHeaderCtaLabel(config.conversion)} />
      )}
    </div>
    </MotionConfig>
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

function withBusinessField(submission, field, value) {
  const payload = submission.payload || {};
  return {
    ...submission,
    [field]: value,
    payload: {
      ...payload,
      businesses: { ...(payload.businesses || {}), [field]: value },
    },
  };
}

function withLocationField(submission, field, value) {
  const payload = submission.payload || {};
  return {
    ...submission,
    payload: {
      ...payload,
      business_locations: { ...(payload.business_locations || {}), [field]: value },
    },
  };
}

function getCurrentHeroImageUrl(submission) {
  return submission.payload?.business_branding?.hero_image_url || submission.hero_image_url || '';
}

function getServiceImageUrl(submission, index, fallbackServices = []) {
  const services = Array.isArray(submission.payload?.services) && submission.payload.services.length
    ? submission.payload.services
    : fallbackServices;
  return services[index]?.image_url || '';
}

function getGalleryImageUrl(submission, index, fallbackGallery = []) {
  const gallery = Array.isArray(submission.payload?.gallery) && submission.payload.gallery.length
    ? submission.payload.gallery
    : fallbackGallery;
  return gallery[index]?.image_url || gallery[index]?.url || '';
}

async function removePreviousLandingAsset(previousUrl, nextUrl, userId) {
  const previousPath = getLandingAssetPath(previousUrl, userId);
  const nextPath = getLandingAssetPath(nextUrl, userId);
  if (!previousPath || previousPath === nextPath) return;

  await supabase.storage.from('landing-assets').remove([previousPath]);
}

function getLandingAssetPath(fileUrl, userId) {
  if (!fileUrl || !userId) return '';

  try {
    const url = new URL(fileUrl);
    const marker = '/storage/v1/object/public/landing-assets/';
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return '';

    const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    return path.startsWith(`${userId}/`) ? path : '';
  } catch {
    return '';
  }
}

function withPrimaryProfessionalField(submission, field, value) {
  const payload = submission.payload || {};
  const professionals = Array.isArray(payload.professionals) ? payload.professionals : [];
  const first = professionals[0] || {
    name: payload.businesses?.name || submission.business_name || '',
    specialty: payload.businesses?.segment || submission.segment || '',
    bio: '',
    photo_url: '',
  };

  return {
    ...submission,
    payload: {
      ...payload,
      professionals: [{ ...first, [field]: value }, ...professionals.slice(1)],
    },
  };
}

function withServiceField(submission, index, field, value, fallbackServices = []) {
  const payload = submission.payload || {};
  const currentServices = Array.isArray(payload.services) && payload.services.length
    ? payload.services
    : fallbackServices;

  return {
    ...submission,
    payload: {
      ...payload,
      services: currentServices.map((service, itemIndex) =>
        itemIndex === index ? { ...service, [field]: value } : service,
      ),
    },
  };
}

function withGalleryField(submission, index, field, value, fallbackGallery = []) {
  const payload = submission.payload || {};
  const gallery = Array.isArray(payload.gallery) && payload.gallery.length
    ? payload.gallery
    : normalizeEditableGallery(fallbackGallery);
  const nextGallery = ensureGallerySlot(gallery, index).map((item, itemIndex) =>
    itemIndex === index ? { ...item, [field]: value } : item,
  );

  return {
    ...submission,
    payload: {
      ...payload,
      enabledModules: {
        ...payload.enabledModules,
        gallery: true,
      },
      gallery: nextGallery,
    },
  };
}

function withNewService(submission, fallbackServices = []) {
  const payload = submission.payload || {};
  const services = Array.isArray(payload.services) && payload.services.length
    ? payload.services
    : fallbackServices;

  return {
    ...submission,
    payload: {
      ...payload,
      services: [
        ...services,
        {
          name: 'Novo serviço',
          description: '',
          duration: 30,
          price: '',
          image_url: '',
        },
      ],
    },
  };
}

function withoutGalleryItem(submission, index, fallbackGallery = []) {
  const payload = submission.payload || {};
  const gallery = Array.isArray(payload.gallery) && payload.gallery.length
    ? payload.gallery
    : normalizeEditableGallery(fallbackGallery);

  return {
    ...submission,
    payload: {
      ...payload,
      gallery: gallery.filter((_, itemIndex) => itemIndex !== index),
    },
  };
}

function withoutService(submission, index, fallbackServices = []) {
  const payload = submission.payload || {};
  const services = Array.isArray(payload.services) && payload.services.length
    ? payload.services
    : fallbackServices;

  return {
    ...submission,
    payload: {
      ...payload,
      services: services.filter((_, itemIndex) => itemIndex !== index),
    },
  };
}

function normalizeEditableGallery(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    title: item.title || '',
    description: item.description || '',
    image_url: item.image_url || item.url || '',
  }));
}

function ensureGallerySlot(gallery, index) {
  const nextGallery = [...gallery];
  while (nextGallery.length <= index) {
    nextGallery.push({
      title: '',
      description: '',
      image_url: '',
    });
  }
  return nextGallery;
}

function withFinalCtaField(submission, field, value) {
  const payload = submission.payload || {};

  return {
    ...submission,
    payload: {
      ...payload,
      finalCta: {
        ...(payload.finalCta || payload.final_cta || {}),
        [field]: value,
      },
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

/**
 * Ação de agendamento fixa no celular. Aparece depois do Hero e some
 * quando a própria seção de agenda está na tela, para não cobrir o
 * formulário. Em telas ≥ sm o botão do cabeçalho já cumpre esse papel.
 */
function MobileBookingBar({ theme, href, label }) {
  const [pastHero, setPastHero] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const target = document.querySelector(href);
    if (!target || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setTargetVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [href]);

  const show = pastHero && !targetVisible;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--preview-border)] bg-[var(--preview-surface)]/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 sm:hidden ${
        show ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
      aria-hidden={!show}
    >
      <a
        href={href}
        tabIndex={show ? 0 : -1}
        className={buttonClass(theme, 'h-12 w-full')}
        style={theme.buttonStyle === 'outline' ? undefined : { backgroundColor: theme.primary }}
      >
        <CalendarDays size={18} aria-hidden="true" />
        {label}
      </a>
    </div>
  );
}
