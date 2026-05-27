import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Smile } from 'lucide-react';
import { clinic, navItems, services } from '../data/landingData.js';

const socialIcons = {
  Instagram,
  LinkedIn: Linkedin,
  Facebook,
};

export default function Footer() {
  return (
    <footer className="bg-white py-14">
      <div className="section-shell">
        <div className="grid gap-10 border-t border-slate-100 pt-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <a href="#top" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white">
                <Smile size={23} />
              </span>
              <span className="text-xl font-extrabold text-brand-900">{clinic.name}</span>
            </a>
            <p className="mt-5 max-w-sm leading-7 text-slate-600">{clinic.tagline}</p>
            <div className="mt-6 flex gap-3">
              {clinic.socials.map((social) => {
                const Icon = socialIcons[social];
                return (
                  <a key={social} href="#top" aria-label={social} className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600 transition hover:bg-brand-600 hover:text-white">
                    <Icon size={19} />
                  </a>
                );
              })}
            </div>
          </div>

          <FooterColumn title="Menu">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </FooterColumn>

          <FooterColumn title="Serviços">
            {services.slice(0, 4).map((service) => (
              <a key={service.title} href="#servicos">{service.title}</a>
            ))}
          </FooterColumn>

          <div>
            <h3 className="font-extrabold text-brand-900">Contato</h3>
            <div className="mt-5 space-y-4 text-sm font-semibold leading-6 text-slate-600">
              <Contact icon={<Phone size={18} />} text={clinic.whatsapp} />
              <Contact icon={<Mail size={18} />} text={clinic.email} />
              <Contact icon={<MapPin size={18} />} text={clinic.address} />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-100 pt-6 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PersonaPro. Todos os direitos reservados.</p>
          <p>Landing page SaaS pronta para evoluir.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <h3 className="font-extrabold text-brand-900">{title}</h3>
      <div className="mt-5 flex flex-col gap-3 text-sm font-semibold text-slate-600 [&_a]:transition [&_a:hover]:text-brand-600">
        {children}
      </div>
    </div>
  );
}

function Contact({ icon, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-brand-600">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
