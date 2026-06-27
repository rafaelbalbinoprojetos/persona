import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import { buildPageConfigFromOnboarding } from '../landing/pageConfig.js';
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

function PreviewLanding({ submission, isLive = true }) {
  const storedTheme = localStorage.getItem(`preview-theme:${submission.slug}`);
  const [localSubmission, setLocalSubmission] = useState(submission);
  const [session, setSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [themeKey, setThemeKey] = useState(storedTheme || '');
  const [editStatus, setEditStatus] = useState({ type: 'idle', message: '' });
  const config = useMemo(() => buildPageConfigFromOnboarding(localSubmission, themeKey), [localSubmission, themeKey]);
  const themeStyle = useMemo(() => themeToCssVars(config.theme), [config.theme]);
  const modules = config.enabledModules;
  const editorial = config.theme.key === 'dark-editorial';
  const canEdit = Boolean(session?.user?.id && localSubmission.owner_id && session.user.id === localSubmission.owner_id);

  // SEO dinâmico: atualiza título e meta tags para humanos e Google.
  // (Preview de link em redes sem JS é tratado pelo middleware.js na Vercel.)
  useEffect(() => {
    applyPageSeo(buildSeoFromConfig(config));
  }, [config]);

  useEffect(() => {
    let active = true;
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
    <div className="min-h-screen overflow-hidden bg-[var(--preview-bg)] text-[var(--preview-text)]" style={themeStyle}>
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

      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        accessToken={session?.access_token}
      />
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
            onProfessionalTextChange={updatePrimaryProfessionalText}
            onHeroImageUpload={uploadHeroImage}
          />
        )}
        {modules.trustStats && (editorial || config.trustStats.length > 0) && <TrustStatsModule config={config} theme={config.theme} />}
        {modules.services && (
          <ServicesModule
            config={config}
            theme={config.theme}
            editMode={canEdit}
            onServiceTextChange={updateServiceText}
            onServiceImageUpload={uploadServiceImage}
            onAddService={addVisualService}
            onRemoveService={removeVisualService}
          />
        )}
        {modules.services && (
          <SignatureModule
            config={config}
            theme={config.theme}
            editMode={canEdit}
            onProfessionalTextChange={updatePrimaryProfessionalText}
          />
        )}
        {modules.editorialHighlight && (editorial || config.editorialHighlight?.title) && <EditorialHighlightModule config={config} theme={config.theme} />}
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
        {modules.schedule && <ConversionModule config={config} theme={config.theme} editMode={canEdit} onEditContact={editContactField} />}
        {(modules.testimonials || canEdit) && <TestimonialsModule config={config} theme={config.theme} editMode={canEdit} />}
        {(modules.faq || canEdit) && <FAQModule config={config} theme={config.theme} />}
        {modules.finalCta && (
          <FinalCTAModule
            config={config}
            theme={config.theme}
            editMode={canEdit}
            onFinalCtaTextChange={updateFinalCtaText}
            onCtaImageUpload={uploadHeroImage}
          />
        )}
      </main>

      {modules.footer && <FooterModule config={config} theme={config.theme} editMode={canEdit} onEditContact={editContactField} onAddSocial={() => editContactField('instagram_url')} />}
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
          description: 'Descreva este serviço diretamente aqui.',
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
