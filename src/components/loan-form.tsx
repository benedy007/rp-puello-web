import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoanCost } from "@/components/loan-cost";
import { buildApplication, LEGACY_HISTORY_KEY, type LoanApplication } from "@/lib/applications";
import { track, withUtm } from "@/lib/analytics";
import { matchPlace, matchSector, reverseGeocode, type ReverseAddress } from "@/lib/reverse-geocode";
import { OTHER_CITY, OTHER_SECTOR, sectorsFor } from "@/lib/sectors";
import {
  cities,
  formatCedula,
  formatPhone,
  formatRD,
  MIN_PLAN13_AMOUNT,
  optionsFor,
  site,
  totalPay,
  waLink,
  weeklyFor,
  type PlanId,
} from "@/lib/site";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "rp-puello-solicitud-borrador";

/**
 * Borrador solo en sessionStorage: se pierde al cerrar la pestaña y se borra al
 * enviar por WhatsApp. Nunca en localStorage (persistente y visible para quien
 * use el mismo teléfono después).
 */
const draftStore = {
  get: () => {
    try {
      return sessionStorage.getItem(DRAFT_KEY);
    } catch {
      return null;
    }
  },
  set: (value: string) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, value);
    } catch {
      /* almacenamiento lleno o bloqueado: seguimos sin borrador */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* noop */
    }
  },
};

/** Elimina lo que dejó guardado la versión anterior del formulario en localStorage. */
function purgeLegacyStorage() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(LEGACY_HISTORY_KEY);
  } catch {
    /* noop */
  }
}
const STEP_LABELS = ["Origen", "Dirección", "Trabajo", "Referencias"];

/** Opciones de «¿Cómo llegó a la compañía?». */
const SOURCES = ["Facebook", "Instagram", "Google", "Una persona"];

const GEO_NOTICE = "Llenamos la dirección con tu ubicación. Revísala y escribe el número de casa.";

const relations = [
  "Madre",
  "Padre",
  "Esposo/a",
  "Hijo/a",
  "Hermano/a",
  "Tío/a",
  "Primo/a",
  "Suegro/a",
  "Amigo/a",
  "Vecino/a",
  "Compañero de trabajo",
  "Otro",
];

function read(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}

function waList(lines: Array<string | false | undefined>) {
  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function maskPhone(event: FormEvent<HTMLInputElement>) {
  event.currentTarget.value = formatPhone(event.currentTarget.value);
}

const MissingContext = createContext("");

function validateStep(step: number, data: FormData): { message: string; field: string } | null {
  const g = (key: string) => String(data.get(key) ?? "").trim();
  const miss = (field: string, message: string) => ({ field, message });
  if (step === 0) {
    if (!SOURCES.includes(g("source"))) {
      return miss("source", "Elige cómo llegó a la compañía.");
    }
    if (g("source") === "Una persona" && !g("sourceName")) {
      return miss("sourceName", "Escribe el nombre de la persona que lo refirió.");
    }
    if (!g("name")) return miss("name", "Escribe el nombre completo.");
    if (!g("nickname")) return miss("nickname", "Escribe el apodo.");
    const idKind = g("idKind");
    if (idKind !== "Cédula" && idKind !== "Pasaporte") {
      return miss("idKind", "Elige cédula o pasaporte.");
    }
    if (!g("cedula")) {
      return miss(
        "cedula",
        idKind === "Pasaporte"
          ? "Escribe el número de pasaporte. Lo usamos para depurar el crédito."
          : "Escribe la cédula. La usamos para depurar el crédito.",
      );
    }
    if (idKind === "Cédula" && digits(g("cedula")).length !== 11) {
      return miss("cedula", "La cédula debe tener 11 dígitos. La usamos para depurar el crédito.");
    }
    if (idKind === "Pasaporte" && g("cedula").replace(/\s/g, "").length < 6) {
      return miss("cedula", "Escribe el número de pasaporte completo. Lo usamos para depurar el crédito.");
    }
    if (!g("phone") || digits(g("phone")).length < 10) {
      return miss("phone", "Escribe un teléfono válido, preferible WhatsApp.");
    }
    if (g("phone2") && digits(g("phone2")).length < 10) {
      return miss("phone2", "Si pones un segundo teléfono, debe ser un número válido.");
    }
    return null;
  }
  if (step === 1) {
    const mode = g("homeMode");
    if (mode === "location") {
      if (!g("lat") || !g("lng")) return miss("share-location", "Comparte la ubicación de la vivienda.");
      if (!g("city")) return miss("city", "Elige el pueblo.");
      if (g("city") === OTHER_CITY && !g("cityOther")) {
        return miss("cityOther", "Si eliges Otra, escribe la localidad.");
      }
      if (g("sectorPick") === OTHER_SECTOR && !g("sectorOther")) {
        return miss("sectorOther", "Si eliges Otro, escribe el sector.");
      }
      if (!g("house")) return miss("house", "Escribe el número de la casa.");
      if (!g("housing")) return miss("housing", "Indica si la casa es propia, rentada o familiar.");
      if (g("housing") === "Rentada" && !g("housingTime")) {
        return miss("housingTime", "Si la casa es rentada, indica cuánto tiempo llevas viviendo ahí.");
      }
      if (!g("landmark")) return miss("landmark-location", "Escribe la referencia: frente o al lado de qué queda.");
      return null;
    }
    if (mode !== "address") {
      return miss("homeMode", "Elige una opción: escribir la dirección o compartir la ubicación.");
    }
    if (!g("city")) return miss("city", "Elige la ciudad.");
    if (g("city") === OTHER_CITY && !g("cityOther")) {
      return miss("cityOther", "Si eliges Otra, escribe la localidad.");
    }
    if (!g("sectorPick")) return miss("sectorPick", "Elige el sector.");
    if (g("sectorPick") === OTHER_SECTOR && !g("sectorOther")) {
      return miss("sectorOther", "Si eliges Otro, escribe el sector.");
    }
    if (!g("street")) return miss("street", "Escribe la calle.");
    if (!g("house")) return miss("house", "Escribe el número de la casa.");
    if (!g("housing")) return miss("housing", "Indica si la casa es propia, rentada o familiar.");
    if (g("housing") === "Rentada" && !g("housingTime")) {
      return miss("housingTime", "Si la casa es rentada, indica cuánto tiempo llevas viviendo ahí.");
    }
    if (!g("landmark")) return miss("landmark", "Escribe la referencia: frente o al lado de qué queda.");
    return null;
  }
  if (step === 2) {
    if (!g("workKind")) return miss("workKind", "Indica si es empleo o negocio propio.");
    if (!g("workName")) return miss("workName", "Escribe el nombre del trabajo o negocio.");
    if (!g("workRole")) return miss("workRole", "Escribe el cargo o qué hace en el negocio.");
    if (!g("workPhone") || digits(g("workPhone")).length < 10) {
      return miss("workPhone", "El teléfono laboral debe ser un número válido.");
    }
    if (!g("workTime")) return miss("workTime", "Indica cuánto tiempo tiene en ese trabajo o negocio.");
    const mode = g("workMode");
    if (mode === "location") {
      if (!g("workLat") || !g("workLng")) return miss("share-work-location", "Comparte la ubicación del trabajo.");
      if (!g("workHouse")) return miss("workHouse", "Escribe el número del local.");
      if (!g("workLandmark")) return miss("workLandmark", "Escribe la referencia del trabajo.");
      return null;
    }
    if (mode !== "address") {
      return miss("workMode", "En el trabajo, elige escribir la dirección o compartir la ubicación.");
    }
    if (!g("workSector")) return miss("workSector", "Escribe el sector del trabajo.");
    if (!g("workStreet")) return miss("workStreet", "Escribe la calle del trabajo.");
    if (!g("workHouse")) return miss("workHouse", "Escribe el número del local.");
    return null;
  }
  if (!g("ref1Name")) return miss("ref1Name", "Escribe el nombre de la referencia personal.");
  if (!g("ref1Phone") || digits(g("ref1Phone")).length < 10) {
    return miss("ref1Phone", "La referencia personal requiere un teléfono válido.");
  }
  if (!g("ref1Relation")) return miss("ref1Relation", "Indica el parentesco de la referencia personal.");
  if (!g("guarantorName")) return miss("guarantorName", "Escribe el nombre del garante.");
  if (!g("guarantorPhone") || digits(g("guarantorPhone")).length < 10) {
    return miss("guarantorPhone", "El teléfono del garante debe ser un número válido.");
  }
  if (!g("guarantorRelation")) return miss("guarantorRelation", "Indica el parentesco del garante.");
  const amount = Number(data.get("amount"));
  const plan = Number(data.get("plan")) === 13 ? 13 : 10;
  if (!Number.isFinite(amount) || amount < 5000) {
    return miss("amount", "Escribe un monto de al menos RD$ 5,000.");
  }
  if (plan === 13 && amount < MIN_PLAN13_AMOUNT) {
    return miss("plan", `El plazo de 13 semanas es desde ${formatRD(MIN_PLAN13_AMOUNT)}. Para montos menores usa 10 semanas.`);
  }
  if (g("consent") !== "si") {
    return miss(
      "consent",
      "Para continuar, marca la autorización para tratar tus datos y consultar el buró de crédito.",
    );
  }
  return null;
}

export function LoanForm() {
  const [source, setSource] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [name, setName] = useState("");
  const [idKind, setIdKind] = useState("Cédula");
  const [cedula, setCedula] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [sectorPick, setSectorPick] = useState("");
  const [sectorOther, setSectorOther] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [housing, setHousing] = useState("");
  const [housingTime, setHousingTime] = useState("");
  const [landmark, setLandmark] = useState("");
  const [plan, setPlan] = useState<PlanId>(10);
  const [amount, setAmount] = useState(10000);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [workLocation, setWorkLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState<"" | "home" | "work">("");
  const [homeMode, setHomeMode] = useState<"" | "address" | "location">("");
  const [workMode, setWorkMode] = useState<"" | "address" | "location">("");
  const [error, setError] = useState("");
  const [missing, setMissing] = useState("");
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<LoanApplication | null>(null);
  const [consent, setConsent] = useState(false);
  /** true después de pulsar «Enviar por WhatsApp»: ya no se vuelve a guardar borrador. */
  const sentRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  /** Borrador pendiente de aplicar a campos que se muestran después de restaurar. */
  const pendingDraftRef = useRef<Record<string, string> | null>(null);
  const [draftPass, setDraftPass] = useState(0);
  /** Campos que la persona cambió a mano después de cargar la página: la ubicación no los toca. */
  const editedRef = useRef({ city: false, sector: false, street: false });
  const geoAbortRef = useRef<AbortController | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoNotice, setGeoNotice] = useState("");
  const [addressFill, setAddressFill] = useState(0);

  useEffect(() => {
    if (!saved) return;
    track("loan_form_review", { page_path: window.location.pathname });
    window.scrollTo({ top: 0, behavior: "auto" });
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [saved]);

  useEffect(() => {
    // El pueblo no se preselecciona (ni con ?ciudad=): lo elige la ubicación o la persona.
    purgeLegacyStorage();
    const raw = draftStore.get();
    if (!raw || !formRef.current) return;
    try {
      const draft = JSON.parse(raw) as Record<string, string>;
      const setIf = (value: string | undefined, apply: (next: string) => void) => {
        if (value) apply(value);
      };
      if (draft.source && draft.source !== "WhatsApp") setSource(draft.source);
      setIf(draft.sourceName, setSourceName);
      setIf(draft.name, setName);
      if (draft.idKind === "Cédula" || draft.idKind === "Pasaporte") setIdKind(draft.idKind);
      else if (draft.cedula) setIdKind("Cédula");
      setIf(draft.cedula, setCedula);
      setIf(draft.phone, setPhone);
      setIf(draft.city, setCity);
      setIf(draft.cityOther, setCityOther);
      setIf(draft.sectorPick, setSectorPick);
      setIf(draft.sectorOther, setSectorOther);
      setIf(draft.street, setStreet);
      setIf(draft.house, setHouse);
      setIf(draft.housing, setHousing);
      setIf(draft.housingTime, setHousingTime);
      setIf(draft.landmark, setLandmark);
      if (draft.homeMode === "address" || draft.homeMode === "location") {
        setHomeMode(draft.homeMode);
      }
      if (draft.workMode === "address" || draft.workMode === "location") {
        setWorkMode(draft.workMode);
      }
      if (draft.lat && draft.lng && Number.isFinite(Number(draft.lat))) {
        setLocation({ lat: Number(draft.lat), lng: Number(draft.lng) });
      }
      if (draft.workLat && draft.workLng && Number.isFinite(Number(draft.workLat))) {
        setWorkLocation({ lat: Number(draft.workLat), lng: Number(draft.workLng) });
      }
      setIf(draft.notes, setNotes);
      if (draft.plan === "13" || draft.plan === "10") {
        setPlan(draft.plan === "13" ? 13 : 10);
      }
      if (draft.amount && Number(draft.amount) >= 5000) setAmount(Number(draft.amount));
      if (draft.consent === "si") setConsent(true);
      const draftStep = Number(draft.step);
      if (draftStep >= 0 && draftStep <= 3) setStep(draftStep);
      // Los campos que dependen de homeMode/workMode aparecen en el siguiente render.
      pendingDraftRef.current = draft;
      setDraftPass(1);
      for (const el of formRef.current.elements) {
        if (
          !(el instanceof HTMLInputElement) &&
          !(el instanceof HTMLSelectElement) &&
          !(el instanceof HTMLTextAreaElement)
        ) {
          continue;
        }
        if (!el.name || el.value || !draft[el.name]) continue;
        el.value = draft[el.name];
      }
    } catch {
      draftStore.clear();
    }
  }, []);

  useEffect(() => {
    const draft = pendingDraftRef.current;
    const form = formRef.current;
    if (!draftPass || !draft || !form) return;
    pendingDraftRef.current = null;
    for (const el of form.elements) {
      if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) continue;
      if (el.type === "hidden" || el.type === "checkbox") continue;
      if (!el.name || el.value || !draft[el.name]) continue;
      el.value = draft[el.name];
    }
  }, [draftPass]);

  useEffect(() => () => geoAbortRef.current?.abort(), []);

  const saveDraftRef = useRef<() => void>(() => {});
  saveDraftRef.current = () => {
    const form = formRef.current;
    if (!form || sentRef.current) return;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    data.step = String(step);
    if (source) data.source = source;
    if (sourceName) data.sourceName = sourceName;
    if (name) data.name = name;
    if (idKind) data.idKind = idKind;
    if (phone) data.phone = phone;
    if (cedula) data.cedula = cedula;
    if (homeMode) data.homeMode = homeMode;
    if (workMode) data.workMode = workMode;
    if (location) {
      data.lat = String(location.lat);
      data.lng = String(location.lng);
    }
    if (workLocation) {
      data.workLat = String(workLocation.lat);
      data.workLng = String(workLocation.lng);
    }
    draftStore.set(JSON.stringify(data));
  };

  useEffect(() => {
    const save = () => saveDraftRef.current();
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  const skipDraftSave = useRef(true);
  useEffect(() => {
    if (skipDraftSave.current) {
      skipDraftSave.current = false;
      return;
    }
    saveDraftRef.current();
  }, [step, source, sourceName, idKind, homeMode, workMode, location, workLocation, addressFill]);

  const canChoose13 = amount >= MIN_PLAN13_AMOUNT;
  const options = optionsFor(plan);
  const weekly = weeklyFor(plan, amount);
  const total = totalPay(weekly, plan);
  const sectorOptions = city ? sectorsFor(city === OTHER_CITY ? "" : city) : [];

  function shareLocation(target: "home" | "work") {
    if (!navigator.geolocation) {
      setError("Este dispositivo no permite compartir la ubicación.");
      return;
    }
    setError("");
    setLocating(target);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        };
        if (target === "home") setLocation(next);
        else setWorkLocation(next);
        setLocating("");
        const sharedField = target === "home" ? "share-location" : "share-work-location";
        setMissing((current) => (current === sharedField ? "" : current));
        if (target === "home") lookupAddress(next);
        const form = formRef.current;
        if (!form) return;
        const data = Object.fromEntries(new FormData(form).entries());
        if (target === "home") {
          data.lat = String(next.lat);
          data.lng = String(next.lng);
        } else {
          data.workLat = String(next.lat);
          data.workLng = String(next.lng);
        }
        if (!sentRef.current) draftStore.set(JSON.stringify(data));
      },
      () => {
        setLocating("");
        setError(
          "No se pudo obtener la ubicación. Activa el permiso de ubicación e inténtalo de nuevo.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  /** Una sola consulta a Nominatim por cada vez que se comparte la ubicación. */
  function lookupAddress(point: { lat: number; lng: number }) {
    geoAbortRef.current?.abort();
    const controller = new AbortController();
    geoAbortRef.current = controller;
    setGeoNotice("");
    setGeoBusy(true);
    void reverseGeocode(point.lat, point.lng, { signal: controller.signal }).then((found) => {
      if (geoAbortRef.current !== controller) return;
      geoAbortRef.current = null;
      setGeoBusy(false);
      if (found) applyGeoRef.current(found);
    });
  }

  /**
   * La ubicación manda: rellena (o actualiza al volver a compartir) pueblo, sector y
   * calle, salvo lo que la persona haya cambiado a mano después de cargar la página.
   */
  const applyGeoRef = useRef<(found: ReverseAddress) => void>(() => {});
  applyGeoRef.current = (found) => {
    const edited = editedRef.current;
    let filled = false;
    let nextCity = city;
    if (found.city && !edited.city) {
      const known = matchPlace(found.city, cities.map((item) => item.name));
      nextCity = known || OTHER_CITY;
      setCity(nextCity);
      setCityOther(known ? "" : found.city);
      filled = true;
    }
    if (!edited.sector) {
      const list = sectorsFor(nextCity === OTHER_CITY ? "" : nextCity);
      if (found.sector) {
        const known = matchSector(found.sector, list.filter((item) => item !== OTHER_SECTOR));
        setSectorPick(known || OTHER_SECTOR);
        setSectorOther(known ? "" : found.sector);
        filled = true;
      } else if (nextCity !== city || (sectorPick && !list.includes(sectorPick))) {
        // Cambió el pueblo y no hay sector nuevo: el anterior ya no aplica.
        setSectorPick("");
        setSectorOther("");
      }
    }
    if (found.street && !edited.street) {
      setStreet(found.street);
      filled = true;
    }
    if (!filled) return;
    setGeoNotice(GEO_NOTICE);
    setAddressFill((n) => n + 1);
    window.setTimeout(() => {
      const houseInput = document.getElementById("house");
      if (!(houseInput instanceof HTMLInputElement) || houseInput.offsetParent === null) return;
      houseInput.scrollIntoView({ behavior: "smooth", block: "center" });
      houseInput.focus({ preventScroll: true });
    }, 80);
  };

  /** Cambio de pueblo hecho a mano en el select. */
  function onCityChange(next: string) {
    editedRef.current.city = true;
    setCity(next);
    setCityOther("");
    setSectorPick("");
    setSectorOther("");
  }

  function onEdit() {
    sentRef.current = false;
    setSaved(null);
    setStep(0);
    requestAnimationFrame(() => {
      document
        .getElementById("formulario")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /** Al enviar: borrar el borrador de este navegador y no volver a guardarlo. */
  function onSend() {
    track("loan_form_whatsapp_redirect");
    sentRef.current = true;
    draftStore.clear();
    purgeLegacyStorage();
  }

  function showMissing(problem: { message: string; field: string }) {
    setError(problem.message);
    setMissing(problem.field);
    window.setTimeout(() => {
      const el = document.getElementById(problem.field);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const target =
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
          ? el
          : el.querySelector("input, select, textarea, button");
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    }, 60);
  }

  function onSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const form = event?.currentTarget ?? formRef.current;
    if (!form) return;
    setError("");
    const data = new FormData(form);
    if (source) data.set("source", source);
    if (source === "Una persona" && sourceName) data.set("sourceName", sourceName);
    if (name) data.set("name", name);
    if (idKind) data.set("idKind", idKind);
    if (phone) data.set("phone", phone);
    if (cedula) data.set("cedula", cedula);
    if (homeMode) data.set("homeMode", homeMode);
    if (workMode) data.set("workMode", workMode);
    if (consent) data.set("consent", "si");
    const nextSource = read(data, "source");
    const nextSourceName = read(data, "sourceName");
    const nextName = read(data, "name");
    const nextNickname = read(data, "nickname");
    const nextCedula = read(data, "cedula");
    const nextPhone = read(data, "phone");
    const nextPhone2 = read(data, "phone2");
    const nextCityPick = read(data, "city");
    const nextCityOther = read(data, "cityOther");
    const nextCity =
      nextCityPick === OTHER_CITY ? nextCityOther : nextCityPick;
    const nextSectorPick = read(data, "sectorPick");
    const nextSectorOther = read(data, "sectorOther");
    const nextSector =
      nextSectorPick === OTHER_SECTOR ? nextSectorOther : nextSectorPick;
    const nextStreet = read(data, "street");
    const nextHouse = read(data, "house");
    const nextHousing = read(data, "housing");
    const nextHousingTime = read(data, "housingTime");
    const nextLandmark = read(data, "landmark");
    const workKind = read(data, "workKind");
    const workName = read(data, "workName");
    const workRole = read(data, "workRole");
    const workPhone = read(data, "workPhone");
    const workTime = read(data, "workTime");
    const workSector = read(data, "workSector");
    const workStreet = read(data, "workStreet");
    const workHouse = read(data, "workHouse");
    const workLandmark = read(data, "workLandmark");
    const ref1 = {
      name: read(data, "ref1Name"),
      phone: read(data, "ref1Phone"),
      relation: read(data, "ref1Relation"),
    };
    const nextPlan = Number(data.get("plan")) === 13 ? 13 : 10;
    const nextAmount = Number(data.get("amount"));
    const nextNotes = read(data, "notes");
    const nextWeekly = weeklyFor(nextPlan, nextAmount);

    if (step < 3) {
      const problem = validateStep(step, data);
      if (problem) {
        showMissing(problem);
        return;
      }
      setError("");
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    for (const index of [0, 1, 2, 3]) {
      const problem = validateStep(index, data);
      if (problem) {
        setStep(index);
        showMissing(problem);
        return;
      }
    }

    const guarantor = {
      name: read(data, "guarantorName"),
      phone: read(data, "guarantorPhone"),
      relation: read(data, "guarantorRelation"),
    };

    const docDigits = nextCedula.replace(/\D/g, "");
    const looksLikeCedula = docDigits.length === 11 && !/[A-Za-z]/.test(nextCedula);
    const nextIdKind = looksLikeCedula
      ? "Cédula"
      : read(data, "idKind") === "Pasaporte"
        ? "Pasaporte"
        : "Cédula";
    const nextDocument = nextIdKind === "Cédula" ? formatCedula(nextCedula) : nextCedula;

    const application = buildApplication({
      source: nextSource,
      sourceName: nextSource === "Una persona" ? nextSourceName : "",
      name: nextName,
      nickname: nextNickname,
      idKind: nextIdKind,
      cedula: nextDocument,
      phone: nextPhone,
      phone2: nextPhone2,
      city: nextCity,
      sector: nextSector,
      street: nextStreet,
      house: nextHouse,
      housing: nextHousing,
      housingTime: nextHousing === "Rentada" ? nextHousingTime : "",
      landmark: nextLandmark,
      latitude: read(data, "lat"),
      longitude: read(data, "lng"),
      workKind,
      workName,
      workRole,
      workPhone,
      workTime,
      workSector,
      workStreet,
      workHouse,
      workLandmark,
      workLatitude: read(data, "workLat"),
      workLongitude: read(data, "workLng"),
      ref1,
      guarantor,
      plan: nextPlan,
      amount: nextAmount,
      weekly: nextWeekly,
      total: totalPay(nextWeekly, nextPlan),
      notes: nextNotes,
      consentAt: new Date().toISOString(),
    });
    setSaved(application);
  }

  const message = saved
    ? waList([
        `Hola, soy ${saved.name}.`,
        "Quiero solicitar un préstamo.",
        "",
        "*Cómo llegó*",
        `- Referencia: ${saved.source}`,
        saved.sourceName ? `- Persona: ${saved.sourceName}` : "",
        "",
        "*Préstamo*",
        `- Monto: ${formatRD(saved.amount)}`,
        `- Plazo: ${saved.plan} semanas`,
        `- Cuota semanal: ${formatRD(saved.weekly)}`,
        `- Total a pagar: ${formatRD(saved.total)}`,
        saved.notes ? `- Motivo: ${saved.notes}` : "",
        "",
        "*Datos personales*",
        `- Nombre: ${saved.name}`,
        `- Apodo: ${saved.nickname}`,
        saved.idKind === "Pasaporte"
          ? `- Pasaporte: ${saved.cedula}`
          : `- Cédula: ${formatCedula(saved.cedula)}`,
        `- Teléfono: ${formatPhone(saved.phone)}`,
        saved.phone2 ? `- Segundo teléfono: ${formatPhone(saved.phone2)}` : "",
        "",
        saved.city ||
        saved.sector ||
        saved.street ||
        saved.house ||
        saved.housing ||
        saved.landmark ||
        saved.latitude
          ? "*Dirección de vivienda*"
          : "",
        saved.city ? `- Ciudad: ${saved.city}` : "",
        saved.sector ? `- Sector: ${saved.sector}` : "",
        saved.street ? `- Calle: ${saved.street}` : "",
        saved.house ? `- Casa: ${saved.house}` : "",
        saved.housing ? `- La casa es: ${saved.housing}` : "",
        saved.housingTime ? `- Tiempo viviendo: ${saved.housingTime}` : "",
        saved.landmark ? `- Referencia: ${saved.landmark}` : "",
        saved.latitude
          ? `- Ubicación: https://maps.google.com/?q=${saved.latitude},${saved.longitude}`
          : "",
        "",
        `*${saved.workKind}*`,
        `- Nombre: ${saved.workName}`,
        `- Cargo: ${saved.workRole}`,
        `- Teléfono: ${formatPhone(saved.workPhone)}`,
        `- Tiempo: ${saved.workTime}`,
        saved.workSector ? `- Sector: ${saved.workSector}` : "",
        saved.workStreet ? `- Calle: ${saved.workStreet}` : "",
        saved.workHouse ? `- Local: ${saved.workHouse}` : "",
        saved.workLandmark ? `- Referencia: ${saved.workLandmark}` : "",
        saved.workLatitude
          ? `- Ubicación: https://maps.google.com/?q=${saved.workLatitude},${saved.workLongitude}`
          : "",
        "",
        "*Referencia personal*",
        `- ${saved.ref1.name} · ${formatPhone(saved.ref1.phone)} · ${saved.ref1.relation}`,
        "",
        "*Garante*",
        `- Nombre: ${saved.guarantor.name}`,
        `- Teléfono: ${formatPhone(saved.guarantor.phone)}`,
        `- Parentesco: ${saved.guarantor.relation}`,
        "",
        "*Autorización*",
        `- Autorizo a ${site.legal} a tratar mis datos personales y a consultar mi historial en el buró de crédito para evaluar esta solicitud (Ley 172-13). Marcado el ${new Date(saved.consentAt).toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" })}`,
      ])
    : "";

  useEffect(() => {
    setMissing((current) =>
      current === "source" ||
      current === "idKind" ||
      current === "homeMode" ||
      current === "workMode"
        ? ""
        : current,
    );
  }, [source, idKind, homeMode, workMode]);

  return (
    <MissingContext.Provider value={missing}>
    <>
      {saved ? (
        <div
          ref={resultRef}
          id="solicitud-lista"
          className="scroll-mt-24 rounded-2xl border border-border bg-paper-2 p-6 sm:p-8"
        >
          <div className="flex size-11 items-center justify-center rounded-md bg-brand text-paper">
            <Check className="size-5" strokeWidth={2} />
          </div>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-display text-ink">
            Revisa tus datos
          </h2>
          <p className="mt-3 text-muted">
            Verifica que todo esté correcto antes de enviarlo. Si hay que
            corregir algo, toca Editar.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" size="lg" onClick={onEdit}>
              Editar
            </Button>
            <Button asChild variant="whatsapp" size="lg">
              <a
                href={withUtm(waLink(message))}
                onClick={onSend}
              >
                Enviar por WhatsApp
              </a>
            </Button>
          </div>
          <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
            <Row
              label="Cómo llegó"
              value={
                saved.sourceName
                  ? `${saved.source} · ${saved.sourceName}`
                  : saved.source
              }
            />
            <Row label="Nombre" value={saved.name} />
            <Row label="Apodo" value={saved.nickname} />
            <Row
              label={saved.idKind === "Pasaporte" ? "Pasaporte" : "Cédula"}
              value={
                saved.idKind === "Pasaporte" ? saved.cedula : formatCedula(saved.cedula)
              }
            />
            <Row label="Teléfono" value={formatPhone(saved.phone)} />
            {saved.phone2 ? (
              <Row label="Segundo teléfono" value={formatPhone(saved.phone2)} />
            ) : null}
            {saved.city ? <Row label="Ciudad" value={saved.city} /> : null}
            {saved.sector ? <Row label="Sector" value={saved.sector} /> : null}
            {saved.street ? <Row label="Calle" value={saved.street} /> : null}
            {saved.house ? <Row label="Casa" value={saved.house} /> : null}
            {saved.housing ? <Row label="La casa es" value={saved.housing} /> : null}
            {saved.housingTime ? (
              <Row label="Tiempo viviendo" value={saved.housingTime} />
            ) : null}
            {saved.landmark ? <Row label="Referencia" value={saved.landmark} /> : null}
            {saved.latitude ? (
              <Row
                label="Ubicación de la vivienda"
                value={`https://maps.google.com/?q=${saved.latitude},${saved.longitude}`}
              />
            ) : null}
            <Row label="Actividad" value={saved.workKind} />
            <Row label="Empresa o negocio" value={saved.workName} />
            <Row label="Cargo" value={saved.workRole} />
            <Row label="Teléfono del trabajo" value={formatPhone(saved.workPhone)} />
            <Row label="Tiempo en el trabajo" value={saved.workTime} />
            {saved.workStreet || saved.workHouse || saved.workSector || saved.workLandmark ? (
              <Row
                label="Dirección del trabajo"
                value={[saved.workStreet, saved.workHouse, saved.workSector, saved.workLandmark]
                  .filter(Boolean)
                  .join(", ")}
              />
            ) : null}
            {saved.workLatitude ? (
              <Row
                label="Ubicación del trabajo"
                value={`https://maps.google.com/?q=${saved.workLatitude},${saved.workLongitude}`}
              />
            ) : null}
            <Row
              label="Referencia personal"
              value={`${saved.ref1.name} · ${formatPhone(saved.ref1.phone)} · ${saved.ref1.relation}`}
            />
            <Row
              label="Garante"
              value={`${saved.guarantor.name} · ${formatPhone(saved.guarantor.phone)} · ${saved.guarantor.relation}`}
            />
            <Row label="Monto" value={formatRD(saved.amount)} />
            <Row label="Plazo" value={`${saved.plan} semanas`} />
            <Row label="Cuota semanal" value={formatRD(saved.weekly)} />
            <Row label="Total a pagar" value={formatRD(saved.total)} />
            {saved.notes ? <Row label="Motivo" value={saved.notes} /> : null}
          </dl>
          <p className="mt-6 text-sm font-medium text-ink">
            Si todo está bien, envía la solicitud por WhatsApp.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" size="lg" onClick={onEdit}>
              Editar
            </Button>
            <Button asChild variant="whatsapp" size="lg">
              <a
                href={withUtm(waLink(message))}
                onClick={onSend}
              >
                Enviar por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      <form
        ref={formRef}
        id="formulario"
        noValidate
        onSubmit={onSubmit}
        onInput={(event) => {
          setMissing("");
          const data = Object.fromEntries(
            new FormData(event.currentTarget).entries(),
          ) as Record<string, string>;
          data.step = String(step);
          if (source) data.source = source;
          if (homeMode) data.homeMode = homeMode;
          if (workMode) data.workMode = workMode;
          if (!sentRef.current) draftStore.set(JSON.stringify(data));
        }}
        className={
          saved
            ? "hidden"
            : "scroll-mt-24 rounded-2xl border border-border bg-paper p-6 shadow-soft sm:p-8"
        }
      >
        <ol className="mb-2 grid grid-cols-4 gap-2" aria-label="Progreso">
          {STEP_LABELS.map((label, index) => (
            <li key={label}>
              <span
                className={cn(
                  "block h-1 rounded-full",
                  index <= step ? "bg-brand" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "mt-2 block text-[11px] uppercase tracking-wide",
                  index === step ? "text-ink" : "text-muted",
                )}
              >
                {index + 1}. {label}
              </span>
            </li>
          ))}
        </ol>
        <div className={step === 0 ? "" : "hidden"}>
        <Section
          title={
            <>
              ¿Cómo llegó a la compañía?<span className="text-red"> *</span>
            </>
          }
        >
          <div className="sm:col-span-2">
            <input type="hidden" name="source" value={source} />
            <div id="source" className={cn("grid grid-cols-2 gap-3", missing === "source" && "rounded-lg ring-2 ring-red")}>
              <button
                type="button"
                onPointerDown={() => {
                  setSource("Facebook");
                  setSourceName("");
                }}
                onClick={() => {
                  setSource("Facebook");
                  setSourceName("");
                }}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors duration-150 touch-manipulation",
                  source === "Facebook"
                    ? "border-[#1877F2] bg-[#1464D2] text-white"
                    : "border-[#1877F2]/40 bg-paper text-[#1464D2] pointer-fine:hover:border-[#1877F2] pointer-fine:hover:bg-[#1464D2] pointer-fine:hover:text-white",
                )}
              >
                Facebook
              </button>
              <button
                type="button"
                onPointerDown={() => {
                  setSource("Instagram");
                  setSourceName("");
                }}
                onClick={() => {
                  setSource("Instagram");
                  setSourceName("");
                }}
                className="group w-full rounded-lg bg-[linear-gradient(135deg,#f9ce34_0%,#ee2a7b_50%,#6228d7_100%)] p-px text-left text-sm font-medium"
              >
                <span
                  className={cn(
                    "block rounded-[7px] px-4 py-3 transition-colors duration-150",
                    source === "Instagram"
                      ? "text-white"
                      : "bg-paper pointer-fine:group-hover:bg-transparent",
                  )}
                >
                  <span
                    className={
                      source === "Instagram"
                        ? "text-white"
                        : "bg-[linear-gradient(135deg,#f9ce34_0%,#ee2a7b_50%,#6228d7_100%)] bg-clip-text text-transparent pointer-fine:group-hover:bg-none pointer-fine:group-hover:text-white"
                    }
                  >
                    Instagram
                  </span>
                </span>
              </button>
              <button
                type="button"
                onPointerDown={() => {
                  setSource("Google");
                  setSourceName("");
                }}
                onClick={() => {
                  setSource("Google");
                  setSourceName("");
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors duration-150 touch-manipulation",
                  source === "Google"
                    ? "border-[#1967D2] bg-[#1967D2] text-white"
                    : "border-[#747775]/50 bg-paper text-[#1F1F1F] pointer-fine:hover:border-[#1967D2] pointer-fine:hover:bg-[#E8F0FE]",
                )}
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white">
                  <GoogleG className="size-3.5" />
                </span>
                Google
              </button>
              <button
                type="button"
                onPointerDown={() => setSource("Una persona")}
                onClick={() => setSource("Una persona")}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors duration-150 touch-manipulation",
                  source === "Una persona"
                    ? "border-brand bg-brand text-paper"
                    : "border-border bg-paper text-ink pointer-fine:hover:border-brand pointer-fine:hover:bg-brand pointer-fine:hover:text-paper",
                )}
              >
                Una persona
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              Si alguien te escribió por WhatsApp, elige Una persona y escribe su nombre.
            </p>
          </div>
          {source === "Una persona" ? (
            <Field label="Nombre de la persona" htmlFor="sourceName">
              <Input
                id="sourceName"
                name="sourceName"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Nombre de quien lo refirió"
                required
              />
            </Field>
          ) : null}
        </Section>

        <Section title="Datos personales">
          <Field label="Nombre completo" htmlFor="name">
            <Input
              id="name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="María Pérez"
              required
            />
          </Field>
          <Field label="Apodo" htmlFor="nickname">
            <Input
              id="nickname"
              name="nickname"
              placeholder="Cómo le dicen"
              required
            />
          </Field>
          <div id="idKind" className={cn("sm:col-span-2", missing === "idKind" && "rounded-lg ring-2 ring-red")}>
            <p className="text-xs font-medium uppercase tracking-kicker text-muted">
              Documento para depurar el crédito<span className="text-red"> *</span>
            </p>
            <input type="hidden" name="idKind" value={idKind} />
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onPointerDown={() => {
                  if (idKind !== "Cédula") setCedula("");
                  setIdKind("Cédula");
                }}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm font-medium touch-manipulation",
                  idKind === "Cédula"
                    ? "border-brand bg-brand text-paper"
                    : "border-border bg-paper text-ink",
                )}
              >
                Cédula
              </button>
              <button
                type="button"
                onPointerDown={() => {
                  if (idKind !== "Pasaporte") setCedula("");
                  setIdKind("Pasaporte");
                }}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm font-medium touch-manipulation",
                  idKind === "Pasaporte"
                    ? "border-brand bg-brand text-paper"
                    : "border-border bg-paper text-ink",
                )}
              >
                Pasaporte
              </button>
            </div>
          </div>
          {idKind === "Cédula" ? (
          <Field
            label="Cédula"
            htmlFor="cedula"
            hint="Formato 001-0311203-3. Solo para depurar el crédito."
          >
            <Input
              id="cedula"
              name="cedula"
              inputMode="numeric"
              value={cedula}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                if (digits.length <= 3) setCedula(digits);
                else if (digits.length <= 10)
                  setCedula(`${digits.slice(0, 3)}-${digits.slice(3)}`);
                else
                  setCedula(
                    `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`,
                  );
              }}
              placeholder="001-0311203-3"
              required
            />
          </Field>
          ) : null}
          {idKind === "Pasaporte" ? (
          <Field
            label="Pasaporte"
            htmlFor="cedula"
            hint="Número como aparece en el pasaporte. Solo para depurar el crédito."
          >
            <Input
              id="cedula"
              name="cedula"
              value={cedula}
              onChange={(e) =>
                setCedula(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))
              }
              placeholder="A12345678"
              autoCapitalize="characters"
              required
            />
          </Field>
          ) : null}
          <Field label="WhatsApp / teléfono" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="829-000-0000"
              required
            />
          </Field>
          <Field label="Segundo teléfono (opcional)" htmlFor="phone2" optional>
            <Input
              id="phone2"
              name="phone2"
              type="tel"
              placeholder="809-000-0000"
              onChange={maskPhone}
            />
          </Field>
        </Section>
        </div>

        <div className={step === 1 ? "" : "hidden"}>
        <Section title="Dirección de la vivienda">
          <p className="text-sm font-semibold text-ink sm:col-span-2">
            Elige una de las dos: ubicación o dirección.
            <span className="text-red"> *</span>
          </p>
          <input type="hidden" name="homeMode" value={homeMode} />
          <div id="homeMode" className={cn("grid gap-3 sm:col-span-2", missing === "homeMode" && "rounded-lg ring-2 ring-red")}>
            <button
              type="button"
              onClick={() => setHomeMode("location")}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm font-medium text-ink transition-colors duration-150",
                homeMode === "location"
                  ? "border-brand bg-paper-2"
                  : "border-border pointer-fine:hover:border-brand pointer-fine:hover:bg-paper-2",
              )}
            >
              Compartir ubicación
            </button>
            <button
              type="button"
              onClick={() => setHomeMode("address")}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm font-medium text-ink transition-colors duration-150",
                homeMode === "address"
                  ? "border-brand bg-paper-2"
                  : "border-border pointer-fine:hover:border-brand pointer-fine:hover:bg-paper-2",
              )}
            >
              Escribir la dirección
            </button>
          </div>
          {homeMode === "address" ? (
            <>
          <Field
            label="Ciudad"
            htmlFor="city"
            hint="Por ahora prestamos solo en Cotuí. Si vives en una localidad cercana, elige Otra y te confirmamos."
          >
            <Select
              id="city"
              name="city"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
            >
              <option value="">Elige tu pueblo</option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                  {c.centroOnly ? " (solo centro)" : ""}
                </option>
              ))}
              <option value={OTHER_CITY}>Otra (localidad aledaña)</option>
            </Select>
          </Field>
          {city === OTHER_CITY ? (
            <Field label="Escribe la localidad" htmlFor="cityOther">
              <Input
                id="cityOther"
                name="cityOther"
                value={cityOther}
                onChange={(e) => {
                  editedRef.current.city = true;
                  setCityOther(e.target.value);
                }}
                placeholder="Nombre de la localidad"
              />
            </Field>
          ) : null}
          <Field
            label="Sector"
            htmlFor="sectorPick"
            hint="Elige el barrio. Si no aparece, usa Otro."
          >
            <Select
              id="sectorPick"
              name="sectorPick"
              value={sectorPick}
              onChange={(e) => {
                editedRef.current.sector = true;
                setSectorPick(e.target.value);
              }}
              disabled={!city}
            >
              <option value="">
                {city ? "Elige el sector" : "Primero elige el pueblo"}
              </option>
              {sectorOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          {sectorPick === OTHER_SECTOR ? (
            <div className="sm:col-span-2">
              <Field label="Escribe el sector" htmlFor="sectorOther">
                <Input
                  id="sectorOther"
                  name="sectorOther"
                  value={sectorOther}
                  onChange={(e) => {
                    editedRef.current.sector = true;
                    setSectorOther(e.target.value);
                  }}
                  placeholder="Nombre del barrio"
                />
              </Field>
            </div>
          ) : null}
          <Field label="Calle" htmlFor="street">
            <Input
              id="street"
              name="street"
              value={street}
              onChange={(e) => {
                editedRef.current.street = true;
                setStreet(e.target.value);
              }}
              placeholder="Calle Duarte"
            />
          </Field>
          <Field label="Casa / número" htmlFor="house">
            <Input
              id="house"
              name="house"
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              placeholder="No. 12"
            />
          </Field>
          <Field label="La casa es" htmlFor="housing">
            <Select
              id="housing"
              name="housing"
              value={housing}
              onChange={(e) => {
                setHousing(e.target.value);
                if (e.target.value !== "Rentada") setHousingTime("");
              }}
            >
              <option value="">Elige una opción</option>
              <option value="Propia">Propia</option>
              <option value="Rentada">Rentada</option>
              <option value="Familiar">Familiar</option>
            </Select>
          </Field>
          {housing === "Rentada" ? (
            <Field
              label="Tiempo viviendo ahí"
              htmlFor="housingTime"
              hint="Ejemplo: 8 meses, 2 años."
            >
              <Input
                id="housingTime"
                name="housingTime"
                value={housingTime}
                onChange={(e) => setHousingTime(e.target.value)}
                placeholder="Ej. 2 años"
              />
            </Field>
          ) : null}
          <div className="sm:col-span-2">
            <Field label="Referencia (frente o al lado de)" htmlFor="landmark">
              <Input
                id="landmark"
                name="landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Frente al colmado El Sol"
              />
            </Field>
          </div>
            </>
          ) : null}
          {homeMode === "location" ? (
            <>
          <div className="sm:col-span-2">
            <Field
              label="Ubicación de la vivienda"
              htmlFor="share-location"
            >
              <p className="mb-3 text-sm text-ink">
                Comparte tu ubicación desde la casa y llenamos el pueblo, el sector y la
                calle. Solo escribes el número de casa.
              </p>
              <input type="hidden" name="lat" value={location?.lat ?? ""} />
              <input type="hidden" name="lng" value={location?.lng ?? ""} />
              <Button
                id="share-location"
                type="button"
                variant="outline"
                onClick={() => shareLocation("home")}
                disabled={locating === "home"}
              >
                {locating === "home"
                  ? "Obteniendo ubicación…"
                  : location
                    ? "Actualizar ubicación"
                    : "Compartir ubicación"}
              </Button>
              {location ? (
                <p className="text-sm text-brand">Ubicación recibida.</p>
              ) : null}
              {geoBusy ? (
                <p className="text-sm text-muted" role="status">
                  Buscando la dirección…
                </p>
              ) : null}
              {geoNotice ? (
                <p
                  className="rounded-md border border-brand/30 bg-paper-2 px-3 py-2 text-sm text-ink"
                  role="status"
                >
                  {geoNotice}
                </p>
              ) : null}
            </Field>
          </div>
          <Field
            label="Pueblo o ciudad"
            htmlFor="city"
            hint="Se elige solo al compartir la ubicación. Si no la compartes, elígelo aquí. Si tu pueblo no sale, usa Otra."
          >
            <Select
              id="city"
              name="city"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
            >
              <option value="">Elige tu pueblo</option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                  {c.centroOnly ? " (solo centro)" : ""}
                </option>
              ))}
              <option value={OTHER_CITY}>Otra (localidad aledaña)</option>
            </Select>
          </Field>
          {city === OTHER_CITY ? (
            <Field label="Escribe la localidad" htmlFor="cityOther">
              <Input
                id="cityOther"
                name="cityOther"
                value={cityOther}
                onChange={(e) => {
                  editedRef.current.city = true;
                  setCityOther(e.target.value);
                }}
                placeholder="Nombre de la localidad"
              />
            </Field>
          ) : null}
          <Field
            label="Sector (opcional)"
            htmlFor="sectorPick"
            optional
            hint="Si no aparece, usa Otro."
          >
            <Select
              id="sectorPick"
              name="sectorPick"
              value={sectorPick}
              onChange={(e) => {
                editedRef.current.sector = true;
                setSectorPick(e.target.value);
              }}
              disabled={!city}
            >
              <option value="">
                {city ? "Elige el sector" : "Primero elige el pueblo"}
              </option>
              {sectorOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          {sectorPick === OTHER_SECTOR ? (
            <Field label="Escribe el sector" htmlFor="sectorOther">
              <Input
                id="sectorOther"
                name="sectorOther"
                value={sectorOther}
                onChange={(e) => {
                    editedRef.current.sector = true;
                    setSectorOther(e.target.value);
                  }}
                placeholder="Nombre del barrio"
              />
            </Field>
          ) : null}
          <Field label="Calle (opcional)" htmlFor="street" optional>
            <Input
              id="street"
              name="street"
              value={street}
              onChange={(e) => {
                editedRef.current.street = true;
                setStreet(e.target.value);
              }}
              placeholder="Calle Duarte"
            />
          </Field>
          <Field label="Número de la casa" htmlFor="house">
            <Input
              id="house"
              name="house"
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              placeholder="No. 12"
            />
          </Field>
          <Field label="La casa es" htmlFor="housing">
            <Select
              id="housing"
              name="housing"
              value={housing}
              onChange={(e) => {
                setHousing(e.target.value);
                if (e.target.value !== "Rentada") setHousingTime("");
              }}
            >
              <option value="">Elige una opción</option>
              <option value="Propia">Propia</option>
              <option value="Rentada">Rentada</option>
              <option value="Familiar">Familiar</option>
            </Select>
          </Field>
          {housing === "Rentada" ? (
            <Field
              label="Tiempo viviendo ahí"
              htmlFor="housingTime"
              hint="Ejemplo: 8 meses, 2 años."
            >
              <Input
                id="housingTime"
                name="housingTime"
                value={housingTime}
                onChange={(e) => setHousingTime(e.target.value)}
                placeholder="Ej. 2 años"
              />
            </Field>
          ) : null}
          <Field label="Referencia (frente o al lado de)" htmlFor="landmark-location">
            <Input
              id="landmark-location"
              name="landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Frente al colmado El Sol"
            />
          </Field>
            </>
          ) : null}
          {homeMode !== "location" ? (
            <>
              <input type="hidden" name="lat" value={location?.lat ?? ""} />
              <input type="hidden" name="lng" value={location?.lng ?? ""} />
            </>
          ) : null}
        </Section>
        </div>

        <div className={step === 2 ? "" : "hidden"}>
        <Section title="Actividad laboral">
          <Field label="Tipo de actividad" htmlFor="workKind">
            <Select id="workKind" name="workKind" required defaultValue="">
              <option value="">Elige una opción</option>
              <option value="Empleo">Empleo</option>
              <option value="Negocio propio">Negocio propio</option>
            </Select>
          </Field>
          <Field label="Nombre de la empresa o del negocio" htmlFor="workName">
            <Input
              id="workName"
              name="workName"
              placeholder="Ej. Colmado Pérez / Empresa X"
              required
            />
          </Field>
          <Field
            label="Cargo"
            htmlFor="workRole"
            hint="Qué hace en la empresa. Ejemplo: cajera, chofer, dueño."
          >
            <Input
              id="workRole"
              name="workRole"
              placeholder="Ej. Cajera"
              required
            />
          </Field>
          <Field label="Teléfono laboral" htmlFor="workPhone">
            <Input
              id="workPhone"
              name="workPhone"
              type="tel"
              placeholder="809-000-0000"
              onChange={maskPhone}
              required
            />
          </Field>
          <Field
            label="Tiempo en la actividad"
            htmlFor="workTime"
            hint="Ejemplo: 6 meses, 2 años."
          >
            <Input
              id="workTime"
              name="workTime"
              placeholder="Ej. 1 año"
              required
            />
          </Field>
          <p className="text-sm font-semibold text-ink sm:col-span-2">
            Elige una de las dos: ubicación o dirección.
            <span className="text-red"> *</span>
          </p>
          <input type="hidden" name="workMode" value={workMode} />
          <div id="workMode" className={cn("grid gap-3 sm:col-span-2", missing === "workMode" && "rounded-lg ring-2 ring-red")}>
            <button
              type="button"
              onClick={() => setWorkMode("location")}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm font-medium text-ink transition-colors duration-150",
                workMode === "location"
                  ? "border-brand bg-paper-2"
                  : "border-border pointer-fine:hover:border-brand pointer-fine:hover:bg-paper-2",
              )}
            >
              Compartir ubicación
            </button>
            <button
              type="button"
              onClick={() => setWorkMode("address")}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm font-medium text-ink transition-colors duration-150",
                workMode === "address"
                  ? "border-brand bg-paper-2"
                  : "border-border pointer-fine:hover:border-brand pointer-fine:hover:bg-paper-2",
              )}
            >
              Escribir la dirección
            </button>
          </div>
          {workMode === "address" ? (
            <>
          <Field label="Sector" htmlFor="workSector">
            <Input
              id="workSector"
              name="workSector"
              placeholder="Centro"
            />
          </Field>
          <Field label="Calle" htmlFor="workStreet">
            <Input
              id="workStreet"
              name="workStreet"
              placeholder="Calle Principal"
            />
          </Field>
          <Field label="Local / número" htmlFor="workHouse">
            <Input
              id="workHouse"
              name="workHouse"
              placeholder="Local 3"
            />
          </Field>
            </>
          ) : null}
          {workMode === "location" ? (
            <>
          <div className="sm:col-span-2">
            <Field
              label="Ubicación del trabajo"
              htmlFor="share-work-location"
              hint="Compártela desde el lugar de trabajo. Después indica el número y la referencia."
            >
              <input type="hidden" name="workLat" value={workLocation?.lat ?? ""} />
              <input type="hidden" name="workLng" value={workLocation?.lng ?? ""} />
              <Button
                id="share-work-location"
                type="button"
                variant="outline"
                onClick={() => shareLocation("work")}
                disabled={locating === "work"}
              >
                {locating === "work"
                  ? "Obteniendo ubicación…"
                  : workLocation
                    ? "Actualizar ubicación"
                    : "Compartir ubicación"}
              </Button>
              {workLocation ? (
                <p className="text-sm text-brand">Ubicación recibida.</p>
              ) : null}
            </Field>
          </div>
          <Field label="Número del local" htmlFor="workHouse">
            <Input
              id="workHouse"
              name="workHouse"
              placeholder="Local 3"
            />
          </Field>
          <Field label="Referencia (frente o al lado de)" htmlFor="workLandmark">
            <Input
              id="workLandmark"
              name="workLandmark"
              placeholder="Al lado del banco"
            />
          </Field>
            </>
          ) : null}
          {workMode !== "location" ? (
            <>
              <input type="hidden" name="workLat" value={workLocation?.lat ?? ""} />
              <input type="hidden" name="workLng" value={workLocation?.lng ?? ""} />
            </>
          ) : null}
        </Section>
        </div>

        <div className={step === 3 ? "" : "hidden"}>
        <Section title="Garante">
          <Field label="Nombre completo" htmlFor="guarantorName">
            <Input
              id="guarantorName"
              name="guarantorName"
              placeholder="Nombre completo del garante"
              required
            />
          </Field>
          <Field label="Teléfono" htmlFor="guarantorPhone">
            <Input
              id="guarantorPhone"
              name="guarantorPhone"
              type="tel"
              placeholder="809-000-0000"
              onChange={maskPhone}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Parentesco" htmlFor="guarantorRelation">
              <Select id="guarantorRelation" name="guarantorRelation" required defaultValue="">
                <option value="">Elige el parentesco</option>
                {relations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Referencia personal">
          <Field label="Nombre completo" htmlFor="ref1Name">
            <Input id="ref1Name" name="ref1Name" placeholder="Ana Gómez" required />
          </Field>
          <Field label="Número de teléfono" htmlFor="ref1Phone">
            <Input
              id="ref1Phone"
              name="ref1Phone"
              type="tel"
              placeholder="829-000-0000"
              onChange={maskPhone}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Parentesco" htmlFor="ref1Relation">
              <Select id="ref1Relation" name="ref1Relation" required defaultValue="">
                <option value="">Elige el parentesco</option>
                {relations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Préstamo">
          <Field
            label="Plazo"
            htmlFor="plan"
            hint={
              canChoose13
                ? undefined
                : `13 semanas solo desde ${formatRD(MIN_PLAN13_AMOUNT)}.`
            }
          >
            <Select
              id="plan"
              name="plan"
              value={String(plan)}
              onChange={(e) => {
                const next = Number(e.target.value) === 13 ? 13 : 10;
                if (next === 13 && amount < MIN_PLAN13_AMOUNT) {
                  setPlan(10);
                  return;
                }
                setPlan(next);
              }}
            >
              <option value="10">10 semanas</option>
              <option value="13" disabled={!canChoose13}>
                13 semanas
                {canChoose13 ? "" : ` (desde ${formatRD(MIN_PLAN13_AMOUNT)})`}
              </option>
            </Select>
          </Field>
          <Field
            label="Monto de la tabla"
            htmlFor="amountPick"
            optional
            hint="Elige un monto de la tabla o escríbelo abajo."
          >
            <Select
              id="amountPick"
              value={options.some((o) => o.amount === amount) ? String(amount) : ""}
              onChange={(e) => {
                if (!e.target.value) return;
                const next = Number(e.target.value);
                setAmount(next);
                if (next < MIN_PLAN13_AMOUNT) setPlan(10);
              }}
            >
              <option value="">Elegir de la tabla</option>
              {options.map((o) => (
                <option key={o.amount} value={o.amount}>
                  {formatRD(o.amount)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="O escribe el monto"
              htmlFor="amount"
              hint="Puedes poner un monto que no esté en la tabla. La cuota se calcula al momento."
            >
              <Input
                id="amount"
                name="amount"
                type="number"
                inputMode="numeric"
                min={5000}
                step={100}
                value={amount || ""}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setAmount(next);
                  if (next < MIN_PLAN13_AMOUNT) setPlan(10);
                }}
                placeholder="Ej. 12000"
                required
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="¿Para qué lo necesitas? (opcional)" htmlFor="notes" optional>
              <Textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Negocio, emergencia, arreglo de casa…"
              />
            </Field>
          </div>
        </Section>
        <div className="mt-6 grid gap-3 rounded-xl bg-paper-2 p-5 sm:grid-cols-3">
          <Stat label="Cuota semanal" value={formatRD(weekly)} />
          <Stat label="Plazo" value={`${plan} semanas`} />
          <Stat label="Total a pagar" value={formatRD(total)} />
        </div>
        <LoanCost className="mt-4" />
        <ConsentField
          checked={consent}
          onChange={(next) => {
            setConsent(next);
            setMissing((current) => (current === "consent" ? "" : current));
          }}
          onOpenPrivacy={() => saveDraftRef.current()}
        />
        </div>

        {error ? (
          <p id="form-error" className="mt-4 text-sm text-red" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setError("");
                setStep(step - 1);
              }}
            >
              Atrás
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            className="sm:min-w-48"
            onClick={() => onSubmit()}
          >
            {step < 3 ? "Siguiente" : "Revisar solicitud"}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted">
          {site.legal}. El WhatsApp solo se abre cuando toda la información
          está completa y la revisas. La aprobación está sujeta a evaluación.
        </p>
      </form>
    </>
    </MissingContext.Provider>
  );
}

function ConsentField({
  checked,
  onChange,
  onOpenPrivacy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  onOpenPrivacy: () => void;
}) {
  const missing = useContext(MissingContext) === "consent";
  return (
    <div
      className={cn(
        "mt-6 rounded-xl border p-4",
        missing ? "border-red bg-red/5" : "border-border-strong bg-paper",
      )}
    >
      <label
        htmlFor="consent"
        className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink"
      >
        <input
          id="consent"
          name="consent"
          type="checkbox"
          value="si"
          required
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={missing || undefined}
          aria-describedby={missing ? "form-error" : undefined}
          className="mt-0.5 size-5 shrink-0 accent-brand"
        />
        <span>
          Autorizo a {site.legal} a tratar mis datos personales y a consultar mi
          historial en el buró de crédito para evaluar esta solicitud, conforme
          a la Ley 172-13. He leído la{" "}
          <a
            href="/privacidad?desde=solicitar"
            onClick={onOpenPrivacy}
            className="font-medium text-brand underline underline-offset-2"
          >
            política de privacidad
          </a>
          . <span className="text-muted">(Obligatorio)</span>
        </span>
      </label>
    </div>
  );
}

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="mt-8 first:mt-0">
      <legend className="mb-3 text-kicker font-medium uppercase tracking-kicker text-muted">
        {title}
      </legend>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const missing = useContext(MissingContext);
  const invalid = missing === htmlFor;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? null : <span className="text-red"> *</span>}
      </Label>
      <div
        className={cn(
          invalid &&
            "rounded-sm ring-2 ring-red [&_input]:border-red [&_select]:border-red [&_textarea]:border-red",
        )}
      >
        {children}
      </div>
      {hint ? <p className="text-xs leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-kicker font-medium uppercase tracking-kicker text-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-kicker font-medium uppercase tracking-kicker text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}

/** «G» de Google en sus cuatro colores (decorativa: el botón ya dice «Google»). */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
