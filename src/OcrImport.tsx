import { useEffect, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, LoaderCircle, Trash2, X } from 'lucide-react';
import { scanItemPhoto } from './ocr';
import type { Translator } from './i18n';
import type { QuoteItem } from './types';

type Props = {
  open: boolean;
  t: Translator;
  onClose: () => void;
  onImport: (items: QuoteItem[], mode: 'replace' | 'append') => void;
};

export default function OcrImport({ open, t, onClose, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  if (!open) return null;

  const choosePhoto = () => inputRef.current?.click();

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setItems([]);
    setError('');
    setScanning(true);
    setProgress(0);

    try {
      const detected = await scanItemPhoto(file, (nextProgress, nextStatus) => {
        setProgress(nextProgress);
        setStatus(nextStatus);
      });
      if (!detected.length) {
        setError(t('ocrNoRows'));
      } else {
        setItems(detected);
      }
    } catch (scanError) {
      console.error(scanError);
      setError(t('ocrError'));
    } finally {
      setScanning(false);
    }
  };

  const updateItem = (id: string, patch: Partial<QuoteItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const finishImport = (mode: 'replace' | 'append') => {
    const validItems = items.filter((item) => item.particular.trim());
    if (!validItems.length) return;
    onImport(validItems, mode);
    onClose();
  };

  return (
    <div className="ocr-modal" role="dialog" aria-modal="true" aria-label={t('ocrTitle')}>
      <header className="ocr-header">
        <div>
          <strong>{t('ocrTitle')}</strong>
          <span>{t('ocrPrivate')}</span>
        </div>
        <button className="icon-button" type="button" onClick={onClose} disabled={scanning}>
          <X size={20} />
          <span className="sr-only">{t('cancel')}</span>
        </button>
      </header>

      <div className="ocr-content">
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.currentTarget.value = '';
          }}
        />

        {!previewUrl ? (
          <button className="ocr-picker" type="button" onClick={choosePhoto}>
            <Camera size={32} />
            <strong>{t('chooseOcrPhoto')}</strong>
            <span>{t('ocrPhotoTip')}</span>
          </button>
        ) : (
          <div className="ocr-photo-wrap">
            <img src={previewUrl} alt={t('ocrSelectedPhoto')} />
            {!scanning && (
              <button className="secondary-button" type="button" onClick={choosePhoto}>
                <ImagePlus size={17} /> {t('changePhoto')}
              </button>
            )}
          </div>
        )}

        {scanning && (
          <div className="ocr-progress" role="status">
            <LoaderCircle className="spin" size={25} />
            <div>
              <strong>{t('scanningPhoto')}</strong>
              <span>{status} · {Math.round(progress * 100)}%</span>
            </div>
            <progress max="1" value={progress} />
          </div>
        )}

        {error && <div className="ocr-error">{error}</div>}

        {!!items.length && (
          <>
            <div className="ocr-review-heading">
              <Check size={20} />
              <div>
                <strong>{t('reviewOcrItems')}</strong>
                <span>{t('ocrReviewHelp')}</span>
              </div>
            </div>

            <div className="ocr-items">
              {items.map((item, index) => (
                <article className="ocr-item" key={item.id}>
                  <header>
                    <strong>{index + 1}</strong>
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label={t('deleteItem')}
                      onClick={() => setItems((current) => current.filter(({ id }) => id !== item.id))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </header>
                  <label>
                    <span>{t('particular')}</span>
                    <textarea
                      rows={2}
                      value={item.particular}
                      onChange={(event) => updateItem(item.id, { particular: event.target.value })}
                    />
                  </label>
                  <div className="ocr-item-grid">
                    <label>
                      <span>{t('quantity')}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={item.quantity || ''}
                        onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })}
                      />
                    </label>
                    <label>
                      <span>{t('unit')}</span>
                      <input
                        value={item.unit}
                        onChange={(event) => updateItem(item.id, { unit: event.target.value })}
                      />
                    </label>
                    <label>
                      <span>{t('rate')}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={item.rate || ''}
                        onChange={(event) => updateItem(item.id, { rate: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                  <label>
                    <span>{t('remark')}</span>
                    <input
                      value={item.remark}
                      onChange={(event) => updateItem(item.id, { remark: event.target.value })}
                    />
                  </label>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {!!items.length && !scanning && (
        <footer className="ocr-actions">
          <button className="secondary-button" type="button" onClick={() => finishImport('append')}>
            {t('addOcrItems')}
          </button>
          <button className="primary-button" type="button" onClick={() => finishImport('replace')}>
            {t('replaceWithOcrItems')}
          </button>
        </footer>
      )}
    </div>
  );
}
