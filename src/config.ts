export const API_URL = import.meta.env.VITE_API_URL || 'http://alashmar.runasp.net/api';

export const FONT_FAMILIES = [
  'Inter', 'Poppins', 'Nunito', 'Montserrat', 'Roboto', 'Open Sans', 'Lato',
  'Tajawal', 'Cairo',
  'Arial', 'Georgia', 'Courier New',
];

export const FONT_FAMILIES_GROUPED = [
  { group: 'Latin', fonts: ['Inter', 'Poppins', 'Nunito', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Arial', 'Georgia', 'Courier New'] },
  { group: 'Arabic', fonts: ['Tajawal', 'Cairo'] },
];