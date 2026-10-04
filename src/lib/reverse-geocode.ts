/**
 * Geocodificación inversa con Nominatim (OpenStreetMap), llamada desde el
 * navegador cuando la persona comparte la ubicación de la vivienda.
 *
 * Política de uso de Nominatim: una sola petición por cada vez que se comparte
 * la ubicación, sin reintentos, con tiempo límite. Si falla, devuelve null y el
 * formulario queda como estaba. Solo se envían las coordenadas (ningún otro
 * dato del formulario).
 */
const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const TIMEOUT_MS = 6000;

export type ReverseAddress = {
  /** Pueblo o ciudad (city/town/village/municipality, o county). */
  city: string;
  /** Sector o barrio (suburb/neighbourhood/quarter/hamlet). */
  sector: string;
  /** Calle (road). */
  street: string;
};

type NominatimAddress = Partial<
  Record<
    | "road"
    | "suburb"
    | "neighbourhood"
    | "quarter"
    | "hamlet"
    | "city"
    | "town"
    | "village"
    | "municipality"
    | "county",
    string
  >
>;

function first(address: NominatimAddress, keys: Array<keyof NominatimAddress>) {
  for (const key of keys) {
    const value = address[key]?.trim();
    if (value) return value;
  }
  return "";
}

/** Convierte la respuesta de Nominatim en pueblo, sector y calle. */
export function mapNominatimAddress(address: NominatimAddress): ReverseAddress {
  const city = first(address, ["city", "town", "village", "municipality", "county"]);
  let sector = first(address, ["suburb", "neighbourhood", "quarter", "hamlet"]);
  // Ej. La Romana: { city: "La Romana", town: "Caleta" } → Caleta es el sector.
  if (!sector && address.city && address.town && address.town !== address.city) {
    sector = address.town.trim();
  }
  return { city, sector, street: first(address, ["road"]) };
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  { signal }: { signal?: AbortSignal } = {},
): Promise<ReverseAddress | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = window.setTimeout(abort, TIMEOUT_MS);
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
      "accept-language": "es",
      zoom: "18",
      addressdetails: "1",
    });
    const response = await fetch(`${ENDPOINT}?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      credentials: "omit",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { address?: NominatimAddress };
    if (!data?.address) return null;
    const found = mapNominatimAddress(data.address);
    return found.city || found.sector || found.street ? found : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

/** Minúsculas, sin tildes ni espacios repetidos. */
export function normalizePlace(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Busca el pueblo en la lista de la web. Acepta nombres oficiales largos:
 * «Villa Montellano» → Montellano, «San Felipe de Puerto Plata» → Puerto Plata.
 */
export function matchPlace(found: string, options: string[]) {
  const target = normalizePlace(found);
  if (!target) return "";
  for (const option of options) {
    if (normalizePlace(option) === target) return option;
  }
  for (const option of options) {
    const name = normalizePlace(option);
    if (name && target.endsWith(` ${name}`)) return option;
  }
  return "";
}

/** Busca el sector en la lista del pueblo («Barrio Los Cacaos» → Los Cacaos). */
export function matchSector(found: string, options: string[]) {
  const strip = (value: string) =>
    normalizePlace(value).replace(/^(barrio|sector|ensanche|urbanizacion|reparto) /, "");
  const target = strip(found);
  if (!target) return "";
  return options.find((option) => strip(option) === target) ?? "";
}
