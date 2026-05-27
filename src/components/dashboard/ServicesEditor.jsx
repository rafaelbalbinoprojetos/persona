import { Plus, Trash2 } from 'lucide-react';
import { Input, Textarea } from './DashboardShared.jsx';

export function ServicesEditor({ draft, updateService, addService, removeService }) {
  const services = draft.payload.services || [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold">Serviços prestados</h2>
        <button
          onClick={addService}
          className="pill-button bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-600 hover:text-white"
        >
          <Plus size={17} />
          Adicionar
        </button>
      </div>

      <div className="space-y-4">
        {services.map((service, index) => (
          // Usa o nome do serviço como parte da key para evitar reordenação incorreta
          <div
            key={service.name ? `${service.name}-${index}` : `service-${index}`}
            className="rounded-[2rem] border border-slate-100 bg-[#fbfdff] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-extrabold text-brand-600">Serviço {index + 1}</p>
              <button
                onClick={() => removeService(index)}
                className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                aria-label="Remover serviço"
              >
                <Trash2 size={17} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nome"
                value={service.name || ''}
                onChange={(value) => updateService(index, 'name', value)}
              />
              <Input
                label="Preço"
                value={service.price || ''}
                onChange={(value) => updateService(index, 'price', value)}
              />
              <Input
                label="Duração em minutos"
                type="number"
                value={service.duration || 30}
                onChange={(value) => updateService(index, 'duration', Number(value))}
              />
              <Input
                label="URL da imagem"
                value={service.image_url || ''}
                onChange={(value) => updateService(index, 'image_url', value)}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Descrição"
                  value={service.description || ''}
                  onChange={(value) => updateService(index, 'description', value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
