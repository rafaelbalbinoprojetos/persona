import { useState } from 'react';
import { ImagePlus, Mail, MapPin, Phone, Plus, Sparkles } from 'lucide-react';

export function hasValue(value) {
  return typeof value === 'number' || Boolean(String(value || '').trim());
}

export function EditableSlot({ hasContent, isOwner = false, emptyLabel, emptyDescription, icon, variant = 'inline', onClick, children }) {
  if (hasContent) return children;
  if (!isOwner) return null;

  const styles = {
    inline: 'inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--preview-border)] bg-[var(--preview-surface)]/55 px-3 py-2 text-sm',
    card: 'flex min-h-24 items-center gap-3 rounded-2xl border border-dashed border-[var(--preview-border)] bg-[var(--preview-surface)]/45 p-4',
    media: 'flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-[var(--preview-border)] bg-[var(--preview-surface)]/45 p-5 text-center',
    section: 'flex min-h-36 items-center justify-center rounded-3xl border border-dashed border-[var(--preview-border)] bg-[var(--preview-surface)]/45 p-6 text-center',
  };

  return (
    <button type="button" onClick={onClick} className={`${styles[variant]} text-[var(--preview-primary)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[var(--preview-glow)]`}>
      <span className="shrink-0">{icon || <Plus size={17} />}</span>
      <span>
        <span className="block font-extrabold">+ {emptyLabel}</span>
        {emptyDescription && <span className="mt-1 block text-xs font-semibold text-[var(--preview-muted)]">{emptyDescription}</span>}
      </span>
    </button>
  );
}

export function SafeImage({ src, alt = '', isOwner = false, onEdit, fallbackLabel = 'Adicionar imagem', className = '', variant = 'service', children }) {
  const [failed, setFailed] = useState(false);
  const hasImage = hasValue(src) && !failed;

  if (hasImage) {
    return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
  }
  if (variant === 'gallery' && !isOwner) return null;

  return (
    <div className="relative grid h-full min-h-40 place-items-center overflow-hidden bg-[radial-gradient(circle_at_72%_22%,var(--preview-primary),transparent_34%),linear-gradient(135deg,var(--preview-card),var(--preview-bg))]">
      <div className="absolute inset-0 bg-black/10" />
      <Sparkles size={38} className="relative text-[var(--preview-primary)]/75" />
      {isOwner && (
        <button type="button" onClick={onEdit} className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-2 text-xs font-extrabold text-white backdrop-blur-xl transition hover:bg-black/65">
          <ImagePlus size={15} /> {fallbackLabel}
        </button>
      )}
      {children}
    </div>
  );
}

export function SmartContactList({ whatsapp, email, address, isOwner = false, onEditField }) {
  const items = [
    { key: 'whatsapp', label: 'WhatsApp', value: whatsapp, Icon: Phone },
    { key: 'email', label: 'e-mail', value: email, Icon: Mail },
    { key: 'address', label: 'endereço', value: address, Icon: MapPin },
  ];
  if (!isOwner && !items.some((item) => hasValue(item.value))) return null;

  return (
    <div className="space-y-3 text-[var(--preview-muted)]">
      {items.map(({ key, label, value, Icon }) => (
        <EditableSlot key={key} hasContent={hasValue(value)} isOwner={isOwner} emptyLabel={`Adicionar ${label}`} icon={<Plus size={16} />} onClick={() => onEditField?.(key)}>
          <div className="flex items-center gap-3 font-bold"><Icon size={19} className="text-[var(--preview-primary)]" /><span>{value}</span></div>
        </EditableSlot>
      ))}
    </div>
  );
}

export function SmartSocialLinks({ links = [], isOwner = false, onAdd, renderLink }) {
  if (!links.length && !isOwner) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {links.map((social) => renderLink?.(social))}
      {isOwner && (
        <button type="button" onClick={onAdd} className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-[var(--preview-border)] bg-[var(--preview-surface)]/55 text-[var(--preview-primary)] transition hover:-translate-y-1 hover:shadow-[var(--preview-glow)]" aria-label="Adicionar rede social">
          <Plus size={18} />
        </button>
      )}
    </div>
  );
}
