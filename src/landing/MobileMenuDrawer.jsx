import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, CalendarCheck, Clock3, LogOut, MapPin, MessageCircle, Settings, X } from 'lucide-react';

const EASE = [0.32, 0.72, 0, 1];

const panel = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 } },
  exit: { x: '100%', transition: { duration: 0.32, ease: EASE } },
};

const list = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.12 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const item = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
  exit: { opacity: 0, x: 16, transition: { duration: 0.18 } },
};

const footer = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: 0.28 } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
};

/**
 * Gaveta lateral do menu mobile.
 * Diálogo modal acessível: trava o scroll, prende o foco, fecha com Esc,
 * toque no fundo ou ao escolher um link, e devolve o foco ao botão.
 * Todo o conteúdo vem da configuração do cliente (seções visíveis,
 * contato, horários e redes reais); itens sem dados não aparecem.
 */
export function MobileMenuDrawer({
  open,
  onClose,
  returnFocusRef,
  theme,
  businessName,
  logoUrl,
  navItems = [],
  cta,
  whatsappHref = '',
  address = '',
  hoursSummary = '',
  socialLinks = [],
  owner,
}) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const activeHref = useActiveSection(navItems, open);

  // Trava o scroll do fundo sem "pulo" de layout.
  useEffect(() => {
    if (!open) return undefined;
    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
    };
  }, [open]);

  // Esc fecha; Tab circula dentro da gaveta.
  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll('a[href], button:not([disabled])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Fecha sozinho se a tela crescer para o layout desktop.
  useEffect(() => {
    if (!open) return undefined;
    const media = window.matchMedia('(min-width: 1024px)');
    const onChange = (event) => { if (event.matches) onClose(); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [open, onClose]);

  function go(event, href) {
    // Fecha primeiro e rola depois, para a animação de saída não brigar
    // com o scroll travado.
    event.preventDefault();
    onClose();
    window.setTimeout(() => {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      }
    }, 280);
  }

  return (
    <AnimatePresence onExitComplete={() => returnFocusRef?.current?.focus()}>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="presentation">
          <motion.div
            className="absolute inset-0 bg-[#06111f]/45 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.3, ease: EASE } }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-[min(88vw,400px)] flex-col overflow-hidden bg-[var(--preview-surface)] text-[var(--preview-text)] shadow-[-24px_0_80px_rgba(6,17,31,0.28)]"
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 90 || info.velocity.x > 500) onClose();
            }}
          >
            {/* Filete de luz na cor da marca, na borda de entrada. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-px"
              style={{ background: `linear-gradient(180deg, transparent, ${theme.primary}, transparent)` }}
            />
            {/* Brilho sutil no topo. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.12] blur-3xl"
              style={{ backgroundColor: theme.primary }}
            />

            <div className="relative flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--preview-border)] px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                {logoUrl && <img src={logoUrl} alt="" className="h-8 w-8 object-contain" style={{ borderRadius: theme.radius }} />}
                <span className="landing-display truncate text-[15px] font-semibold tracking-tight">{businessName}</span>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="group grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--preview-border)] transition-colors hover:border-[var(--preview-text)]"
              >
                <X size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-90" />
              </button>
            </div>

            <nav aria-label="Seções da página" className="relative flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-6">
              {navItems.length > 0 && (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--preview-muted)]">Navegue</p>
                  <motion.ul className="mt-3" variants={list} initial="hidden" animate="visible" exit="exit">
                    {navItems.map((link, index) => {
                      const active = activeHref === link.href;
                      return (
                        <motion.li key={link.href} variants={item}>
                          <a
                            href={link.href}
                            onClick={(event) => go(event, link.href)}
                            aria-current={active ? 'location' : undefined}
                            className="group relative flex items-center gap-4 border-b border-[var(--preview-border)] py-[1.1rem]"
                          >
                            <span
                              className="w-6 font-mono text-[11px] tabular-nums transition-colors"
                              style={{ color: active ? theme.primary : 'var(--preview-muted)' }}
                            >
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span
                              className={`landing-display flex-1 text-[1.6rem] font-medium leading-none tracking-[-0.02em] transition-[color,transform] duration-300 group-hover:translate-x-1 ${
                                active ? '' : 'group-hover:text-[var(--preview-primary)]'
                              }`}
                              style={active ? { color: theme.primary } : undefined}
                            >
                              {link.label}
                            </span>
                            <ArrowUpRight
                              size={18}
                              aria-hidden="true"
                              className="text-[var(--preview-muted)] opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:opacity-100"
                            />
                            {active && (
                              <motion.span
                                layoutId="menu-active-indicator"
                                aria-hidden="true"
                                className="absolute bottom-[-1px] left-0 h-[2px] w-full origin-left"
                                style={{ backgroundColor: theme.primary }}
                              />
                            )}
                          </a>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </>
              )}

              {(address || hoursSummary) && (
                <motion.div variants={item} initial="hidden" animate="visible" exit="exit" className="mt-8 space-y-3 text-sm">
                  {hoursSummary && (
                    <p className="flex items-start gap-3 text-[var(--preview-text-soft)]">
                      <Clock3 size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--preview-primary)]" />
                      <span>{hoursSummary}</span>
                    </p>
                  )}
                  {address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-3 text-[var(--preview-text-soft)] transition-colors hover:text-[var(--preview-primary)]"
                    >
                      <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--preview-primary)]" />
                      <span>{address}<span className="sr-only"> (abre o mapa)</span></span>
                    </a>
                  )}
                </motion.div>
              )}

              {socialLinks.length > 0 && (
                <motion.div variants={item} initial="hidden" animate="visible" exit="exit" className="mt-6 flex flex-wrap gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${social.label} (abre em nova aba)`}
                      className="grid h-11 w-11 place-items-center rounded-full border border-[var(--preview-border)] text-[var(--preview-text-soft)] transition-colors hover:border-[var(--preview-primary)] hover:text-[var(--preview-primary)]"
                    >
                      <social.Icon size={17} aria-hidden="true" />
                    </a>
                  ))}
                </motion.div>
              )}

              {owner && (
                <motion.div variants={item} initial="hidden" animate="visible" exit="exit" className="mt-8 border-t border-dashed border-[var(--preview-border)] pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--preview-muted)]">Área do dono</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <a href={owner.agendaHref} className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--preview-border)] px-2 py-3 text-xs font-semibold">
                      <CalendarCheck size={18} aria-hidden="true" />
                      Agenda
                    </a>
                    <button type="button" onClick={() => { onClose(); owner.onOpenSettings?.(); }} className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--preview-border)] px-2 py-3 text-xs font-semibold">
                      <Settings size={18} aria-hidden="true" />
                      Tema
                    </button>
                    <button type="button" onClick={() => { onClose(); owner.onSignOut?.(); }} className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--preview-border)] px-2 py-3 text-xs font-semibold text-[var(--preview-muted)]">
                      <LogOut size={18} aria-hidden="true" />
                      Sair
                    </button>
                  </div>
                </motion.div>
              )}
            </nav>

            {(cta || whatsappHref) && (
              <motion.div
                variants={footer}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative shrink-0 border-t border-[var(--preview-border)] bg-[var(--preview-section)] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
              >
                <div className="flex gap-2">
                  {cta && (
                    <a
                      href={cta.href}
                      onClick={(event) => go(event, cta.href)}
                      className="group relative flex h-[3.25rem] flex-1 items-center justify-between overflow-hidden rounded-full pl-6 pr-2 text-[15px] font-semibold text-white"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {/* Reflexo que atravessa o botão ao abrir o menu. */}
                      <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-white/25"
                        initial={{ left: '-40%' }}
                        animate={{ left: '140%' }}
                        transition={{ duration: 1.1, delay: 0.55, ease: EASE }}
                      />
                      <span className="relative">{cta.label}</span>
                      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5">
                        <ArrowRight size={17} aria-hidden="true" />
                      </span>
                    </a>
                  )}
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Conversar no WhatsApp (abre em nova aba)"
                      className={`flex h-[3.25rem] items-center justify-center gap-2 rounded-full border border-[var(--preview-border)] bg-[var(--preview-surface)] text-sm font-semibold transition-colors hover:border-[#25D366] ${
                        cta ? 'w-[3.25rem]' : 'flex-1'
                      }`}
                    >
                      <MessageCircle size={19} aria-hidden="true" className="text-[#1da851]" />
                      {!cta && <span>WhatsApp</span>}
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Ícone de menu que se transforma em X (três linhas → duas cruzadas). */
export function MenuToggleIcon({ open }) {
  const line = 'absolute left-0 h-[1.5px] w-full rounded-full bg-current';
  return (
    <span aria-hidden="true" className="relative block h-3.5 w-5">
      <motion.span className={line} style={{ top: 0 }} animate={open ? { top: '50%', rotate: 45, y: '-50%' } : { top: 0, rotate: 0, y: 0 }} transition={{ duration: 0.3, ease: EASE }} />
      <motion.span className={line} style={{ top: '50%', y: '-50%' }} animate={{ opacity: open ? 0 : 1, scaleX: open ? 0.4 : 1 }} transition={{ duration: 0.2 }} />
      <motion.span className={`${line} origin-right`} style={{ bottom: 0, width: '70%', right: 0, left: 'auto' }} animate={open ? { bottom: '50%', rotate: -45, y: '50%', width: '100%' } : { bottom: 0, rotate: 0, y: 0, width: '70%' }} transition={{ duration: 0.3, ease: EASE }} />
    </span>
  );
}

/** Seção visível na tela, para destacar o link correspondente. */
function useActiveSection(navItems, enabled) {
  const [active, setActive] = useState('');
  useEffect(() => {
    if (!enabled) return undefined;
    const viewportMiddle = window.innerHeight * 0.4;
    let current = '';
    navItems.forEach((link) => {
      const el = document.querySelector(link.href);
      if (el && el.getBoundingClientRect().top <= viewportMiddle) current = link.href;
    });
    setActive(current);
    return undefined;
  }, [navItems, enabled]);
  return active;
}
