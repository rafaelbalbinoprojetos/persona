export default function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  const alignment = align === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <div className={`flex max-w-3xl flex-col gap-4 ${alignment}`}>
      <span className="rounded-full border border-brand-100 bg-white px-4 py-2 text-xs font-bold uppercase text-brand-600 shadow-sm">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-extrabold leading-tight text-brand-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && <p className="text-base leading-8 text-slate-600 sm:text-lg">{description}</p>}
    </div>
  );
}
