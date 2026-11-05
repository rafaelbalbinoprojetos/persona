import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarCheck, ImagePlus, LogOut, Settings } from 'lucide-react';
import { buttonClass } from './theme.js';
import { getOpeningHours, getSocialLinks } from './landingUtils.js';
import { MenuToggleIcon, MobileMenuDrawer } from './MobileMenuDrawer.jsx';

/**
 * Cabeçalho da landing.
 * - `navItems` vem da página e reflete apenas as seções realmente visíveis.
 * - `ctaHref` só existe quando há fluxo de conversão ativo.
 * - No mobile, o menu abre uma gaveta lateral (MobileMenuDrawer).
 */
export function HeaderModule({
  config,
  theme,
  navItems = [],
  ctaHref = '',
  onOpenSettings,
  onSignOut,
  onLogoUpload,
  canEdit = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef(null);
  const { business, branding, conversion, location } = config;
  const ctaLabel = getHeaderCtaLabel(conversion);
  const slug = config.submission?.slug || '';
  const solidButton = theme.buttonStyle === 'outline' ? undefined : { backgroundColor: theme.primary };
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const whatsappDigits = String(business.whatsapp || config.submission?.whatsapp || '').replace(/\D/g, '');
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits.length <= 11 ? `55${whatsappDigits}` : whatsappDigits}` : '';
  const hours = conversion?.calendarMode === 'date_range' ? [] : getOpeningHours(config.availability);
  const hoursSummary = hours.map((row) => `${row.label} · ${row.hours}`).join('  ·  ');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          scrolled
            ? 'border-[var(--preview-border)] bg-[var(--preview-surface)]/95 backdrop-blur-md'
            : 'border-transparent bg-[var(--preview-surface)]/80 backdrop-blur-sm'
        }`}
      >
        <nav aria-label="Principal" className="section-shell flex h-16 items-center justify-between gap-2 sm:gap-4 lg:h-[4.5rem]">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <div className="relative shrink-0">
              <a href="#top" aria-label={`${business.name} — início`} className="block">
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt="" className="h-9 w-9 object-contain" style={{ borderRadius: theme.radius }} />
                ) : (
                  <BrandMonogram name={business.name} theme={theme} />
                )}
              </a>
              {canEdit && (
                <label
                  className="absolute -bottom-1.5 -right-1.5 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-white/25 bg-black/60 text-white transition hover:bg-black/80"
                  title="Trocar logo"
                >
                  <ImagePlus size={12} aria-hidden="true" />
                  <span className="sr-only">Trocar logo</span>
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
            <a href="#top" className="min-w-0 truncate text-[15px] font-semibold tracking-tight sm:text-lg">
              {business.name}
            </a>
          </div>

          {navItems.length > 0 && (
            <ul className="hidden items-center gap-7 lg:flex">
              {navItems.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-[var(--preview-text-soft)] transition-colors hover:text-[var(--preview-primary)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {ctaHref && (
              <a
                href={ctaHref}
                className={buttonClass(theme, 'h-10 shrink-0 whitespace-nowrap px-4 py-0 text-[13px] sm:px-5 sm:text-sm')}
                style={solidButton}
              >
                <span className="sm:hidden">{getShortCtaLabel(conversion)}</span>
                <span className="hidden sm:inline">{ctaLabel}</span>
              </a>
            )}
            {canEdit && (
              <div className="hidden items-center gap-1 lg:flex">
                <OwnerIconLink href={`/agenda?slug=${encodeURIComponent(slug)}`} label="Agenda e reservas">
                  <CalendarCheck size={18} aria-hidden="true" />
                </OwnerIconLink>
                <OwnerIconButton onClick={onOpenSettings} label="Configurações de tema">
                  <Settings size={18} aria-hidden="true" />
                </OwnerIconButton>
                <OwnerIconButton onClick={onSignOut} label="Sair da conta">
                  <LogOut size={18} aria-hidden="true" />
                </OwnerIconButton>
              </div>
            )}

            {(navItems.length > 0 || canEdit || ctaHref || whatsappHref) && (
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--preview-text)] transition hover:bg-[var(--preview-card)] lg:hidden"
                aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
              >
                <MenuToggleIcon open={menuOpen} />
              </button>
            )}
          </div>
        </nav>
      </header>

      <MobileMenuDrawer
        open={menuOpen}
        onClose={closeMenu}
        returnFocusRef={menuButtonRef}
        theme={theme}
        businessName={business.name}
        logoUrl={branding.logo_url}
        navItems={navItems}
        cta={ctaHref ? { href: ctaHref, label: ctaLabel } : null}
        whatsappHref={whatsappHref}
        address={location?.address || ''}
        hoursSummary={hoursSummary}
        socialLinks={getSocialLinks(config)}
        owner={canEdit ? { agendaHref: `/agenda?slug=${encodeURIComponent(slug)}`, onOpenSettings, onSignOut } : null}
      />
    </>
  );
}

function BrandMonogram({ name, theme }) {
  const initials = String(name || '')
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 2 || /^[A-ZÀ-Ú]/.test(part))
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '•';

  return (
    <span
      aria-hidden="true"
      className="landing-display grid h-9 w-9 place-items-center text-sm font-semibold text-white"
      style={{ backgroundColor: theme.secondary || theme.primary, borderRadius: theme.radius }}
    >
      {initials}
    </span>
  );
}

function OwnerIconLink({ href, label, children }) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-lg text-[var(--preview-text-soft)] transition hover:bg-[var(--preview-card)] hover:text-[var(--preview-text)]"
    >
      {children}
    </a>
  );
}

function OwnerIconButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-lg text-[var(--preview-text-soft)] transition hover:bg-[var(--preview-card)] hover:text-[var(--preview-text)]"
    >
      {children}
    </button>
  );
}

/** Rótulo curto (uma palavra) para o botão do cabeçalho em telas estreitas. */
function getShortCtaLabel(conversion) {
  if (conversion?.calendarMode === 'date_range') return 'Reservar';
  return { appointment: 'Agendar', consultation: 'Consulta', request: 'Orçamento', lead: 'Contato' }[conversion?.mode || 'appointment'] || 'Agendar';
}

export function getHeaderCtaLabel(conversion) {
  const mode = conversion?.mode || 'appointment';
  if (conversion?.calendarMode === 'date_range') return 'Reservar';
  return {
    appointment: 'Agendar',
    consultation: 'Solicitar consulta',
    request: 'Solicitar orçamento',
    lead: 'Fale conosco',
  }[mode] || 'Agendar';
}
