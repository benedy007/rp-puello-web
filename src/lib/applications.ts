/** Historial que guardaba la versión anterior en localStorage (ahora se borra al cargar). */
export const LEGACY_HISTORY_KEY = "rp-puello-solicitudes";

export type PersonalRef = {
  name: string;
  phone: string;
  relation: string;
};

export type LoanApplication = {
  id: string;
  source: string;
  sourceName: string;
  name: string;
  nickname: string;
  idKind: string;
  cedula: string;
  phone: string;
  phone2: string;
  city: string;
  sector: string;
  street: string;
  house: string;
  housing: string;
  housingTime: string;
  landmark: string;
  latitude: string;
  longitude: string;
  workKind: string;
  workName: string;
  workRole: string;
  workPhone: string;
  workTime: string;
  workSector: string;
  workStreet: string;
  workHouse: string;
  workLandmark: string;
  workLatitude: string;
  workLongitude: string;
  ref1: PersonalRef;
  guarantor: PersonalRef;
  plan: 10 | 13;
  amount: number;
  weekly: number;
  total: number;
  notes: string;
  /** Momento en que la persona marcó la autorización (Ley 172-13 / buró). */
  consentAt: string;
  createdAt: string;
};

/**
 * Arma la solicitud en memoria para la pantalla de revisión y el mensaje de
 * WhatsApp. Ya no se guarda historial en el teléfono (antes: hasta 30
 * solicitudes completas en localStorage, con cédula, GPS y datos de terceros).
 */
export function buildApplication(
  input: Omit<LoanApplication, "id" | "createdAt">,
): LoanApplication {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
