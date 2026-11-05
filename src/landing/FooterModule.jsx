import { getOpeningHours, getSocialLinks } from './landingUtils.js';
import { SmartContactList, SmartSocialLinks } from './EditablePrimitives.jsx';

/**
 * Rodapé montado só com dados reais: identidade, navegação das seções
 * visíveis, contato, endereço, horários (das regras de agenda) e redes.
 * Colunas sem conteúdo não são renderizadas.
 */
export function FooterModule({ config, theme, navItems = [], editMode = false, onEditContact, onAddSocial }) {
  const { business, branding, location } = config;
  const socialLinks = getSocialLinks(config);
  const hours = config.conversion?.calendarMode === 'date_range' ? [] : getOpeningHours(config.availability);
  const tagline = String(business.description || business.tagline || '').trim();
  const hasContact = [business.whatsapp, business.email, location.address].some((value) => String(value || '').trim());

  return (
    <footer className="border-t border-[var(--preview-border)] bg-[var(--preview-section)] pb-28 pt-14 sm:pb-12 sm:pt-16">
      <div className="section-shell">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="inline-flex items-center gap-3">
              {branding.logo_url && (
                <img src={branding.logo_url} alt="" loading="lazy" className="h-9 w-9 object-contain" style={{ borderRadius: theme.radius }} />
              )}
              <span className="landing-display text-lg font-semibold tracking-tight">{business.name}</span>
            </a>
            {tagline && <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--preview-muted)]">{tagline}</p>}
            {(socialLinks.length > 0 || editMode) && (
              <div className="mt-6">
                <SmartSocialLinks
                  links={socialLinks}
                  isOwner={editMode}
                  onAdd={onAddSocial}
                  renderLink={(social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-10 w-10 place-items-center rounded-full border border-[var(--preview-border)] text-[var(--preview-text-soft)] transition hover:border-[var(--preview-primary)] hover:text-[var(--preview-primary)]"
                      aria-label={`${social.label} (abre em nova aba)`}
                    >
                      <social.Icon size={17} aria-hidden="true" />
                    </a>
                  )}
                />
              </div>
            )}
          </div>

          {navItems.length > 0 && (
            <FooterColumn title="Navegação">
              <ul className="grid gap-2.5">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="text-sm text-[var(--preview-text-soft)] transition hover:text-[var(--preview-primary)]">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </FooterColumn>
          )}

          {(hasContact || editMode) && (
            <FooterColumn title="Contato">
              <div className="text-sm [&_.font-bold]:font-normal">
                <SmartContactList
                  whatsapp={business.whatsapp}
                  email={business.email}
                  address={location.address}
                  isOwner={editMode}
                  onEditField={onEditContact}
                />
              </div>
            </FooterColumn>
          )}

          {hours.length > 0 && (
            <FooterColumn title="Horários">
              <dl className="grid gap-2 text-sm">
                {hours.map((row) => (
                  <div key={row.label} className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-[var(--preview-text-soft)]">{row.label}</dt>
                    <dd className="tabular-nums text-[var(--preview-muted)]">{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </FooterColumn>
          )}
        </div>

        <div className="mt-12 border-t border-[var(--preview-border)] pt-6 text-xs text-[var(--preview-muted)]">
          © {new Date().getFullYear()} {business.name}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--preview-text)]">{title}</p>
      {children}
    </div>
  );
}
