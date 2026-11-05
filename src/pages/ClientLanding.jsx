import { useMemo } from 'react';
import { PreviewLanding } from './PreviewPage.jsx';
import { getDemoSubmission } from '../landing/demoSubmission.js';

/**
 * /demo/personapro — demonstração renderizada pelo mesmo motor das páginas
 * dos clientes, para que qualquer melhoria (mobile, tema, acessibilidade)
 * valha igualmente para a demo e para todos os clientes.
 */
export default function ClientLanding() {
  const submission = useMemo(() => getDemoSubmission(), []);
  return <PreviewLanding submission={submission} isLive />;
}
