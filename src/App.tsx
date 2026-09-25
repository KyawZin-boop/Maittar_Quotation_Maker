import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  FilePlus2,
  FileText,
  Plus,
  Settings2,
  Share2,
  Smartphone,
  Trash2,
  X
} from 'lucide-react';
import { createEmptyItem, createId, defaultQuote } from './defaults';
import { formatMoney, safeFileName } from './format';
import type { QuoteData, QuoteItem } from './types';

const STORAGE_KEY = 'maittar-quotation-v1';
type Screen = 'quotation' | 'company';

const loadQuote = (): QuoteData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultQuote;
    const parsed = JSON.parse(saved) as Partial<QuoteData>;
    return {
      ...defaultQuote,
      ...parsed,
      items:
        parsed.items?.map((item) => ({
          ...createEmptyItem(),
          ...item,
          id: item.id || createId()
        })) ?? defaultQuote.items
    };
  } catch {
    return defaultQuote;
  }
};

const logoUrl = `${window.location.origin}/header-logo.png`;

function Field({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  placeholder,
  multiline = false
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel';
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function ItemCard({
  item,
  index,
  totalItems,
  onChange,
  onRemove,
  onMove
}: {
  item: QuoteItem;
  index: number;
  totalItems: number;
  onChange: (patch: Partial<QuoteItem>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <article className="item-card">
      <header className="item-card__header">
        <div className="item-number">{index + 1}</div>
        <strong>Quotation item</strong>
        <div className="item-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Move item up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Move item down"
            disabled={index === totalItems - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={17} />
          </button>
          <button
            className="icon-button danger"
            type="button"
            aria-label="Delete item"
            onClick={onRemove}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      <Field
        label="Particular"
        value={item.particular}
        placeholder="e.g. 1.5 HP new installation cost"
        multiline
        onChange={(particular) => onChange({ particular })}
      />
      <div className="field-grid three">
        <Field
          label="Quantity"
          value={item.quantity}
          type="number"
          inputMode="decimal"
          onChange={(quantity) => onChange({ quantity: Number(quantity) })}
        />
        <Field
          label="Unit"
          value={item.unit}
          placeholder="Set / Ft"
          onChange={(unit) => onChange({ unit })}
        />
        <Field
          label="Rate"
          value={item.rate}
          type="number"
          inputMode="decimal"
          onChange={(rate) => onChange({ rate: Number(rate) })}
        />
      </div>
      <div className="field-grid amount-row">
        <Field
          label="Remark"
          value={item.remark}
          placeholder="Optional brand or note"
          onChange={(remark) => onChange({ remark })}
        />
        <div className="calculated-amount">
          <span>Amount</span>
          <strong>{formatMoney(item.quantity * item.rate)}</strong>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [data, setData] = useState<QuoteData>(loadQuote);
  const [screen, setScreen] = useState<Screen>('quotation');
  const [pdfUrl, setPdfUrl] = useState('');
  const [busy, setBusy] = useState<'preview' | 'download' | 'share' | ''>('');
  const [message, setMessage] = useState('');
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const total = useMemo(
    () =>
      data.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
        0
      ),
    [data.items]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onInstall);
    return () => window.removeEventListener('beforeinstallprompt', onInstall);
  }, []);

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl]
  );

  const updateData = <K extends keyof QuoteData>(key: K, value: QuoteData[K]) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const updateItem = (id: string, patch: Partial<QuoteItem>) => {
    updateData(
      'items',
      data.items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeItem = (id: string) => {
    const items = data.items.filter((item) => item.id !== id);
    updateData('items', items.length ? items : [createEmptyItem()]);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= data.items.length) return;
    const items = [...data.items];
    [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
    updateData('items', items);
  };

  const buildPdf = async () => {
    const [{ pdf }, { default: QuotationDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('./QuotationDocument')
    ]);
    const blob = await pdf(
      <QuotationDocument data={data} logoUrl={logoUrl} />
    ).toBlob();
    return blob;
  };

  const showError = (error: unknown) => {
    console.error(error);
    setMessage('Could not create the PDF. Please try again.');
    window.setTimeout(() => setMessage(''), 4000);
  };

  const previewPdf = async () => {
    setBusy('preview');
    try {
      const blob = await buildPdf();
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(blob));
    } catch (error) {
      showError(error);
    } finally {
      setBusy('');
    }
  };

  const downloadPdf = async () => {
    setBusy('download');
    try {
      const blob = await buildPdf();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFileName(data.projectName);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      showError(error);
    } finally {
      setBusy('');
    }
  };

  const sharePdf = async () => {
    setBusy('share');
    try {
      const blob = await buildPdf();
      const file = new File([blob], safeFileName(data.projectName), {
        type: 'application/pdf'
      });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: `Quotation – ${data.projectName || 'Maittar'}`,
          files: [file]
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage('Sharing is not supported here, so the PDF was downloaded.');
        window.setTimeout(() => setMessage(''), 4000);
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') showError(error);
    } finally {
      setBusy('');
    }
  };

  const newQuotation = () => {
    if (!window.confirm('Start a new quotation? Company details will be kept.')) return;
    setData((current) => ({
      ...current,
      projectName: '',
      date: new Date().toISOString().slice(0, 10),
      items: [createEmptyItem()]
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <img src="/logo.png" alt="Maittar" />
          <div>
            <span>QUOTATION MAKER</span>
            <strong>{screen === 'quotation' ? 'Create quotation' : 'Company details'}</strong>
          </div>
        </div>
        <button className="icon-button header-settings" type="button" onClick={() => setScreen(screen === 'quotation' ? 'company' : 'quotation')}>
          {screen === 'quotation' ? <Settings2 size={21} /> : <X size={21} />}
          <span className="sr-only">{screen === 'quotation' ? 'Open company settings' : 'Close company settings'}</span>
        </button>
      </header>

      <main>
        {screen === 'quotation' ? (
          <>
            <section className="intro-card">
              <div>
                <span className="eyebrow">Saved automatically</span>
                <h1>Build your quotation</h1>
                <p>Add the project details and items. Amounts and totals calculate for you.</p>
              </div>
              <FileText size={34} aria-hidden="true" />
            </section>

            <section className="form-section">
              <div className="section-heading">
                <div>
                  <span>01</span>
                  <div>
                    <h2>Project details</h2>
                    <p>Shown above the item table.</p>
                  </div>
                </div>
                <button className="text-button" type="button" onClick={newQuotation}>
                  <FilePlus2 size={16} /> New
                </button>
              </div>
              <div className="surface">
                <Field
                  label="Project name"
                  value={data.projectName}
                  placeholder="e.g. SHWE HIN THAR Condo A-704"
                  onChange={(value) => updateData('projectName', value)}
                />
                <Field
                  label="Quotation date"
                  value={data.date}
                  type="date"
                  onChange={(value) => updateData('date', value)}
                />
              </div>
            </section>

            <section className="form-section">
              <div className="section-heading">
                <div>
                  <span>02</span>
                  <div>
                    <h2>Items</h2>
                    <p>{data.items.length} {data.items.length === 1 ? 'item' : 'items'} in this quotation.</p>
                  </div>
                </div>
              </div>

              <div className="items-list">
                {data.items.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={data.items.length}
                    onChange={(patch) => updateItem(item.id, patch)}
                    onRemove={() => removeItem(item.id)}
                    onMove={(direction) => moveItem(index, direction)}
                  />
                ))}
              </div>

              <button
                className="add-button"
                type="button"
                onClick={() => updateData('items', [...data.items, createEmptyItem()])}
              >
                <Plus size={19} /> Add another item
              </button>

              <div className="total-card">
                <span>All total</span>
                <strong>{formatMoney(total)} <small>MMK</small></strong>
              </div>
            </section>

            <section className="form-section terms-section">
              <div className="section-heading">
                <div>
                  <span>03</span>
                  <div>
                    <h2>Terms</h2>
                    <p>Displayed below the total.</p>
                  </div>
                </div>
              </div>
              <div className="surface">
                <Field
                  label="Price validity"
                  value={data.validity}
                  onChange={(value) => updateData('validity', value)}
                />
                <Field
                  label="Warranty"
                  value={data.warranty}
                  multiline
                  onChange={(value) => updateData('warranty', value)}
                />
                <Field
                  label="Discount"
                  value={data.discount}
                  type="number"
                  inputMode="decimal"
                  onChange={(value) => updateData('discount', Number(value))}
                />
                <Field
                  label="Payment-page description"
                  value={data.paymentNote}
                  multiline
                  onChange={(value) => updateData('paymentNote', value)}
                />
              </div>
            </section>
          </>
        ) : (
          <section className="settings-page">
            <div className="settings-hero">
              <img src="/header-logo.png" alt="Maittar Engineering Air-Con" />
              <h1>Company details</h1>
              <p>These details are saved on this device and used for every new quotation.</p>
            </div>
            <div className="surface settings-fields">
              <Field
                label="Engineer name"
                value={data.engineerName}
                onChange={(value) => updateData('engineerName', value)}
              />
              <Field
                label="Phone"
                value={data.phone}
                inputMode="tel"
                onChange={(value) => updateData('phone', value)}
              />
              <Field
                label="Address"
                value={data.address}
                multiline
                onChange={(value) => updateData('address', value)}
              />
            </div>

            {installPrompt && (
              <button className="install-card" type="button" onClick={installApp}>
                <Smartphone size={25} />
                <span>
                  <strong>Install on this phone</strong>
                  Add the quotation maker to your home screen.
                </span>
              </button>
            )}
          </section>
        )}
      </main>

      {screen === 'quotation' && (
        <nav className="action-bar" aria-label="PDF actions">
          <button type="button" onClick={previewPdf} disabled={!!busy}>
            <Eye size={19} />
            <span>{busy === 'preview' ? 'Building…' : 'Preview'}</span>
          </button>
          <button type="button" onClick={downloadPdf} disabled={!!busy}>
            <Download size={19} />
            <span>{busy === 'download' ? 'Saving…' : 'Download'}</span>
          </button>
          <button className="primary-action" type="button" onClick={sharePdf} disabled={!!busy}>
            <Share2 size={19} />
            <span>{busy === 'share' ? 'Preparing…' : 'Share PDF'}</span>
          </button>
        </nav>
      )}

      {pdfUrl && (
        <div className="preview-modal" role="dialog" aria-modal="true" aria-label="PDF preview">
          <div className="preview-header">
            <div>
              <strong>Quotation preview</strong>
              <span>Check the PDF before sharing.</span>
            </div>
            <button className="icon-button" type="button" onClick={() => setPdfUrl('')}>
              <X size={21} />
              <span className="sr-only">Close preview</span>
            </button>
          </div>
          <object data={pdfUrl} type="application/pdf" className="pdf-frame">
            <p>Your browser cannot show the preview. Use Download PDF instead.</p>
          </object>
          <div className="preview-actions">
            <button type="button" className="secondary-button" onClick={downloadPdf}>
              <Download size={18} /> Download
            </button>
            <button type="button" className="primary-button" onClick={sharePdf}>
              <Share2 size={18} /> Share PDF
            </button>
          </div>
        </div>
      )}

      {message && <div className="toast" role="status">{message}</div>}
    </div>
  );
}
