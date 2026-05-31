/**
 * Barrel de re-exports para todos os módulos da landing page.
 *
 * Cada módulo vive no seu próprio arquivo em src/landing/.
 * Este arquivo existe apenas para retrocompatibilidade com imports existentes
 * (ex.: PreviewPage.jsx usa `from '../landing/modules.jsx'`).
 */

export { CenteredState } from './CenteredState.jsx';
export { ConversionModule } from './ConversionModule.jsx';
export { FAQModule } from './FAQModule.jsx';
export { FinalCTAModule } from './FinalCTAModule.jsx';
export { EditorialHighlightModule } from './EditorialHighlightModule.jsx';
export { FooterModule } from './FooterModule.jsx';
export { GalleryModule } from './GalleryModule.jsx';
export { HeaderModule } from './HeaderModule.jsx';
export { HeroModule } from './HeroModule.jsx';
export { ScheduleModule } from './ScheduleModule.jsx';
export { ServicesModule } from './ServicesModule.jsx';
export { SignatureModule } from './SignatureModule.jsx';
export { TestimonialsModule } from './TestimonialsModule.jsx';
export { ThemeSettingsPanel } from './ThemeSettingsPanel.jsx';
export { TrustStatsModule } from './TrustStatsModule.jsx';

// ─── SimpleModule ─────────────────────────────────────────────────────────────
// Componente auxiliar de placeholder — pequeno demais para arquivo próprio.

export function SimpleModule({ type, config }) {
  const content = {
    testimonials: [
      'Depoimentos',
      'Experiências reais poderão ser ativadas quando houver dados cadastrados.',
    ],
    faq: ['FAQ', 'Perguntas frequentes poderão ser geradas e editadas no onboarding.'],
    gallery: ['Galeria', 'Imagens institucionais e bastidores poderão compor esta seção.'],
  }[type];

  if (!content) return null;

  return (
    <section className="bg-[var(--preview-bg)] py-20">
      <div className="section-shell">
        <div className="rounded-[var(--preview-radius)] border border-dashed border-[var(--preview-border)] bg-[var(--preview-card)] p-8 text-center">
          <p className="text-sm font-extrabold uppercase text-[var(--preview-primary)]">
            {config.preset.label}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold">{content[0]}</h2>
          <p className="mt-3 font-semibold text-[var(--preview-muted)]">{content[1]}</p>
        </div>
      </div>
    </section>
  );
}
