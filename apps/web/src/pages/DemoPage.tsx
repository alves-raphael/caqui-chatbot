import { useEffect, useMemo, useRef, useState } from 'react';
import prototype from '../../../../docs/prototipo/caqui-prototipo.html?raw';
import bridge from '../demo/bridge.js?raw';
import { API_URL } from '@/lib/api';

export function DemoPage() {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [enabled, setEnabled] = useState(true);
  const [model, setModel] = useState('luna');
  const [status, setStatus] = useState('Verificando a IA local…');
  const html = useMemo(
    () =>
      prototype.replace(
        '</body>',
        `<script>window.CAQUI_LOCAL_CONFIG=${JSON.stringify({ apiUrl: API_URL, parentOrigin: window.location.origin, enabled: true, model: 'luna' }).replaceAll('<', '\\u003c')};${bridge}</script></body>`,
      ),
    [],
  );
  useEffect(() => {
    const listener = (event: MessageEvent<unknown>) => {
      if (
        event.source !== iframe.current?.contentWindow ||
        event.origin !== window.location.origin ||
        !event.data ||
        typeof event.data !== 'object'
      )
        return;
      const data = event.data as { type?: string; text?: unknown };
      if (data.type === 'caqui-ai-status' && typeof data.text === 'string') setStatus(data.text);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);
  useEffect(() => {
    iframe.current?.contentWindow?.postMessage(
      { type: 'caqui-ai-config', enabled, model },
      window.location.origin,
    );
  }, [enabled, model]);
  return (
    <main className="flex h-dvh flex-col bg-white">
      <h1 className="sr-only">Demonstração local com IA</h1>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs">
        <label>
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />{' '}
          IA local
        </label>
        <label>
          Modelo{' '}
          <select
            aria-label="Modelo da IA local"
            value={model}
            onChange={(event) => setModel(event.target.value)}
          >
            <option value="luna">GPT-6 Luna</option>
            <option value="terra">GPT-6.1 Terra</option>
          </select>
        </label>
        <span role="status">{status}</span>
      </div>
      <iframe ref={iframe} title="Protótipo Caqui Atende" srcDoc={html} className="min-h-0 flex-1 border-0" />
    </main>
  );
}
