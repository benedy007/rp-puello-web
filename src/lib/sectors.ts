export const OTHER_SECTOR = "Otro";
export const OTHER_CITY = "Otra";

/**
 * Sectores por pueblo. Cotuí queda sin lista por ahora (faltan los sectores
 * confirmados por RP Puello & Asociados): el formulario muestra solo «Otro» y
 * la persona escribe su sector, o lo llena la ubicación compartida.
 */
const lists: Record<string, string[]> = {
  Cotuí: [],
};

export function sectorsFor(city: string): string[] {
  const list = lists[city] ?? ["Centro"];
  return [...list, OTHER_SECTOR];
}
