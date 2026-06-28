import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, ClipboardCheck, ImagePlus, LogOut, Menu, Settings, Sparkles, X } from 'lucide-react';
import { buttonClass } from './theme.js';

const panelVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1], when: 'beforeChildren', staggerChildren: 0.05 },
  },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0 },
};

export function HeaderModule({ config, theme, onOpenSettings, onSignOut, onLogoUpload, canEdit = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { business, branding, preset, conversion } = config;
  const Icon = preset.Icon || Sparkles;
  const conversionLabel = conversion?.mode === 'appointment' ? preset.sectionLabels.schedule : getConversionLabel(conversion?.mode);
  const ctaLabel = conversion?.buttonLabel || conversionLabel;
  const slug = config.submission?.slug || '';

  const navLinks = [
    { href: '#servicos', label: preset.sectionLabels.services },
    { href: '#galeria', label: 'Galeria' },
    { href: '#agenda', label: conversionLabel },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--preview-border)] bg-[var(--preview-surface)]/90 backdrop-blur-xl">
      <nav className="section-shell relative z-50 flex h-20 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <a href="#top" aria-label={business.name}>
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt={business.name}
                  className="h-11 w-11 object-cover shadow-[var(--preview-glow)]"
                  style={{ borderRadius: theme.radius }}
                />
              ) : (
                <span
                  className="grid h-11 w-11 place-items-center text-white shadow-[var(--preview-glow)]"
                  style={{ backgroundColor: theme.primary, borderRadius: theme.radius }}
                >
                  <Icon size={23} />
                </span>
              )}
            </a>
            {canEdit && (
              <label
                className="absolute -bottom-1.5 -right-1.5 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-white/25 bg-black/60 text-white transition hover:bg-black/80"
                aria-label="Trocar logo"
              >
                <ImagePlus size={12} />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onLogoUpload?.(file);
                    event.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
          <a href="#top" className="truncate text-lg font-extrabold sm:text-xl">{business.name}</a>
        </div>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-semibold text-[var(--preview-muted)] hover:text-[var(--preview-primary)]">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="#agenda"
              className={buttonClass(theme, 'h-11 shrink-0 px-5 py-0')}
              style={theme.buttonStyle === 'outline' ? undefined : { backgroundColor: theme.primary }}
              aria-label={ctaLabel}
            >
              <ClipboardCheck size={18} />
              <span>{ctaLabel}</span>
            </a>
            {canEdit && (
              <>
                <a
                  href={`/agenda?slug=${encodeURIComponent(slug)}`}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] px-4 text-sm font-bold text-[var(--preview-text)] transition hover:-translate-y-0.5"
                  aria-label="Agenda e reservas"
                >
                  <CalendarCheck size={18} />
                  <span>Agenda</span>
                </a>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] text-[var(--preview-text)] transition hover:-translate-y-0.5"
                  aria-label="Abrir configurações de tema"
                >
                  <Settings size={20} />
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] text-[var(--preview-muted)] transition hover:-translate-y-0.5 hover:text-[var(--preview-text)]"
                  aria-label="Sair da conta"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--preview-border)] bg-[var(--preview-card)] text-[var(--preview-text)] transition hover:-translate-y-0.5 lg:hidden"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              onClick={closeMenu}
              className="fixed inset-0 z-40 cursor-default bg-black/20 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-50 overflow-hidden border-t border-[var(--preview-border)] bg-[var(--preview-surface)] lg:hidden"
            >
              <div className="section-shell flex flex-col gap-1 py-4">
                {navLinks.map((link) => (
                  <motion.a
                    key={link.href}
                    variants={itemVariants}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-2xl px-3 py-3 text-base font-bold text-[var(--preview-text)] transition hover:bg-[var(--preview-card)]"
                  >
                    {link.label}
                  </motion.a>
                ))}

                <motion.a
                  variants={itemVariants}
                  href="#agenda"
                  onClick={closeMenu}
                  className={buttonClass(theme, 'mt-2 h-12 w-full')}
                  style={theme.buttonStyle === 'outline' ? undefined : { backgroundColor: theme.primary }}
                >
                  <ClipboardCheck size={18} />
                  <span>{ctaLabel}</span>
                </motion.a>

                {canEdit && (
                  <motion.div variants={itemVariants} className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--preview-border)] pt-3">
                    <a
                      href={`/agenda?slug=${encodeURIComponent(slug)}`}
                      onClick={closeMenu}
                      className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-card)] px-2 py-3 text-xs font-bold text-[var(--preview-text)]"
                    >
                      <CalendarCheck size={20} />
                      Agenda
                    </a>
                    <button
                      type="button"
                      onClick={() => { closeMenu(); onOpenSettings?.(); }}
                      className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-card)] px-2 py-3 text-xs font-bold text-[var(--preview-text)]"
                    >
                      <Settings size={20} />
                      Configurar
                    </button>
                    <button
                      type="button"
                      onClick={() => { closeMenu(); onSignOut?.(); }}
                      className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-card)] px-2 py-3 text-xs font-bold text-[var(--preview-muted)]"
                    >
                      <LogOut size={18} />
                      Sair
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function getConversionLabel(mode) {
  return {
    appointment: 'Agenda online',
    request: 'Solicitação',
    consultation: 'Consultoria',
    lead: 'Contato',
  }[mode] || 'Atendimento';
}
