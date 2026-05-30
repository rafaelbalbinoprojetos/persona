import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getFeaturedProfessional, getFooterCopy, getSocialLinks } from './landingUtils.js';

export function FooterModule({ config, theme }) {
  const { business, services } = config;
  const professional = getFeaturedProfessional(config);
  const socialLinks = getSocialLinks(config);
  const copy = getFooterCopy(config);

  const navItems = [
    { label: copy.exploreServicesLabel, href: '#servicos' },
    { label: 'Galeria', href: '#galeria' },
    { label: config.preset.sectionLabels.schedule, href: '#agenda' },
    { label: 'Depoimentos', href: '#depoimentos' },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-[var(--preview-border)] bg-[var(--preview-bg)] py-20">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--preview-primary)]/50 to-transparent" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[var(--preview-primary)]/10 blur-3xl" />

      <div className="section-shell">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          {/* ── Identidade ── */}
          <div>
            <a href="#top" className="inline-flex items-center gap-3">
              <span
                className="grid h-12 w-12 place-items-center text-white shadow-[var(--preview-glow)]"
                style={{ backgroundColor: theme.primary, borderRadius: theme.radius }}
              >
                <Sparkles size={22} />
              </span>
              <span className="text-xl font-black">{professional.name || business.name}</span>
            </a>
            <p className="mt-6 max-w-sm text-base font-semibold leading-8 text-[var(--preview-muted)]">
              {copy.description}
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <SocialIconLink key={social.label} social={social} />
                ))}
              </div>
            )}
          </div>

          {/* ── Colunas de navegação ── */}
          <FooterColumn title="Explorar" items={navItems} />
          <FooterColumn
            title={copy.servicesTitle}
            items={(services || []).slice(0, 4).map((service) => ({
              label: service.name,
              href: '#servicos',
            }))}
          />

          {/* ── Contato ── */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--preview-primary)]">
              Contato
            </p>
            <div className="mt-5 space-y-3 text-sm font-semibold leading-7 text-[var(--preview-muted)]">
              {business.whatsapp && <p>{business.whatsapp}</p>}
              {business.email && <p>{business.email}</p>}
              <p>{copy.contactFallback}</p>
            </div>
          </div>
        </div>

        {/* ── Rodapé inferior ── */}
        <div className="mt-16 flex flex-col gap-4 border-t border-[var(--preview-border)] pt-8 text-sm font-semibold text-[var(--preview-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {professional.name || business.name}. Todos os direitos
            reservados.
          </p>
          <p>Design, presença e experiência em uma única plataforma.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FooterColumn({ title, items }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--preview-primary)]">
        {title}
      </p>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <a
            key={`${title}-${item.label}`}
            href={item.href}
            className="text-sm font-semibold text-[var(--preview-muted)] transition hover:translate-x-1 hover:text-[var(--preview-text)]"
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function SocialIconLink({ social }) {
  return (
    <motion.a
      href={social.href}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -4, scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      className="grid h-12 w-12 place-items-center rounded-full border border-[var(--preview-border)] bg-[var(--preview-surface)]/70 text-[var(--preview-text)] shadow-sm backdrop-blur-xl transition hover:text-[var(--preview-primary)] hover:shadow-[var(--preview-glow)]"
      aria-label={social.label}
    >
      <social.Icon size={19} />
    </motion.a>
  );
}
