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
import { createTranslator, type AppLanguage, type Translator } from './i18n';
import type { QuoteData, QuoteItem } from './types';

const STORAGE_KEY = 'maittar-quotation-v1';
const LANGUAGE_KEY = 'maittar-language';
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
  const [focused, setFocused] = useState(false);
  const isNumberInput = type === 'number';
  const displayValue = isNumberInput && focused && Number(value) === 0 ? '' : value;

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
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onWheel={(event) => {
            if (!isNumberInput) return;
            event.preventDefault();
            event.currentTarget.blur();
          }}
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
  t,
  onChange,
  onRemove,
  onMove
}: {
  item: QuoteItem;
  index: number;
  totalItems: number;
  t: Translator;
  onChange: (patch: Partial<QuoteItem>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <article className="item-card">
      <header className="item-card__header">
        <div className="item-number">{index + 1}</div>
        <strong>{t('quotationItem')}</strong>
        <div className="item-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={t('moveUp')}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={t('moveDown')}
            disabled={index === totalItems - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={17} />
          </button>
          <button
            className="icon-button danger"
            type="button"
            aria-label={t('deleteItem')}
            onClick={onRemove}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      <Field
        label={t('particular')}
        value={item.particular}
        placeholder={t('particularPlaceholder')}
        multiline
        onChange={(particular) => onChange({ particular })}
      />
      <div className="field-grid three">
        <Field
          label={t('quantity')}
          value={item.quantity}
          type="number"
          inputMode="decimal"
          onChange={(quantity) => onChange({ quantity: Number(quantity) })}
        />
        <Field
          label={t('unit')}
          value={item.unit}
          placeholder={t('unitPlaceholder')}
          onChange={(unit) => onChange({ unit })}
        />
        <Field
          label={t('rate')}
          value={item.rate}
          type="number"
          inputMode="decimal"
          onChange={(rate) => onChange({ rate: Number(rate) })}
        />
      </div>
      <div className="field-grid amount-row">
        <Field
          label={t('remark')}
          value={item.remark}
          placeholder={t('remarkPlaceholder')}
          onChange={(remark) => onChange({ remark })}
        />
        <div className="calculated-amount">
          <span>{t('amount')}</span>
          <strong>{formatMoney(item.quantity * item.rate)}</strong>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [data, setData] = useState<QuoteData>(loadQuote);
  const [language, setLanguage] = useState<AppLanguage>(() =>
    localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'mm'
  );
  const [screen, setScreen] = useState<Screen>('quotation');
  const [pdfUrl, setPdfUrl] = useState('');
  const [busy, setBusy] = useState<'preview' | 'download' | 'share' | ''>('');
  const [message, setMessage] = useState('');
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const t = createTranslator(language);

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
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language === 'mm' ? 'my' : 'en';
  }, [language]);

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
    setMessage(t('pdfError'));
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
          title: `${t('createQuotation')} – ${data.projectName || 'Maittar'}`,
          files: [file]
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage(t('shareFallback'));
        window.setTimeout(() => setMessage(''), 4000);
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') showError(error);
    } finally {
      setBusy('');
    }
  };

  const newQuotation = () => {
    if (!window.confirm(t('newConfirmation'))) return;
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
            <span>{t('quotationMaker')}</span>
            <strong>{screen === 'quotation' ? t('createQuotation') : t('companyDetails')}</strong>
          </div>
        </div>
        <div className="header-actions">
          <div className="language-switch" role="group" aria-label={t('language')}>
            <button type="button" className={language === 'mm' ? 'active' : ''} onClick={() => setLanguage('mm')} aria-pressed={language === 'mm'}>မြန်မာ</button>
            <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button>
          </div>
          <button className="icon-button header-settings" type="button" onClick={() => setScreen(screen === 'quotation' ? 'company' : 'quotation')}>
            {screen === 'quotation' ? <Settings2 size={21} /> : <X size={21} />}
            <span className="sr-only">{screen === 'quotation' ? t('openSettings') : t('closeSettings')}</span>
          </button>
        </div>
      </header>

      <main>
        {screen === 'quotation' ? (
          <>
            <section className="intro-card">
              <div>
                <span className="eyebrow">{t('savedAutomatically')}</span>
                <h1>{t('buildQuotation')}</h1>
                <p>{t('introDescription')}</p>
              </div>
              <FileText size={34} aria-hidden="true" />
            </section>

            <section className="form-section">
              <div className="section-heading">
                <div>
                  <span>01</span>
                  <div>
                    <h2>{t('projectDetails')}</h2>
                    <p>{t('projectHelp')}</p>
                  </div>
                </div>
                <button className="text-button" type="button" onClick={newQuotation}>
                  <FilePlus2 size={16} /> {t('new')}
                </button>
              </div>
              <div className="surface">
                <Field
                  label={t('projectName')}
                  value={data.projectName}
                  placeholder={t('projectPlaceholder')}
                  onChange={(value) => updateData('projectName', value)}
                />
                <Field
                  label={t('quotationDate')}
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
                    <h2>{t('items')}</h2>
                    <p>{t('itemCount', { count: data.items.length })}</p>
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
                    t={t}
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
                <Plus size={19} /> {t('addItem')}
              </button>

              <div className="total-card">
                <span>{t('allTotal')}</span>
                <strong>{formatMoney(total)} <small>MMK</small></strong>
              </div>
            </section>

            <section className="form-section terms-section">
              <div className="section-heading">
                <div>
                  <span>03</span>
                  <div>
                    <h2>{t('terms')}</h2>
                    <p>{t('termsHelp')}</p>
                  </div>
                </div>
              </div>
              <div className="surface">
                <Field
                  label={t('priceValidity')}
                  value={data.validity}
                  onChange={(value) => updateData('validity', value)}
                />
                <Field
                  label={t('warranty')}
                  value={data.warranty}
                  multiline
                  onChange={(value) => updateData('warranty', value)}
                />
                <Field
                  label={t('discount')}
                  value={data.discount}
                  type="number"
                  inputMode="decimal"
                  onChange={(value) => updateData('discount', Number(value))}
                />
                <Field
                  label={t('paymentDescription')}
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
              <h1>{t('companyDetails')}</h1>
              <p>{t('companyHelp')}</p>
            </div>
            <div className="surface settings-fields">
              <Field
                label={t('engineerName')}
                value={data.engineerName}
                onChange={(value) => updateData('engineerName', value)}
              />
              <Field
                label={t('phone')}
                value={data.phone}
                inputMode="tel"
                onChange={(value) => updateData('phone', value)}
              />
              <Field
                label={t('address')}
                value={data.address}
                multiline
                onChange={(value) => updateData('address', value)}
              />
            </div>

            {installPrompt && (
              <button className="install-card" type="button" onClick={installApp}>
                <Smartphone size={25} />
                <span>
                  <strong>{t('installPhone')}</strong>
                  {t('installHelp')}
                </span>
              </button>
            )}
          </section>
        )}
      </main>

      {screen === 'quotation' && (
        <nav className="action-bar" aria-label={t('pdfActions')}>
          <button type="button" onClick={previewPdf} disabled={!!busy}>
            <Eye size={19} />
            <span>{busy === 'preview' ? t('building') : t('preview')}</span>
          </button>
          <button type="button" onClick={downloadPdf} disabled={!!busy}>
            <Download size={19} />
            <span>{busy === 'download' ? t('saving') : t('download')}</span>
          </button>
          <button className="primary-action" type="button" onClick={sharePdf} disabled={!!busy}>
            <Share2 size={19} />
            <span>{busy === 'share' ? t('preparing') : t('sharePdf')}</span>
          </button>
        </nav>
      )}

      {pdfUrl && (
        <div className="preview-modal" role="dialog" aria-modal="true" aria-label={t('quotationPreview')}>
          <div className="preview-header">
            <div>
              <strong>{t('quotationPreview')}</strong>
              <span>{t('previewHelp')}</span>
            </div>
            <button className="icon-button" type="button" onClick={() => setPdfUrl('')}>
              <X size={21} />
              <span className="sr-only">{t('closePreview')}</span>
            </button>
          </div>
          <object data={pdfUrl} type="application/pdf" className="pdf-frame">
            <p>{t('previewUnsupported')}</p>
          </object>
          <div className="preview-actions">
            <button type="button" className="secondary-button" onClick={downloadPdf}>
              <Download size={18} /> {t('download')}
            </button>
            <button type="button" className="primary-button" onClick={sharePdf}>
              <Share2 size={18} /> {t('sharePdf')}
            </button>
          </div>
        </div>
      )}

      {message && <div className="toast" role="status">{message}</div>}
    </div>
  );
}
