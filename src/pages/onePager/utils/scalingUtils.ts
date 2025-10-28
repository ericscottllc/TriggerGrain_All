import { EXPORT_CONFIG } from './constants';

export const calculateScaleFactor = (element: HTMLElement): number => {
  const container = element.parentElement;
  if (!container) return 1;

  const containerWidth = container.clientWidth - 48;
  const containerHeight = container.clientHeight - 48;
  const elementWidth = EXPORT_CONFIG.PAGE_WIDTH_PIXELS;
  const elementHeight = element.scrollHeight;

  const scaleX = containerWidth / elementWidth;
  const scaleY = containerHeight / elementHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  return scale;
};

export const applyScaleFactor = (element: HTMLElement | null): void => {
  if (!element) return;

  const scale = calculateScaleFactor(element);
  element.style.setProperty('--scale-factor', scale.toString());
};
