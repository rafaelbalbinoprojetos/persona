import { Image, Plus, Trash2 } from 'lucide-react';
import { Input, Textarea } from './DashboardShared.jsx';

export function GalleryEditor({ draft, updateGalleryItem, addGalleryItem, removeGalleryItem }) {
  const gallery = draft.payload.gallery || [];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Imagens da galeria</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Cadastre fotos do ambiente, bastidores, equipe, resultados ou imagens institucionais.
          </p>
        </div>
        <button
          onClick={addGalleryItem}
          className="pill-button bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white"
        >
          <Plus size={17} />
          Adicionar imagem
        </button>
      </div>

      {gallery.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {gallery.map((item, index) => (
            <div
              key={item.image_url || item.title || `gallery-${index}`}
              className="rounded-[2rem] border border-slate-100 bg-[#fbfdff] p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-extrabold text-brand-600">Imagem {index + 1}</p>
                <button
                  onClick={() => removeGalleryItem(index)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                  aria-label="Remover imagem"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <div className="grid gap-4">
                <Input
                  label="Título"
                  value={item.title || ''}
                  onChange={(value) => updateGalleryItem(index, 'title', value)}
                />
                <Input
                  label="URL da imagem"
                  value={item.image_url || item.url || ''}
                  onChange={(value) => updateGalleryItem(index, 'image_url', value)}
                  icon={<Image size={18} />}
                />
                <Textarea
                  label="Descrição curta"
                  value={item.description || item.alt_text || ''}
                  onChange={(value) => updateGalleryItem(index, 'description', value)}
                  rows={2}
                />
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">
                {item.image_url || item.url ? (
                  <img
                    src={item.image_url || item.url}
                    alt={item.title || 'Imagem da galeria'}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-56 place-items-center text-center text-slate-400">
                    <div>
                      <Image size={40} className="mx-auto" />
                      <p className="mt-3 text-sm font-bold">Preview da imagem</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] bg-[#fbfdff] p-8 text-center">
          <Image size={42} className="mx-auto text-brand-600" />
          <h3 className="mt-4 text-xl font-extrabold">Nenhuma imagem cadastrada</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
            A landing ainda pode usar imagens dos serviços e da hero como fallback, mas uma galeria
            própria deixa a página mais personalizada.
          </p>
          <button
            onClick={addGalleryItem}
            className="pill-button mx-auto mt-5 bg-brand-600 text-white shadow-glow"
          >
            <Plus size={17} />
            Adicionar primeira imagem
          </button>
        </div>
      )}
    </div>
  );
}
