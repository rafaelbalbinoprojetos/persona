// SEO dinâmico no cliente.
//
// Atualiza <title> e meta tags conforme a página carregada. Funciona para
// humanos no navegador e para o Google (que renderiza JavaScript).
//
// IMPORTANTE: redes que NÃO executam JS ao gerar preview de link
// (WhatsApp, Facebook, LinkedIn, Telegram, etc.) não enxergam o que é
// definido aqui. Para esses robôs, as meta tags são injetadas no servidor
// pelo middleware.js (Edge Middleware da Vercel).

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applyPageSeo({ title, description, image, url } = {}) {
  if (typeof document === 'undefined') return;
  if (title) document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:image', image);
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', image);
  upsertLink('canonical', url);
}

// Monta os dados de SEO a partir da configuração normalizada da landing.
export function buildSeoFromConfig(config) {
  const businessName = config?.business?.name || config?.submission?.business_name || 'Persona';
  const segment = config?.business?.segment || config?.preset?.label || '';
  const title = segment ? `${businessName} — ${segment}` : businessName;
  const description =
    config?.branding?.hero_subtitle ||
    config?.branding?.hero_title ||
    `Conheça ${businessName} e agende diretamente pelo site.`;
  const image =
    config?.branding?.hero_image_url ||
    config?.submission?.hero_image_url ||
    '';
  const url = typeof window !== 'undefined' ? window.location.href : '';
  return { title, description, image, url };
}
