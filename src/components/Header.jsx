import { CalendarDays, Menu, Smile } from 'lucide-react';
import { clinic, navItems } from '../data/landingData.js';

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-white/85 backdrop-blur-xl">
      <nav className="section-shell flex h-20 items-center justify-between">
        <a href="#top" className="flex items-center gap-3" aria-label="Inicio SorrisoPro">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
            <Smile size={24} />
          </span>
          <span className="text-xl font-extrabold text-brand-900">{clinic.name}</span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 transition hover:text-brand-600">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a href="#agenda" className="pill-button hidden bg-brand-600 text-white shadow-glow hover:-translate-y-0.5 hover:bg-brand-700 sm:inline-flex">
            <CalendarDays size={18} />
            Agendar consulta
          </a>
          <button className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-brand-900 lg:hidden" aria-label="Abrir menu">
            <Menu size={22} />
          </button>
        </div>
      </nav>
    </header>
  );
}
