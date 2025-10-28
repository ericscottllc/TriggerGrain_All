import { EXPORT_CONFIG } from './constants';

const loadImages = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  await Promise.all(Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      if (img.src.startsWith('/')) {
        img.src = window.location.origin + img.src;
      }
    });
  }));
};

const createCloneForExport = (element: HTMLElement): HTMLElement => {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'onepager-clone';

  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.transform = 'none';
  clone.style.width = `${EXPORT_CONFIG.PAGE_WIDTH_PIXELS}px`;
  clone.style.backgroundColor = EXPORT_CONFIG.BACKGROUND_COLOR;

  return clone;
};

const captureCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  const html2canvas = (await import('html2canvas')).default;

  return html2canvas(element, {
    scale: EXPORT_CONFIG.SCALE_FACTOR,
    useCORS: true,
    allowTaint: true,
    foreignObjectRendering: true,
    backgroundColor: EXPORT_CONFIG.BACKGROUND_COLOR,
    width: EXPORT_CONFIG.PAGE_WIDTH_PIXELS,
    height: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    logging: false,
    imageTimeout: EXPORT_CONFIG.IMAGE_TIMEOUT,
    removeContainer: true
  });
};

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', EXPORT_CONFIG.IMAGE_QUALITY);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPNG = async (
  elementId: string,
  filename: string
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Export element not found');
  }

  const clone = createCloneForExport(element);
  document.body.appendChild(clone);

  try {
    await loadImages(clone);
    const canvas = await captureCanvas(clone);
    downloadCanvas(canvas, filename);
  } finally {
    document.body.removeChild(clone);
  }
};
