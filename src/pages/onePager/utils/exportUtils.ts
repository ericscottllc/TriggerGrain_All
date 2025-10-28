// html2canvas PNG export with reliable cell centering
// - Centers <td>/<th> content using flex in the cloned DOM
// - Waits for fonts to load to avoid layout drift
// - Converts <img> tags to data URLs to avoid CORS-tainting
// - Leaves foreignObjectRendering off for broader compatibility

import { EXPORT_CONFIG } from './constants';

const convertImageToDataURL = async (img: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';

    tempImg.onload = () => {
      ctx.drawImage(tempImg, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        console.error('Error converting to data URL:', error);
        reject(error);
      }
    };

    tempImg.onerror = (error) => {
      console.error('Error loading image for conversion:', error);
      reject(error);
    };

    const originalSrc = img.getAttribute('src') || img.src;
    if (originalSrc.startsWith('/')) {
      tempImg.src = window.location.origin + originalSrc;
    } else {
      tempImg.src = originalSrc;
    }
  });
};

const loadImages = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(async (img) => {
    try {
      const dataURL = await convertImageToDataURL(img);
      img.src = dataURL;
    } catch {
      /* ignore individual failures */
    }
  });
  await Promise.all(imagePromises);
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
  clone.style.removeProperty('--scale-factor');

  const all = clone.querySelectorAll<HTMLElement>('*');
  all.forEach((el) => {
    el.style.transform = 'none';
  });

  return clone;
};

const captureCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(element, {
    scale: EXPORT_CONFIG.SCALE_FACTOR,
    useCORS: true,           // try CORS first
    allowTaint: false,       // safer default
    foreignObjectRendering: false,
    backgroundColor: EXPORT_CONFIG.BACKGROUND_COLOR,
    width: EXPORT_CONFIG.PAGE_WIDTH_PIXELS,
    height: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    logging: false,
    imageTimeout: 0,
    removeContainer: true,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById('onepager-clone');
      if (!clonedElement) return;

      // Ensure consistent borders
      clonedElement.querySelectorAll('table').forEach((t) => {
        (t as HTMLElement).style.borderCollapse = 'separate';
      });

      // Center all table headers/cells using flex (html2canvas supports flex alignment)
      const cells = clonedElement.querySelectorAll('td, th');
      cells.forEach((node) => {
        const cell = node as HTMLElement;
        const win = clonedDoc.defaultView;
        const cs = win ? win.getComputedStyle(cell) : null;

        // Preserve computed height to avoid collapse when switching display mode
        const computedH = cs ? parseFloat(cs.height || '0') : 0;

        cell.style.display = 'flex';
        cell.style.alignItems = 'center';      // vertical centering
        cell.style.justifyContent = 'center';  // horizontal centering
        cell.style.textAlign = 'center';
        cell.style.boxSizing = 'border-box';

        // Preserve padding-x; vertical centering is handled by flex
        const padL = cs ? cs.paddingLeft : '8px';
        const padR = cs ? cs.paddingRight : '8px';
        cell.style.paddingLeft = padL;
        cell.style.paddingRight = padR;

        if (computedH > 0) {
          cell.style.height = `${Math.ceil(computedH)}px`;
        }

        // Keep existing line-height if explicitly set
        if (cs && cs.lineHeight && cs.lineHeight !== 'normal') {
          cell.style.lineHeight = cs.lineHeight;
        }
      });
    }
  });

  return canvas;
};

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to get canvas context');

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let hasContent = false;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i] !== 255 || imageData.data[i + 1] !== 255 || imageData.data[i + 2] !== 255) {
      hasContent = true;
      break;
    }
  }
  if (!hasContent) throw new Error('Generated canvas is empty. The export may have failed to capture content.');

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', EXPORT_CONFIG.IMAGE_QUALITY);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPNG = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Export element not found: ${elementId}`);

  // Wait for fonts to be fully loaded to avoid reflow between measurement and render
  if ((document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch {
      /* ignore */
    }
  }

  const clone = createCloneForExport(element);
  document.body.appendChild(clone);

  try {
    // let styles apply
    await new Promise((r) => setTimeout(r, 100));

    await loadImages(clone);

    // allow data URLs to settle
    await new Promise((r) => setTimeout(r, 150));

    const canvas = await captureCanvas(clone);
    downloadCanvas(canvas, filename);
  } finally {
    document.body.removeChild(clone);
  }
};
