/**
 * URL pública del sitio. Es un marcador de posición: cámbiala aquí (y solo aquí)
 * cuando RP Puello & Asociados tenga dominio. La usan los canonical y el JSON-LD.
 */
export const SITE_URL = "https://rp-puello.example";

export const site = {
  name: "RP PUELLO",
  /** Segunda línea de la marca, debajo de `name`. */
  nameLine2: "& Asociados",
  legal: "RP Puello & Asociados",
  tagline: "La solución a tus problemas",
  product: "Préstamos semanales",
  country: "República Dominicana",
  /** Zona donde se presta (cobertura). Por ahora solo Cotuí. */
  city: "Cotuí",
  province: "Sánchez Ramírez",
  /** Dirección del negocio (oficina). No es zona de préstamo. */
  officeCity: "Nagua",
  officeProvince: "María Trinidad Sánchez",
  address: "Nagua, María Trinidad Sánchez",
  phoneDisplay: "809-753-5335",
  phoneHref: "tel:+18097535335",
  phoneE164: "+18097535335",
  whatsapp: "18097535335",
  facebookName: "RP Puello & Asociados",
  facebookHref: "https://www.facebook.com/share/1FGVjWcHDY/?mibextid=wwXIfr",
  slogan: "Préstamos semanales en Cotuí",
  url: SITE_URL,
};

export const fraudNotice =
  "RP Puello & Asociados no pide claves, códigos ni depósitos adelantados para aprobar un préstamo. Si te piden eso, no es de nosotros.";

/** Costo del préstamo (cargo único sobre el monto prestado) y mora. */
export const LOAN_CHARGE_PERCENT = 30;
export const LATE_FEE_PERCENT = 5;

export const requirements = [
  "Cédula o pasaporte, para depurar el crédito.",
  "Vivir o trabajar en Cotuí (por ahora prestamos solo ahí).",
  "Empleo o negocio propio.",
  "Una referencia personal.",
  "Un garante.",
];

export const faqs = [
  {
    q: "¿De cuánto son los préstamos y en cuánto tiempo se pagan?",
    a: "De RD$ 5,000 a RD$ 100,000. El plazo es de 10 semanas. Desde RD$ 50,000 también puedes elegir 13 semanas. La cuota es fija y la ves en la tabla antes de pedir.",
  },
  {
    q: "¿Cómo se paga?",
    a: "Semana a semana. Vamos a la puerta de tu casa o negocio, o pagas por transferencia. Como te quede más cómodo.",
  },
  {
    q: "¿Hace falta un garante?",
    a: "Sí. Se requiere un garante, con nombre, teléfono y parentesco. Sin garante no se evalúa el crédito.",
  },
  {
    q: "¿Cuánto cuesta el préstamo?",
    a: "Un cargo de 30% sobre el monto prestado, a pagar en 10 o 13 cuotas semanales fijas. Ejemplo: RD$ 10,000 a 10 semanas son 10 cuotas de RD$ 1,300 (RD$ 13,000 en total). La mora es de 5% del monto atrasado por cada semana de atraso.",
  },
  {
    q: "¿En cuánto tiempo responden?",
    a: "Por WhatsApp te respondemos lo antes posible, en horario de atención. La aprobación está sujeta a evaluación y depuración de crédito.",
  },
  {
    q: "¿Qué documentos piden?",
    a: "La cédula o el pasaporte son obligatorios y se utilizan únicamente para depurar el crédito. También se solicitan los datos del empleo o negocio propio, una referencia personal y un garante.",
  },
  {
    q: "¿Dónde prestan?",
    a: "Por ahora prestamos solo en Cotuí, provincia Sánchez Ramírez. Nuestra oficina está en Nagua, María Trinidad Sánchez, pero ahí todavía no prestamos. Si vives cerca de Cotuí, escríbenos y te decimos claro si llegamos. No inventamos cobertura.",
  },
  {
    q: "¿Me pueden pedir un depósito o una clave?",
    a: "No. Nadie de RP Puello & Asociados te pide depósito adelantado, clave ni código para aprobar. Si te lo piden, no es de nosotros.",
  },
];

export function coverageWaMessage(city?: string) {
  if (city) {
    return `Hola, quiero información sobre préstamos semanales de RP Puello & Asociados en ${city}.`;
  }
  return "Hola, quiero saber si cubren mi zona. Busco un préstamo semanal de RP Puello & Asociados.";
}

export function pageHead(path: string, title: string, description: string) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
    ],
    links: [{ rel: "canonical" as const, href: `${site.url}${path}` }],
  };
}

export function waLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const privacyWaMessage =
  "Hola, quiero pedir acceso, corrección o eliminación de mis datos personales en RP Puello & Asociados.";

export const defaultWaMessage =
  "Hola, quiero información sobre préstamos semanales de RP Puello & Asociados.";

export type NavItem = { to: string; label: string };

export const navItems: NavItem[] = [
  { to: "/planes", label: "Tabla" },
  { to: "/cobertura", label: "Cobertura" },
  { to: "/contacto", label: "Contacto" },
];

export type City = { name: string; centroOnly?: boolean };

/** Cobertura: por ahora solo Cotuí (el formulario agrega «Otra (localidad aledaña)»). */
export const cities: City[] = [{ name: "Cotuí" }];

export type LoanOption = { amount: number; weekly: number };

/** Tabla de RP Puello & Asociados: 10 semanas, 30% de cargo (total = 130% del monto). */
export const plan10: LoanOption[] = [
  { amount: 5000, weekly: 650 },
  { amount: 6000, weekly: 780 },
  { amount: 10000, weekly: 1300 },
  { amount: 15000, weekly: 1950 },
  { amount: 20000, weekly: 2600 },
  { amount: 25000, weekly: 3250 },
  { amount: 30000, weekly: 3900 },
  { amount: 40000, weekly: 5200 },
  { amount: 50000, weekly: 6500 },
  { amount: 60000, weekly: 7800 },
  { amount: 75000, weekly: 9750 },
  { amount: 80000, weekly: 10400 },
  { amount: 100000, weekly: 13000 },
];

/** 13 semanas, 30% de cargo (total = 130% del monto). Desde RD$ 50,000. */
export const plan13: LoanOption[] = [
  { amount: 50000, weekly: 5000 },
  { amount: 55000, weekly: 5500 },
  { amount: 60000, weekly: 6000 },
  { amount: 65000, weekly: 6500 },
  { amount: 70000, weekly: 7000 },
  { amount: 75000, weekly: 7500 },
  { amount: 80000, weekly: 8000 },
  { amount: 85000, weekly: 8500 },
  { amount: 90000, weekly: 9000 },
  { amount: 95000, weekly: 9500 },
  { amount: 100000, weekly: 10000 },
];

export type PlanId = 10 | 13;

export const MIN_PLAN13_AMOUNT = 50000;

export function optionsFor(plan: PlanId): LoanOption[] {
  return plan === 10 ? plan10 : plan13;
}

export function findOption(plan: PlanId, amount: number): LoanOption | undefined {
  return optionsFor(plan).find((o) => o.amount === amount);
}

export function weeklyFor(plan: PlanId, amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const listed = findOption(plan, amount);
  if (listed) return listed.weekly;
  // Fuera de la tabla: mismo 30% de cargo para ambos plazos.
  const total = 1 + LOAN_CHARGE_PERCENT / 100;
  return Math.round((amount * total) / plan);
}

export function totalPay(weekly: number, weeks: PlanId) {
  return weekly * weeks;
}

export function formatRD(n: number) {
  return `RD$ ${n.toLocaleString("es-DO")}`;
}

export function formatCedula(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return value.trim();
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

export function formatPhone(value: string) {
  const nums = value.replace(/\D/g, "").slice(0, 10);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 6)}-${nums.slice(6)}`;
}

export const benefits = [
  {
    title: "Aprobación rápida",
    body: "Te respondemos pronto. Sin vueltas innecesarias ni papeles eternos.",
  },
  {
    title: "Total discreción",
    body: "Tu caso se trata en privado. Solo hablamos contigo.",
  },
  {
    title: "Pago fácil",
    body: "Vamos a la puerta de tu casa o negocio, o pagas por transferencia. Como te quede más cómodo.",
  },
  {
    title: "Atención personalizada",
    body: "Te atendemos de persona a persona. No eres un número en una fila.",
  },
];

export const steps = [
  {
    n: "01",
    title: "Elige el monto",
    body: "Mira la tabla de 10 o 13 semanas y escoge lo que te sirve.",
  },
  {
    n: "02",
    title: "Llena la solicitud",
    body: "Tus datos, dirección, trabajo, un garante y una referencia. Te toma unos 5 minutos.",
  },
  {
    n: "03",
    title: "Te contactamos",
    body: "Te escribimos por WhatsApp para confirmar y coordinar.",
  },
  {
    n: "04",
    title: "Pagas semana a semana",
    body: "Cuota fija. Vamos a tu casa o negocio, o pagas por transferencia.",
  },
];
