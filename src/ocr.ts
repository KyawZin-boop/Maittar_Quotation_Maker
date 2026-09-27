import { createWorker, OEM, PSM, type Block, type Line, type Word } from 'tesseract.js';
import { createId } from './defaults';
import type { QuoteItem } from './types';

type ProgressCallback = (progress: number, status: string) => void;

type OcrLine = {
  text: string;
  confidence: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  words: Word[];
};

const loadImage = async (file: File): Promise<ImageBitmap> =>
  createImageBitmap(file, { imageOrientation: 'from-image' });

const makePageCanvas = (
  image: ImageBitmap,
  startRatio: number,
  endRatio: number
) => {
  const cropTop = Math.round(image.height * 0.13);
  const cropBottom = Math.round(image.height * 0.91);
  const sourceX = Math.round(image.width * startRatio);
  const sourceWidth = Math.round(image.width * (endRatio - startRatio));
  const sourceHeight = cropBottom - cropTop;
  const scale = Math.min(2.2, 1900 / sourceWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is not available');

  context.drawImage(
    image,
    sourceX,
    cropTop,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const red = pixels.data[index];
    const green = pixels.data[index + 1];
    const blue = pixels.data[index + 2];
    const grey = red * 0.3 + green * 0.59 + blue * 0.11;
    const contrasted = Math.max(0, Math.min(255, (grey - 128) * 1.65 + 145));
    pixels.data[index] = contrasted;
    pixels.data[index + 1] = contrasted;
    pixels.data[index + 2] = contrasted;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
};

const flattenLines = (blocks: Block[] | null): OcrLine[] => {
  if (!blocks) return [];
  return blocks
    .flatMap((block) => block.paragraphs)
    .flatMap((paragraph) => paragraph.lines)
    .map((line: Line) => ({
      text: line.text.replace(/\s+/g, ' ').trim(),
      confidence: line.confidence,
      ...line.bbox,
      words: line.words
    }))
    .filter((line) => line.text)
    .sort((first, second) => first.y0 - second.y0);
};

const cleanNumber = (value: string) => {
  const normalized = value
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[^\d.,-]/g, '')
    .replace(/,/g, '');
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : 0;
};

const wordsInColumn = (line: OcrLine, min: number, max: number, width: number) =>
  line.words
    .filter((word) => {
      const center = (word.bbox.x0 + word.bbox.x1) / 2 / width;
      return center >= min && center < max;
    })
    .map((word) => word.text)
    .join(' ')
    .trim();

const parseRightLine = (line: OcrLine | undefined, width: number) => {
  if (!line) return { quantity: 0, unit: '', rate: 0, remark: '' };

  const quantityText = wordsInColumn(line, 0, 0.23, width);
  const unit = wordsInColumn(line, 0.23, 0.49, width)
    .replace(/\b5[et]{1,2}\b/i, 'Set')
    .replace(/\b[f]?t\b/i, 'Ft')
    .trim();
  const rateText = wordsInColumn(line, 0.49, 0.84, width);
  const remark = wordsInColumn(line, 0.84, 1.01, width);

  return {
    quantity: cleanNumber(quantityText),
    unit,
    rate: cleanNumber(rateText),
    remark
  };
};

const getDescriptionRows = (lines: OcrLine[]) => {
  const numbered = lines.flatMap((line) => {
    const match = line.text.match(/^\s*(\d{1,2})\s*[.)\-:]?\s+(.{2,})$/);
    if (!match) return [];
    const rowNumber = Number(match[1]);
    if (rowNumber < 1 || rowNumber > 99) return [];
    return [{ ...line, rowNumber, text: match[2].trim() }];
  });

  if (numbered.length >= 2) {
    return numbered.sort((first, second) => first.rowNumber - second.rowNumber);
  }

  return lines
    .filter(
      (line) =>
        !/^(date|sun|mon|tue|wed|thu|fri|sat|computer|note\s*book)$/i.test(line.text) &&
        line.text.length > 2
    )
    .map((line, index) => ({ ...line, rowNumber: index + 1 }));
};

const closestUnusedLine = (
  target: OcrLine,
  candidates: OcrLine[],
  used: Set<number>,
  height: number
) => {
  const targetCenter = (target.y0 + target.y1) / 2;
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate, index) => {
    if (used.has(index)) return;
    const center = (candidate.y0 + candidate.y1) / 2;
    const distance = Math.abs(center - targetCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  if (bestIndex < 0 || bestDistance > height * 0.04) return undefined;
  used.add(bestIndex);
  return candidates[bestIndex];
};

export const scanItemPhoto = async (
  file: File,
  onProgress: ProgressCallback
): Promise<QuoteItem[]> => {
  onProgress(0.02, 'Preparing photo');
  const image = await loadImage(file);
  const leftPage = makePageCanvas(image, 0.015, 0.515);
  const rightPage = makePageCanvas(image, 0.515, 0.985);
  image.close();

  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    logger: (message) => {
      if (typeof message.progress !== 'number') return;
      const base = message.status.includes('recognizing') ? 0.12 : 0.03;
      onProgress(Math.min(0.48, base + message.progress * 0.34), message.status);
    }
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1'
    });

    onProgress(0.12, 'Reading descriptions');
    const leftResult = await worker.recognize(
      leftPage,
      {},
      { text: true, blocks: true }
    );

    onProgress(0.52, 'Reading quantities and prices');
    const rightResult = await worker.recognize(
      rightPage,
      {},
      { text: true, blocks: true }
    );

    const descriptions = getDescriptionRows(flattenLines(leftResult.data.blocks));
    const values = flattenLines(rightResult.data.blocks).filter(
      (line) => /\d/.test(line.text) || /\b(set|ft|no)\b/i.test(line.text)
    );
    const used = new Set<number>();

    const items = descriptions.map((description) => {
      const matchingValues = closestUnusedLine(
        description,
        values,
        used,
        rightPage.height
      );
      const parsed = parseRightLine(matchingValues, rightPage.width);
      return {
        id: createId(),
        particular: description.text,
        quantity: parsed.quantity || 1,
        unit: parsed.unit || 'Set',
        rate: parsed.rate,
        remark: parsed.remark
      };
    });

    onProgress(1, 'Ready to review');
    return items;
  } finally {
    await worker.terminate();
  }
};
