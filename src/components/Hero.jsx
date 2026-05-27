import { ArrowRight, CalendarDays, CheckCircle2, Play, Smile, Star, UsersRound } from 'lucide-react';
import { clinic } from '../data/landingData.js';
import heroImage from '../image/hero_image.png';

export default function Hero() {
  return (
    <section id="top" className="relative bg-white px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <div className="relative mx-auto min-h-[760px] max-w-[1500px] overflow-hidden rounded-[2.25rem] shadow-soft sm:min-h-[820px] lg:min-h-[860px]">
        <img
          src={heroImage}
          alt="Paciente sorrindo em uma clínica odontológica moderna"
          className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,251,255,0.98)_0%,rgba(248,251,255,0.93)_28%,rgba(248,251,255,0.62)_48%,rgba(248,251,255,0.08)_74%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgba(248,251,255,0.96)_0%,rgba(248,251,255,0)_100%)]" />

        <div className="relative z-10 flex min-h-[760px] flex-col justify-center px-6 py-14 sm:min-h-[820px] sm:px-10 lg:min-h-[860px] lg:px-16">
          <div className="max-w-[620px] animate-reveal">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-brand-100 bg-white/75 px-5 py-3 text-sm font-bold text-brand-700 shadow-sm backdrop-blur">
              <Smile size={19} />
              Clínica {clinic.name}
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.06] text-brand-900 sm:text-6xl lg:text-7xl">
              Cuidamos do seu sorriso com <span className="text-brand-500">excelencia</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Tecnologia avançada, profissionais especializados e um atendimento humanizado para você sorrir com confiança todos os dias.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a href="#agenda" className="pill-button bg-brand-600 text-white shadow-glow hover:-translate-y-1 hover:bg-brand-700">
                <CalendarDays size={19} />
                Agendar consulta
              </a>
              <a href="#servicos" className="pill-button border border-brand-200 bg-white/70 text-brand-900 shadow-sm backdrop-blur hover:-translate-y-1 hover:bg-white hover:text-brand-600">
                <Play size={18} fill="currentColor" />
                Conhecer serviços
              </a>
            </div>
          </div>
        </div>

        <div className="glass-panel absolute bottom-8 left-6 z-20 w-[calc(100%-3rem)] rounded-[1.75rem] p-5 shadow-soft sm:bottom-12 sm:left-10 sm:w-[430px] lg:left-16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex -space-x-3">
              {[
                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80',
                'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=120&q=80',
                'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=120&q=80',
                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120&q=80',
              ].map((avatar) => (
                <img key={avatar} src={avatar} alt="" className="h-12 w-12 rounded-full border-[3px] border-white object-cover" />
              ))}
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={17} fill="currentColor" />
                ))}
                <span className="ml-2 text-sm font-extrabold text-brand-900">5.0</span>
              </div>
              <p className="text-sm font-semibold leading-6 text-slate-600">Mais de 2.000 pacientes satisfeitos</p>
            </div>
          </div>
        </div>

        <div className="glass-panel absolute bottom-8 right-6 z-20 hidden w-[315px] rounded-[1.75rem] p-5 shadow-soft md:block lg:bottom-20 lg:right-20">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
              <CalendarDays size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-500">Próxima disponibilidade</p>
              <p className="mt-1 text-xl font-extrabold text-brand-500">Hoje as 15:30</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
              <ArrowRight size={18} />
            </span>
          </div>
        </div>

        <div className="glass-panel absolute right-6 top-28 z-20 hidden rounded-3xl px-5 py-4 shadow-soft lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint-50 text-mint-500">
              <CheckCircle2 size={21} />
            </span>
            <div>
              <p className="font-extrabold text-brand-900">Clínica verificada</p>
              <p className="text-xs font-semibold text-slate-500">Equipe certificada</p>
            </div>
          </div>
        </div>

        <div className="glass-panel absolute right-10 top-[48%] z-20 hidden rounded-3xl px-5 py-4 shadow-soft xl:block">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lilac-50 text-lilac-600">
              <UsersRound size={21} />
            </span>
            <div>
              <p className="font-extrabold text-brand-900">+12.000</p>
              <p className="text-xs font-semibold text-slate-500">pacientes ativos</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
