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
  console.log(`Converting ${images.length} images to data URLs for export...`);

  const imagePromises = Array.from(images).map(async (img, index) => {
    try {
      console.log(`Converting image ${index + 1}:`, img.src);
      const dataURL = await convertImageToDataURL(img);
      img.src = dataURL;
      console.log(`Image ${index + 1} converted successfully`);
    } catch (error) {
      console.error(`Failed to convert image ${index + 1}:`, error);
    }
  });

  await Promise.all(imagePromises);
  console.log('All images converted to data URLs');
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

  const allElements = clone.querySelectorAll('*');
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.transform = 'none';
    }
  });

  return clone;
};

const captureCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  console.log('Capturing element with html2canvas...');
  console.log('Element dimensions:', {
    width: element.offsetWidth,
    height: element.scrollHeight,
    scrollHeight: element.scrollHeight
  });

  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(element, {
    scale: EXPORT_CONFIG.SCALE_FACTOR,
    useCORS: false,
    allowTaint: true,
    foreignObjectRendering: false,
    backgroundColor: EXPORT_CONFIG.BACKGROUND_COLOR,
    width: EXPORT_CONFIG.PAGE_WIDTH_PIXELS,
    height: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    logging: true,
    imageTimeout: 0,
    removeContainer: true,
    onclone: (clonedDoc) => {
      console.log('Document cloned for rendering');
      const clonedElement = clonedDoc.getElementById('onepager-clone');
      if (clonedElement) {
        console.log('Clone element found in cloned document');

        const allCells = clonedElement.querySelectorAll('td');
        allCells.forEach((cell: Element) => {
          if (cell instanceof HTMLElement) {
            const height = parseInt(cell.style.height || '0');
            const lineHeight = parseInt(cell.style.lineHeight || '0');

            if (height > 0 && lineHeight > 0 && height === lineHeight) {
              const fontSize = 14;
              const topPadding = Math.floor((height - fontSize) / 2);
              const bottomPadding = height - fontSize - topPadding;

              cell.style.paddingTop = `${topPadding}px`;
              cell.style.paddingBottom = `${bottomPadding}px`;
              cell.style.lineHeight = 'normal';
              cell.style.display = 'table-cell';
              cell.style.verticalAlign = 'middle';
            }
          }
        });

        console.log('Applied vertical centering fixes to table cells');
      }
    }
  });

  console.log('Canvas created:', {
    width: canvas.width,
    height: canvas.height
  });

  return canvas;
};

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string): void => {
  console.log('Converting canvas to PNG...');

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get canvas context');
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let hasContent = false;

  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i] !== 255 || imageData.data[i + 1] !== 255 || imageData.data[i + 2] !== 255) {
      hasContent = true;
      break;
    }
  }

  if (!hasContent) {
    console.error('Canvas appears to be empty!');
    throw new Error('Generated canvas is empty. The export may have failed to capture content.');
  }

  console.log('Canvas has content, generating download...');

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', EXPORT_CONFIG.IMAGE_QUALITY);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log('Download initiated successfully');
};

export const exportToPNG = async (
  elementId: string,
  filename: string
): Promise<void> => {
  console.log('=== Starting PNG Export ===' );
  console.log('Element ID:', elementId);
  console.log('Filename:', filename);

  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    throw new Error(`Export element not found: ${elementId}`);
  }

  console.log('Original element found:', {
    width: element.offsetWidth,
    height: element.offsetHeight,
    scrollHeight: element.scrollHeight
  });

  const clone = createCloneForExport(element);
  document.body.appendChild(clone);
  console.log('Clone created and appended to body');

  try {
    await new Promise(resolve => setTimeout(resolve, 100));

    await loadImages(clone);

    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await captureCanvas(clone);
    downloadCanvas(canvas, filename);

    console.log('=== PNG Export Completed Successfully ===');
  } catch (error) {
    console.error('=== PNG Export Failed ===');
    console.error('Error details:', error);
    throw error;
  } finally {
    document.body.removeChild(clone);
    console.log('Clone removed from DOM');
  }
};
