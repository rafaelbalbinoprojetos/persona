export function CenteredState({ title, description }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f8fbff] px-5">
      <div className="max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-[var(--preview-shadow)]">
        <h1 className="text-3xl font-extrabold text-brand-900">{title}</h1>
        <p className="mt-4 leading-7 text-slate-600">{description}</p>
        <a href="/onboarding" className="pill-button mt-7 bg-brand-600 text-white shadow-glow">
          Voltar ao onboarding
        </a>
      </div>
    </div>
  );
}
