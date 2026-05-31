import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarCheck, LogOut } from 'lucide-react';
import { ProfessionalManagement } from '../components/dashboard/ProfessionalManagement.jsx';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

export default function AgendaManagementPage() {
  const initialSlug = new URLSearchParams(window.location.search).get('slug') || '';
  const [pages, setPages] = useState([]);
  const [slug, setSlug] = useState(initialSlug);
  const [appointments, setAppointments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [appointmentsStatus, setAppointmentsStatus] = useState({ type: 'idle', message: '' });
  const [reservationsStatus, setReservationsStatus] = useState({ type: 'idle', message: '' });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => { loadPages(); }, []);
  useEffect(() => {
    if (!slug) return;
    loadAppointments(slug);
    loadReservations(slug);
  }, [slug]);

  async function loadPages() {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('onboarding_submissions')
      .select('id, slug, business_name, payload')
      .order('created_at', { ascending: false });
    if (error) {
      setAppointmentsStatus({ type: 'error', message: error.message });
      return;
    }
    setPages(data || []);
    setSlug((current) => current || data?.[0]?.slug || '');
  }

  async function loadAppointments(pageSlug) {
    setAppointmentsStatus({ type: 'loading', message: 'Carregando agenda...' });
    const { data, error } = await supabase
      .from('appointment_requests')
      .select('id, submission_slug, business_name, customer_name, customer_whatsapp, appointment_date, start_time, status, source, payload, created_at')
      .eq('submission_slug', pageSlug)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) {
      setAppointments([]);
      setAppointmentsStatus({ type: 'error', message: error.message });
      return;
    }
    setAppointments(data || []);
    setAppointmentsStatus({ type: 'success', message: '' });
  }

  async function loadReservations(pageSlug) {
    const { data, error } = await supabase
      .from('reservation_requests')
      .select('id, submission_slug, business_name, customer_name, customer_whatsapp, start_date, end_date, status, source, payload, created_at')
      .eq('submission_slug', pageSlug)
      .order('start_date', { ascending: true });
    if (error) {
      setReservations([]);
      setReservationsStatus({
        type: 'error',
        message: error.code === '42P01' || error.code === 'PGRST205'
          ? 'Tabela de reservas por período ainda não instalada. Execute supabase/reservation_requests.sql.'
          : error.message,
      });
      return;
    }
    setReservations(data || []);
    setReservationsStatus({ type: 'success', message: '' });
  }

  async function updateAppointmentStatus(id, nextStatus) {
    setAppointmentsStatus({ type: 'saving', message: 'Atualizando agendamento...' });
    const { error } = await supabase.from('appointment_requests').update({ status: nextStatus }).eq('id', id);
    if (error) {
      setAppointmentsStatus({ type: 'error', message: error.message });
      return;
    }
    setAppointments((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    setAppointmentsStatus({ type: 'success', message: 'Agendamento atualizado.' });
  }

  async function updateReservationStatus(id, nextStatus) {
    setReservationsStatus({ type: 'saving', message: 'Atualizando reserva...' });
    const { error } = await supabase.from('reservation_requests').update({ status: nextStatus }).eq('id', id);
    if (error) {
      setReservationsStatus({ type: 'error', message: error.message });
      return;
    }
    setReservations((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    setReservationsStatus({ type: 'success', message: 'Reserva atualizada.' });
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  function refresh() {
    if (!slug) return;
    loadAppointments(slug);
    loadReservations(slug);
  }

  const selectedPage = pages.find((page) => page.slug === slug);
  const pageName = selectedPage?.payload?.businesses?.name || selectedPage?.business_name || slug;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <a href={`/preview/${encodeURIComponent(slug)}`} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-700" aria-label="Voltar para a página">
              <ArrowLeft size={19} />
            </a>
            <div>
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase text-brand-600"><CalendarCheck size={16} /> Gestão operacional</p>
              <h1 className="mt-1 text-2xl font-extrabold">Agenda e reservas</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pages.length > 1 && (
              <select value={slug} onChange={(event) => setSlug(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none">
                {pages.map((page) => <option key={page.id} value={page.slug}>{page.payload?.businesses?.name || page.business_name}</option>)}
              </select>
            )}
            <a href={`/dashboard?slug=${encodeURIComponent(slug)}`} className="pill-button bg-brand-50 px-4 py-2 text-brand-700">Configurar página</a>
            <button type="button" onClick={signOut} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600" aria-label="Sair da conta">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-8 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-extrabold uppercase text-brand-600">/{slug}</p>
          <h2 className="mt-2 text-3xl font-extrabold">{pageName || 'Selecione uma página'}</h2>
        </div>
        {slug ? (
          <ProfessionalManagement
            appointments={appointments}
            reservations={reservations}
            status={appointmentsStatus}
            reservationsStatus={reservationsStatus}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onRefresh={refresh}
            onUpdateStatus={updateAppointmentStatus}
            onUpdateReservationStatus={updateReservationStatus}
          />
        ) : (
          <div className="rounded-3xl bg-white p-8 text-center font-bold text-slate-500">Nenhuma página encontrada.</div>
        )}
      </main>
    </div>
  );
}
