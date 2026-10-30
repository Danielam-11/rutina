
/**
 * Paleta pastel clara: fondo blanco, acentos suaves
 * y tarjetas pastel por rutina.
 */
export const Colors = {
  bg: '#FFFFFF',
  bgElevated: '#FAFAFC',
  surface: '#F7F5FF',
  surfaceAlt: '#F0EDFA',
  border: '#E8E4F4',
  primary: '#A89BFF',
  primaryDark: '#8B7CFF',
  primarySoft: 'rgba(168,155,255,0.14)',
  text: '#2A2540',
  textMuted: '#7A7499',
  textFaint: '#B0AAC8',
  success: '#8FE0C0',
  warning: '#FFE29A',
  danger: '#FFB0BE',
} as const;
/** Colores pastel para identificar cada rutina */
export const RoutineColors = [
  '#C4BBFF', // violeta suave
  '#FFC4AE', // durazno
  '#FFE6A8', // amarillo crema
  '#A8EFD2', // menta
  '#B3DAFF', // cielo
  '#FFC2D4', // rosa
  '#D9C2FF', // lavanda
  '#A8E4EC', // turquesa
];
export const Gradients = {
  primary: ['#C4BBFF', '#A89BFF'] as const,
  bg: ['#FFFFFF', '#FAFAFC'] as const,
};
export const Radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const ROUTINE_EMOJIS = ['☀️', '🌙', '💪', '📚', '🧘', '🏃', '💼', '🍳', '🧹', '🎯', '💧', '🛏️'];
export const STEP_EMOJIS = ['✅', '🪥', '🚿', '💧', '🧘', '🏋️', '📖', '✍️', '☕', '🍎', '🛏️', '📵', '🎧', '🚶', '💊', '🧴'];
/** Mezcla un color hex con transparencia */
export function withAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}