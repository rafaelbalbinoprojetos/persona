// Vercel Edge Middleware
// ----------------------------------------------------------------------------
// Objetivo: gerar preview de link correto (Open Graph/Twitter) quando alguém
// compartilha uma página /preview/<slug> no WhatsApp, Facebook, LinkedIn,
// Telegram, etc. Esses robôs NÃO executam JavaScript, então o SEO dinâmico do
// cliente (src/landing/seo.js) não basta — as meta tags precisam vir prontas
// do servidor.
//
// Como funciona:
//  - Só intercepta requisições de /preview/<slug>.
//  - Se o User-Agent for de robô de rede social, busca a submissão no Supabase
//    (status preview/published) e devolve um HTML enxuto só com as meta tags.
//  - Para humanos (qualquer outro User-Agent), não retorna nada e a requisição
//    segue normalmente para o SPA (index.html).
//
// Requisitos no ambiente da Vercel:
//  - SUPABASE_URL (ou VITE_SUPABASE_URL)
//  - SUPABASE_ANON_KEY (ou VITE_SUPABASE_ANON_KEY)
//
// OBS.: middleware só roda em deploy na Vercel, não no `vite dev` local.
// Teste primeiro em um deploy de Preview antes de promover para produção.

export const config = {
  matcher: '/preview/:slug*',
};

const BOT_UA = /(facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|pinterest|redditbot|embedly|skypeuripreview|googlebot|bingbot|applebot)/i;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';

  // Humano: deixa o SPA assumir.
  if (!BOT_UA.test(ua)) return;

  const url = new URL(request.url);
  const slug = url.pathname.replace('/preview/', '').replace(/\/.*$/, '').trim();
  if (!slug) return;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const endpoint =
      `${supabaseUrl}/rest/v1/onboarding_submissions` +
      `?slug=eq.${encodeURIComponent(slug)}` +
      `&status=in.(preview,published)` +
      `&select=business_name,segment,hero_image_url,payload&limit=1`;

    const res = await fetch(endpoint, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return;

    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return;

    const branding = (row.payload && row.payload.business_branding) || {};
    const name = row.business_name || 'Persona';
    const segment = row.segment || '';
    const title = segment ? `${name} — ${segment}` : name;
    const description =
      branding.hero_subtitle ||
      branding.hero_title ||
      `Conheça ${name} e agende diretamente pelo site.`;
    const image = row.hero_image_url || branding.hero_image_url || '';
    const imageType = /\.png(\?|$)/i.test(image)
      ? 'image/png'
      : /\.webp(\?|$)/i.test(image)
      ? 'image/webp'
      : 'image/jpeg';
    const pageUrl = url.href;

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(pageUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Persona" />
<meta property="og:locale" content="pt_BR" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:image:type" content="${imageType}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${escapeHtml(title)}" />` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)}</p>
<p><a href="${escapeHtml(pageUrl)}">Abrir página</a></p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch {
    // Qualquer falha: não quebra a página, apenas segue para o SPA.
    return;
  }
}
