import { describe, expect, it } from 'vitest';
import { AMBIENT_IDS, AMBIENTS, BOARD_COLORS, CARD_COLORS, CARD_THEMES, isDark, luminance } from '../appearance';

const ratio = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** Etapa 8 · legibilidad en todos los ambientes (WCAG AA: 4,5 : 1 para texto normal). */
describe('legibilidad', () => {
  it('texto y texto atenuado del tablero cumplen AA en cada color', () => {
    for (const [id, p] of Object.entries(BOARD_COLORS)) {
      expect(ratio(p.bg, p.ink), id + ' ink').toBeGreaterThanOrEqual(4.5);
      expect(ratio(p.bg, p.muted), id + ' muted').toBeGreaterThanOrEqual(3);
    }
  });
  it('texto de cada tema de tarjeta cumple AA', () => {
    for (const [id, t] of Object.entries(CARD_THEMES)) expect(ratio(t.bg, t.ink), id).toBeGreaterThanOrEqual(4.5);
  });
  it('en los colores de tarjeta el texto (oscuro o claro según el fondo) se lee', () => {
    for (const c of CARD_COLORS) expect(ratio(c.bg, isDark(c.bg) ? '#F4F1EA' : '#1F1D1A'), c.name).toBeGreaterThanOrEqual(4.5);
  });
  it('cada ambiente combina tablero y tarjeta existentes', () => {
    for (const id of AMBIENT_IDS) { expect(BOARD_COLORS[AMBIENTS[id].theme.board]).toBeTruthy(); expect(CARD_THEMES[AMBIENTS[id].theme.card]).toBeTruthy(); }
  });
});
