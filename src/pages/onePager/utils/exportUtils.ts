import { EXPORT_CONFIG } from './constants';

const loadImages = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  console.log(`Loading ${images.length} images for export...`);

  await Promise.all(Array.from(images).map((img, index) => {
    if (img.complete && img.naturalHeight !== 0) {
      console.log(`Image ${index + 1} already loaded:`, img.src);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn(`Image ${index + 1} load timeout:`, img.src);
        resolve();
      }, EXPORT_CONFIG.IMAGE_TIMEOUT);

      img.onload = () => {
        clearTimeout(timeout);
        console.log(`Image ${index + 1} loaded successfully:`, img.src);
        resolve();
      };

      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`Image ${index + 1} failed to load:`, img.src, error);
        resolve();
      };

      if (img.src.startsWith('/')) {
        img.src = window.location.origin + img.src;
      }
    });
  }));

  console.log('All images processed');
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
    useCORS: true,
    allowTaint: false,
    foreignObjectRendering: true,
    backgroundColor: EXPORT_CONFIG.BACKGROUND_COLOR,
    width: EXPORT_CONFIG.PAGE_WIDTH_PIXELS,
    height: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    logging: true,
    imageTimeout: EXPORT_CONFIG.IMAGE_TIMEOUT,
    removeContainer: true,
    onclone: (clonedDoc) => {
      console.log('Document cloned for rendering');
      const clonedElement = clonedDoc.getElementById('onepager-clone');
      if (clonedElement) {
        console.log('Clone element found in cloned document');
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
