# Checklist — Deploy e teste do SEO por página

Mudanças desta leva (todas em arquivos do projeto):

- `src/landing/seo.js` — novo helper de SEO dinâmico (cliente).
- `src/pages/PreviewPage.jsx` — aplica o SEO por página.
- `index.html` — meta/Open Graph base corrigidos.
- `middleware.js` — Edge Middleware da Vercel para preview de link em robôs sociais.
- `src/landing/presets.js` e `src/pages/OnboardingPage.jsx` — FAQ e depoimentos ligados por padrão.
- `api/persona-generate.js` — prompt de IA enriquecido.

---

## 1. Build local (obrigatório antes de subir)

```bash
npm install        # se ainda não rodou nesta máquina
npm run build
```

Tem que terminar **sem erros**. Se acusar algo, me manda a mensagem.

Opcional, para ver rodando localmente:

```bash
npm run preview
```

> Atenção: o `middleware.js` **NÃO roda** no `vite dev`/`vite preview`. Ele só
> existe em deploy na Vercel. O resto (SEO dinâmico, FAQ, depoimentos) dá pra
> testar local.

---

## 2. Variáveis de ambiente na Vercel

Confirme em Project → Settings → Environment Variables (ambiente Production e Preview):

- `VITE_SUPABASE_URL` = `https://wvgchojyezmsiuimiqau.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (sua anon key)

O `middleware.js` aceita tanto `SUPABASE_URL`/`SUPABASE_ANON_KEY` quanto as
variantes `VITE_`. Como você já tem as `VITE_`, não precisa duplicar.

---

## 3. Suba primeiro um deploy de PREVIEW (não produção)

Motivo: o `middleware.js` é o único ponto que intercepta `/preview/<slug>`.
Testar em Preview garante que, se algo se comportar diferente, clientes em
produção não são afetados.

- Faça push numa branch (ou use "Redeploy" apontando para uma branch de teste).
- A Vercel gera uma URL de Preview (algo como `...-git-branch.vercel.app`).

---

## 4. Teste: humano continua vendo o site normalmente

Abra no navegador, na URL de Preview:

- [ ] `/` carrega o SPA normalmente.
- [ ] `/preview/<um-slug-publicado>` carrega a landing completa (sem tela branca).
- [ ] Na aba do navegador, o **título** mostra o nome do negócio + segmento.
- [ ] Clicando com botão direito → "Exibir código fonte da página" não é o teste
      certo aqui (mostra o HTML inicial). Para conferir as meta dinâmicas, use o
      DevTools → aba Elements → `<head>` e veja `<title>`/`<meta og:*>` atualizados.

---

## 5. Teste: preview de link (robôs sociais)

Use um slug que esteja com status **preview** ou **published**.

**Facebook Sharing Debugger** (vale para Facebook/Instagram/WhatsApp, que usam o mesmo scraper):

1. Acesse https://developers.facebook.com/tools/debug/
2. Cole `https://SUA-URL-DE-PREVIEW/preview/<slug>`
3. Clique em "Debug" e depois em "Scrape Again".
4. Confira:
   - [ ] og:title = nome do negócio + segmento
   - [ ] og:description = subtítulo da hero
   - [ ] og:image = imagem da hero (se a página tiver imagem)

**Teste real no WhatsApp:**

- [ ] Cole o link num chat de teste e veja se o card aparece com título,
      descrição e imagem.

> Dica: o WhatsApp faz cache agressivo do preview. Se tiver testado o link
> antes da mudança, adicione um parâmetro qualquer (`?v=2`) para forçar novo
> scrape, ou rode o "Scrape Again" no debugger do Facebook primeiro.

---

## 6. Teste: FAQ e depoimentos ligados por padrão

Numa página de preview:

- [ ] A seção **FAQ** aparece (com perguntas reais ou as padrão do segmento).
- [ ] A seção **Depoimentos**: para visitante, só aparece se houver depoimento
      autorizado; logado como dono, aparece o convite para adicionar o primeiro.
- [ ] Crie um depoimento no dashboard (`status = active`, autorizado) e confirme
      que ele passa a aparecer para o público.

---

## 7. Se tudo passou → promova para produção

- Faça merge na branch principal (ou "Promote to Production" no deploy de Preview).
- Repita rapidamente os testes 4 e 5 na URL de produção.

---

## Rollback rápido (se precisar)

Se algo der errado em produção por causa do middleware:

- Opção A: na Vercel, faça "Rollback" para o deploy anterior (1 clique).
- Opção B: renomeie/remova `middleware.js` e faça novo deploy — o site volta a
  funcionar exatamente como antes (o middleware é a única peça nova que toca o
  roteamento; o resto é seguro).
