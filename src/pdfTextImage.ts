export type PdfTextImage = {
  src: string;
  width: number;
  height: number;
};

export type PdfTextImages = {
  projectName?: PdfTextImage;
  paymentNote?: PdfTextImage;
  paymentMeta?: PdfTextImage;
};

type RenderOptions = {
  width: number;
  fontSize: number;
  fontWeight?: number;
  align?: 'left' | 'center';
  lineHeight?: number;
};

const MYANMAR_CHARACTERS = /[\u1000-\u109f\uaa60-\uaa7f\ua9e0-\ua9ff]/;
const PIXELS_PER_POINT = 4;

const containsMyanmar = (value: string) => MYANMAR_CHARACTERS.test(value);

const splitLongToken = (
  context: CanvasRenderingContext2D,
  token: string,
  maxWidth: number
) => {
  const graphemes = typeof Intl.Segmenter === 'function'
    ? Array.from(
        new Intl.Segmenter('my', { granularity: 'grapheme' }).segment(token),
        ({ segment }) => segment
      )
    : Array.from(token);
  const pieces: string[] = [];
  let current = '';

  graphemes.forEach((grapheme) => {
    const candidate = current + grapheme;
    if (current && context.measureText(candidate).width > maxWidth) {
      pieces.push(current);
      current = grapheme;
    } else {
      current = candidate;
    }
  });

  if (current) pieces.push(current);
  return pieces;
};

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  const lines: string[] = [];

  text.split(/\r?\n/).forEach((paragraph) => {
    const tokens = paragraph.split(/(\s+)/).filter(Boolean);
    let line = '';

    tokens.forEach((token) => {
      const candidate = line + token;
      if (!line || context.measureText(candidate).width <= maxWidth) {
        line = candidate;
        return;
      }

      lines.push(line.trimEnd());
      if (context.measureText(token).width <= maxWidth) {
        line = token.trimStart();
        return;
      }

      const pieces = splitLongToken(context, token.trim(), maxWidth);
      lines.push(...pieces.slice(0, -1));
      line = pieces.at(-1) ?? '';
    });

    lines.push(line.trimEnd());
  });

  return lines.length ? lines : [''];
};

const renderMyanmarText = async (
  value: string,
  { width, fontSize, fontWeight = 400, align = 'left', lineHeight = 1.5 }: RenderOptions
): Promise<PdfTextImage> => {
  const normalized = value.normalize('NFC');
  const fontPixels = fontSize * PIXELS_PER_POINT;
  await document.fonts.load(
    `${fontWeight} ${fontPixels}px "Noto Myanmar"`,
    normalized
  );

  const measuringCanvas = document.createElement('canvas');
  const measuringContext = measuringCanvas.getContext('2d');
  if (!measuringContext) throw new Error('Canvas is not available');
  measuringContext.font = `${fontWeight} ${fontPixels}px "Noto Myanmar"`;

  const horizontalPadding = 2 * PIXELS_PER_POINT;
  const verticalPadding = 1.5 * PIXELS_PER_POINT;
  const canvasWidth = Math.ceil(width * PIXELS_PER_POINT);
  const availableWidth = canvasWidth - horizontalPadding * 2;
  const lines = wrapText(measuringContext, normalized, availableWidth);
  const metrics = measuringContext.measureText('မြန်မာAg');
  const ascent = metrics.actualBoundingBoxAscent || fontPixels;
  const descent = metrics.actualBoundingBoxDescent || fontPixels * 0.35;
  const lineHeightPixels = fontPixels * lineHeight;
  const canvasHeight = Math.ceil(
    verticalPadding * 2 + ascent + descent + Math.max(0, lines.length - 1) * lineHeightPixels
  );

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');

  context.font = `${fontWeight} ${fontPixels}px "Noto Myanmar"`;
  context.fillStyle = '#111111';
  context.textBaseline = 'alphabetic';
  context.textAlign = align;

  lines.forEach((line, index) => {
    const x = align === 'center' ? canvasWidth / 2 : horizontalPadding;
    const y = verticalPadding + ascent + index * lineHeightPixels;
    context.fillText(line, x, y);
  });

  return {
    src: canvas.toDataURL('image/png'),
    width,
    height: canvasHeight / PIXELS_PER_POINT
  };
};

export const createPdfTextImages = async ({
  projectName,
  paymentNote,
  paymentMeta
}: {
  projectName: string;
  paymentNote: string;
  paymentMeta: string;
}): Promise<PdfTextImages> => {
  const [projectNameImage, paymentNoteImage, paymentMetaImage] = await Promise.all([
    containsMyanmar(projectName)
      ? renderMyanmarText(projectName, {
          width: 481,
          fontSize: 8.5,
          fontWeight: 600,
          lineHeight: 1.45
        })
      : undefined,
    containsMyanmar(paymentNote)
      ? renderMyanmarText(paymentNote, {
          width: 451,
          fontSize: 8.5,
          align: 'center',
          lineHeight: 1.55
        })
      : undefined,
    containsMyanmar(paymentMeta)
      ? renderMyanmarText(paymentMeta, {
          width: 451,
          fontSize: 7.5,
          align: 'center',
          lineHeight: 1.45
        })
      : undefined
  ]);

  return {
    projectName: projectNameImage,
    paymentNote: paymentNoteImage,
    paymentMeta: paymentMetaImage
  };
};
