# RP Puello & Asociados: notas de la copia

Copia de la web de Préstamos Jayrodz (mejoras-v1 @ 0173abc), rebautizada para
RP Puello & Asociados. Solo local: sin remoto, sin deploy.

## Dónde se cambia cada cosa
- Datos del negocio, URL del sitio (`SITE_URL`), teléfono/WhatsApp, Facebook,
  tabla de cuotas, % de cargo y % de mora: `src/lib/site.ts`.
- Pueblos de cobertura: `cities` en `src/lib/site.ts`. Sectores por pueblo:
  `src/lib/sectors.ts` (Cotuí sin lista: el formulario muestra solo «Otro»).
- Colores: tokens `--color-brand*` en `src/styles.css`.
- Logo, favicon, ícono iOS y tarjetas sociales: `python3 scripts/make-brand-assets.py`
  (fuente: `brand/logo-original.jpg`).

## Pendiente de confirmar con RP Puello
- RNC: no hay; no se muestra.
- Dominio definitivo (hoy `https://rp-puello.example`).
- Otros pueblos o sectores de Cotuí que atienden.
- Oficina en Nagua (María Trinidad Sánchez); se presta solo en Cotuí (confirmado).
- Horario («Lunes a sábado · WhatsApp todo el día»), cobro a domicilio o por
  transferencia, garante obligatorio y requisitos: textos heredados de Jayrodz.
- El formulario conserva la opción «Instagram» en «¿Cómo llegó a la compañía?».
