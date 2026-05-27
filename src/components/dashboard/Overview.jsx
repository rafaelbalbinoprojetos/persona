import { Metric } from './DashboardShared.jsx';

export function Overview({ draft }) {
  const services = draft.payload.services || [];
  const gallery = draft.payload.gallery || [];
  const rules = draft.payload.availability_rules || [];
  const breaks = draft.payload.availability_breaks || [];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Serviços" value={services.length} />
      <Metric label="Imagens" value={gallery.length} />
      <Metric label="Dias configurados" value={rules.length} />
      <Metric label="Pausas" value={breaks.length} />
    </div>
  );
}
