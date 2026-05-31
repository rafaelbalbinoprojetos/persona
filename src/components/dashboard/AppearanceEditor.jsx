import { Image } from 'lucide-react';
import { Input, Textarea } from './DashboardShared.jsx';
import { defaultEnabledModules } from '../../landing/presets.js';
import { themeTokens } from '../../landing/theme.js';

const moduleLabels = {
  hero: 'Hero',
  trustStats: 'Estatísticas de confiança',
  services: 'Serviços',
  editorialHighlight: 'Destaque editorial',
  schedule: 'Atendimento',
  testimonials: 'Depoimentos',
  faq: 'FAQ',
  gallery: 'Galeria',
  location: 'Localização',
  finalCta: 'CTA final',
  footer: 'Rodapé',
};

export function AppearanceEditor({
  draft,
  updateBusiness,
  updateBranding,
  updatePrimaryProfessional,
  updateEnabledModule,
}) {
  const business = draft.payload.businesses || {};
  const branding = draft.payload.business_branding || {};
  const primaryProfessional = draft.payload.professionals?.[0] || {};
  const enabledModules = {
    ...defaultEnabledModules,
    ...(draft.payload.enabledModules || draft.payload.enabled_modules || {}),
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Nome do negócio"
          value={business.name || ''}
          onChange={(value) => updateBusiness('name', value)}
        />
        <Input
          label="Nome do profissional"
          value={primaryProfessional.name || ''}
          onChange={(value) => updatePrimaryProfessional('name', value)}
        />
        <Input
          label="Especialidade do profissional"
          value={primaryProfessional.specialty || ''}
          onChange={(value) => updatePrimaryProfessional('specialty', value)}
        />
        <Input
          label="WhatsApp"
          value={business.whatsapp || ''}
          onChange={(value) => updateBusiness('whatsapp', value)}
        />
        <Input
          label="E-mail"
          value={business.email || ''}
          onChange={(value) => updateBusiness('email', value)}
        />
        <label className="rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4">
          <span className="mb-3 block text-xs font-bold uppercase text-[var(--preview-muted)]">Cor principal</span>
          <input
            type="color"
            value={branding.primary_color || '#1c8dff'}
            onChange={(event) => updateBranding('primary_color', event.target.value)}
            className="h-12 w-full cursor-pointer rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-surface)] p-2"
          />
        </label>
      </div>

      <label className="block rounded-3xl border border-[var(--preview-border)] bg-[var(--preview-card)] p-4">
        <span className="mb-3 block text-xs font-bold uppercase text-[var(--preview-muted)]">
          Tema recomendado / identidade visual
        </span>
        <select
          value={branding.theme_key || ''}
          onChange={(event) => updateBranding('theme_key', event.target.value)}
          className="w-full rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-surface)] px-4 py-3 text-sm font-bold text-[var(--preview-text)] outline-none focus:border-[var(--preview-primary)] focus:ring-4 focus:ring-[var(--preview-primary)]/15"
        >
          <option value="">Automático pelo nicho</option>
          {themeTokens.map((theme) => (
            <option key={theme.key} value={theme.key}>{theme.name}</option>
          ))}
        </select>
      </label>

      <Input
        label="Título da hero"
        value={branding.hero_title || ''}
        onChange={(value) => updateBranding('hero_title', value)}
      />
      <Textarea
        label="Subtítulo da hero"
        value={branding.hero_subtitle || ''}
        onChange={(value) => updateBranding('hero_subtitle', value)}
      />
      <Textarea
        label="Mini bio do profissional"
        value={primaryProfessional.bio || ''}
        onChange={(value) => updatePrimaryProfessional('bio', value)}
      />
      <Input
        label="URL da foto do profissional"
        value={primaryProfessional.photo_url || ''}
        onChange={(value) => updatePrimaryProfessional('photo_url', value)}
        icon={<Image size={18} />}
      />
      <Input
        label="URL da imagem principal"
        value={branding.hero_image_url || draft.hero_image_url || ''}
        onChange={(value) => updateBranding('hero_image_url', value)}
        icon={<Image size={18} />}
      />

      <div className="rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-card)] p-5">
        <h2 className="text-xl font-extrabold">Presença social</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-[var(--preview-muted)]">
          Esses links aparecem de forma premium na hero, CTA final e footer.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label="Instagram"
            value={business.instagram_url || ''}
            onChange={(value) => updateBusiness('instagram_url', value)}
            placeholder="@usuário ou URL"
          />
          <Input
            label="TikTok"
            value={business.tiktok_url || ''}
            onChange={(value) => updateBusiness('tiktok_url', value)}
            placeholder="@usuário ou URL"
          />
          <Input
            label="LinkedIn"
            value={business.linkedin_url || ''}
            onChange={(value) => updateBusiness('linkedin_url', value)}
            placeholder="https://linkedin.com/in/..."
          />
          <Input
            label="Facebook"
            value={business.facebook_url || ''}
            onChange={(value) => updateBusiness('facebook_url', value)}
            placeholder="https://facebook.com/..."
          />
          <Input
            label="YouTube"
            value={business.youtube_url || ''}
            onChange={(value) => updateBusiness('youtube_url', value)}
            placeholder="https://youtube.com/..."
          />
          <Input
            label="Site profissional"
            value={business.website_url || ''}
            onChange={(value) => updateBusiness('website_url', value)}
            placeholder="https://seudominio.com"
          />
        </div>
      </div>

      <div className="rounded-[2rem] border border-[var(--preview-border)] bg-[var(--preview-card)] p-5">
        <h2 className="text-xl font-extrabold">Módulos da landing</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-[var(--preview-muted)]">
          Ative apenas as seções que fazem sentido para este cliente.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(moduleLabels).map(([moduleKey, label]) => (
            <label
              key={moduleKey}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-surface)] p-4 text-sm font-extrabold text-[var(--preview-text)]"
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(enabledModules[moduleKey])}
                onChange={(event) => updateEnabledModule(moduleKey, event.target.checked)}
                className="h-5 w-5 accent-[var(--preview-primary)]"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
