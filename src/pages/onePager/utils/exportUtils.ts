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
        reject(error);
      }
    };

    tempImg.onerror = (error) => reject(error);

    const originalSrc = img.getAttribute('src') || img.src;
    tempImg.src = originalSrc.startsWith('/') ? window.location.origin + originalSrc : originalSrc;
  });
};

const loadImages = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(async (img) => {
      try {
        const dataURL = await convertImageToDataURL(img);
        img.src = dataURL;
      } catch {
        /* ignore individual failures */
      }
    })
  );
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

  // Remove any transforms that could affect layout during capture
  const allElements = clone.querySelectorAll<HTMLElement>('*');
  allElements.forEach((el) => {
    el.style.transform = 'none';
  });

  return clone;
};

const captureCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(element, {
    scale: EXPORT_CONFIG.SCALE_FACTOR,
    useCORS: false,           // keep original flags
    allowTaint: true,         // keep original flags
    foreignObjectRendering: false,
    backgroundColor: EXPORT_CONFIG.BACKGROUND_COLOR,
    width: EXPORT_CONFIG.PAGE_WIDTH_PIXELS,
    height: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    logging: true,
    imageTimeout: 0,
    removeContainer: true,

    // IMPORTANT: do NOT change <td>/<th> display; wrap their content instead.
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById('onepager-clone');
      if (!clonedElement) return;

      // Preserve normal table rendering
      const tables = clonedElement.querySelectorAll('table');
      tables.forEach((t) => {
        (t as HTMLElement).style.borderCollapse = (getComputedStyle(t as Element).borderCollapse || 'separate') as any;
      });

      // Center cell content without changing table layout
      const cellNodes = clonedElement.querySelectorAll('td, th');
      cellNodes.forEach((node) => {
        const cell = node as HTMLElement;

        // Skip if we already wrapped this cell
        if (cell.firstElementChild && (cell.firstElementChild as HTMLElement).dataset?.h2cWrap === '1') {
          return;
        }

        const win = clonedDoc.defaultView!;
        const cs = win.getComputedStyle(cell);

        // Read current paddings so we can move them onto the wrapper
        const padTop = cs.paddingTop;
        const padRight = cs.paddingRight;
        const padBottom = cs.paddingBottom;
        const padLeft = cs.paddingLeft;

        // Explicit height helps prevent reflow differences during capture
        const computedH = parseFloat(cs.height || '0');
        if (computedH > 0 && cs.height !== 'auto') {
          cell.style.height = `${Math.ceil(computedH)}px`;
        }

        // Create a wrapper that fills the cell and centers its content
        const wrapper = clonedDoc.createElement('div');
        wrapper.dataset.h2cWrap = '1';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';       // vertical center
        wrapper.style.justifyContent = 'center';    // horizontal center
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.boxSizing = 'border-box';
        wrapper.style.textAlign = 'center';
        wrapper.style.paddingTop = padTop;
        wrapper.style.paddingRight = padRight;
        wrapper.style.paddingBottom = padBottom;
        wrapper.style.paddingLeft = padLeft;

        // Move all child nodes into the wrapper
        while (cell.firstChild) {
          wrapper.appendChild(cell.firstChild);
        }

        // Zero the cell padding so total size stays the same
        cell.style.padding = '0';

        cell.appendChild(wrapper);

        // Keep the author’s line-height if explicitly set
        if (cs.lineHeight && cs.lineHeight !== 'normal') {
          (wrapper.style as any).lineHeight = cs.lineHeight;
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

  // Ensure web fonts are loaded to prevent layout shifts between measure and render
  if ((document as any).fonts?.ready) {
    try { await (document as any).fonts.ready; } catch { /* no-op */ }
  }

  const clone = createCloneForExport(element);
  document.body.appendChild(clone);

  try {
    // allow styles to apply
    await new Promise((r) => setTimeout(r, 100));

    // inline images inside the clone
    await loadImages(clone);

    // small settle time after swapping <img> sources
    await new Promise((r) => setTimeout(r, 150));

    const canvas = await captureCanvas(clone);
    downloadCanvas(canvas, filename);
  } finally {
    document.body.removeChild(clone);
  }
};
