export const EXPORT_CONFIG = {
  PAGE_WIDTH_INCHES: 8.5,
  PAGE_WIDTH_PIXELS: 816,
  SCALE_FACTOR: 3,
  IMAGE_TIMEOUT: 15000,
  IMAGE_QUALITY: 1.0,
  BACKGROUND_COLOR: '#ffffff',
  BORDER_COLOR: '#acdfeb',
  BORDER_WIDTH: 6,
  OUTLINE_WIDTH: 2,
  OUTLINE_COLOR: 'black',
} as const;

export const PRINT_CONFIG = {
  PAGE_SIZE: 'Letter portrait',
  MARGIN: '0.25in',
} as const;

export const THEME_COLORS = {
  PRIMARY_BORDER: '#acdfeb',
  ALTERNATE_ROW: '#f9f9f9',
  WHITE: 'white',
  BLACK: 'black',
} as const;

export const TABLE_CONFIG = {
  BASE_WIDTH: 300,
  MONTH_COLUMN_WIDTH: 100,
  MAX_TABLE_WIDTH: 750,
  ELEVATOR_COLUMN_WIDTH: 150,
  TOWN_COLUMN_WIDTH: 150,
} as const;
