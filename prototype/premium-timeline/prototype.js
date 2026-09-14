const entries = [
  {
    id: "north",
    type: "work",
    date: "2024 — presente",
    title: "Lead de experiencia",
    entity: "Northstar Co.",
    text: "Rediseño del sistema operativo de atención para equipos de servicio. La nueva estructura redujo el tiempo de preparación y dio una referencia compartida a producto y operaciones. El trabajo comenzó con entrevistas a personas de primera línea, revisión de incidencias y sesiones de mapeo con responsables de producto. A partir de ese diagnóstico, convertimos decisiones dispersas en un flujo de atención con responsabilidades, señales de calidad y puntos de escalado claros. También documenté el sistema de interfaz para que equipos distintos pudieran extenderlo sin perder consistencia. Durante la adopción, acompañé pruebas semanales, recogí fricción cualitativa y ajusté los patrones que generaban más dudas. El resultado no fue una pantalla aislada, sino una forma de trabajo compartida que conectó operaciones, producto y soporte.",
    skills: ["Sistemas", "Investigación", "Facilitación"],
  },
  //{ id: "signal", type: "projects", date: "2023 — 2024", title: "Signal Atlas", entity: "Proyecto independiente", text: "Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos.", skills: ["Prototipado", "Accesibilidad", "Datos"] },
  {
    id: "signal",
    type: "projects",
    date: "2023 — 2024",
    title: "Signal Atlas",
    entity: "Proyecto independiente",
    text: "Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos. Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos. Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos. Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos. Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos. Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos. Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos. Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos. Exploración de un mapa de decisiones para servicios públicos. Prototipé el flujo con personas usuarias y documenté patrones de comprensión para equipos no técnicos.",
    skills: [
      "Prototipado",
      "Accesibilidad",
      "Datos",
      "Prototipado",
      "Accesibilidad",
      "Datos",
      "Prototipado",
      "Accesibilidad",
      "Datos",
      "Prototipado",
      "Accesibilidad",
      "Datos",
      "Prototipado",
      "Accesibilidad",
      "Datos",
      "Prototipado",
      "Accesibilidad",
      "Datos",
    ],
  },
  {
    id: "studio",
    type: "work",
    date: "2021 — 2023",
    title: "Diseñadora de producto",
    entity: "Studio Lumen",
    text: "Lideré el lenguaje de interfaz de una plataforma B2B y acompañé a ingeniería en su adopción. El sistema permitió lanzar módulos consistentes sin ralentizar al equipo.",
    skills: ["UI", "Design tokens", "Estrategia"],
  },
  {
    id: "master",
    type: "education",
    date: "2020 — 2021",
    title: "Máster en diseño de interacción",
    entity: "Instituto Delta",
    text: "Especialización en investigación aplicada, arquitectura de información y evaluación de productos digitales con foco en servicios complejos.",
    skills: ["Investigación", "Contenido"],
  },
  {
    id: "fieldnotes",
    type: "projects",
    date: "2019 — 2020",
    title: "Field Notes",
    entity: "Laboratorio cívico",
    text: "Archivo colaborativo que transformó entrevistas de campo en patrones accionables. Se usó como soporte para talleres de priorización y diseño de servicios.",
    skills: ["Síntesis", "Talleres"],
  },
  {
    id: "common",
    type: "work",
    date: "2017 — 2019",
    title: "Diseñadora visual",
    entity: "Common Ground",
    text: "Construí identidades de producto y prototipos de alta fidelidad para iniciativas de movilidad y educación, conectando marca, interfaz y pruebas de uso.",
    skills: ["Visual", "Prototipos"],
  },
  {
    id: "degree",
    type: "education",
    date: "2013 — 2017",
    title: "Grado en diseño",
    entity: "Escuela Meridian",
    text: "Base en comunicación visual, pensamiento de sistemas y métodos de proyecto. El trabajo final exploró interfaces públicas legibles en contexto urbano.",
    skills: ["Tipografía", "Sistemas"],
  },
];

const variants = [
  { key: "a", label: "A · Secuencia expandible" },
  { key: "b", label: "B · Navegador y lector" },
  { key: "c", label: "C · Cinta y atril" },
];
const loopCopies = 8;

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const requestedVariant = new URLSearchParams(window.location.search)
  .get("variant")
  ?.toLowerCase();
const state = {
  variant: variants.some(({ key }) => key === requestedVariant)
    ? requestedVariant
    : "a",
  filter: "all",
  selected: null,
  selectedInstance: null,
  manualPaused: false,
  touchPaused: false,
  pointerPressed: false,
  hovered: false,
  focused: false,
  reducedMotion: prefersReducedMotion,
  motionConsent: !prefersReducedMotion,
  focusDetailHeading: false,
  returnFocusInstance: null,
};

const root = document.querySelector("#variant-root");
const motionToggle = document.querySelector("#motion-toggle");
const motionStatus = document.querySelector("#motion-status");
const filterAnnouncement = document.querySelector("#filter-announcement");

function visibleEntries() {
  return state.filter === "all"
    ? entries
    : entries.filter((entry) => entry.type === state.filter);
}

function entryMarkup(entry, mode, instance, isClone) {
  const selected = state.selectedInstance === instance;
  const interaction = `data-entry="${entry.id}" data-instance="${instance}"`;
  const summary = `<span class="category">${labelFor(entry.type)}</span><h3>${entry.title}</h3><p class="item-meta">${entry.entity}</p><p class="date">${entry.date}</p>`;
  const detail = detailMarkup(entry);

  if (mode === "a") {
    return `<div class="a-item${isClone ? " loop-clone" : ""}"><button class="timeline-item" type="button" ${interaction} aria-expanded="${selected}"><span class="category">${labelFor(entry.type)}</span><span>${summary.replace(`<span class="category">${labelFor(entry.type)}</span>`, "")}</span></button>${selected ? `<div class="inline-detail">${detail}</div>` : ""}</div>`;
  }
  if (mode === "b") {
    return `<div class="b-item${isClone ? " loop-clone" : ""}"><button class="event-button" type="button" ${interaction} aria-pressed="${selected}">${summary}</button></div>`;
  }
  return `<button class="chapter${isClone ? " loop-clone" : ""}" type="button" ${interaction} aria-pressed="${selected}"><span class="category">${labelFor(entry.type)}</span><h3>${entry.title}</h3><p class="item-meta">${entry.entity}</p><p class="date">${entry.date}</p></button>`;
}

function labelFor(type) {
  return { work: "Trabajo", education: "Formación", projects: "Proyecto" }[
    type
  ];
}

function detailMarkup(entry) {
  if (!entry)
    return `<p class="empty-reader">Seleccione un hito para leer su contexto. Sin selección, el movimiento puede continuar.</p>`;
  const skills = entry.skills.map((skill) => `<li>${skill}</li>`).join("");
  return `<article class="detail"><header class="detail-header"><button class="close-detail" type="button" data-close-detail>Cerrar ×</button><span class="category">${labelFor(entry.type)}</span><h3 class="detail-title" tabindex="-1">${entry.title}</h3><p class="item-meta">${entry.entity} · ${entry.date}</p></header><div class="detail-body"><p>${entry.text}</p><ul class="skills" aria-label="Habilidades asociadas">${skills}</ul></div></article>`;
}

function repeated(items, mode) {
  return Array.from({ length: loopCopies }, (_, copyIndex) =>
    items
      .map((entry, index) =>
        entryMarkup(
          entry,
          mode,
          `${entry.id}-${copyIndex}-${index}`,
          copyIndex > 0,
        ),
      )
      .join(""),
  ).join("");
}

function isPaused() {
  return (
    state.manualPaused ||
    state.touchPaused ||
    state.pointerPressed ||
    state.hovered ||
    state.focused ||
    state.selected !== null ||
    (state.reducedMotion && !state.motionConsent)
  );
}

function motionElement() {
  return root.querySelector(".ticker-track, .event-list, .ribbon");
}

function motionTime() {
  return motionElement()?.getAnimations()[0]?.currentTime ?? null;
}

function applyMotionSettings() {
  const variant = root.firstElementChild;
  variant?.style.setProperty("--loop-distance", `${-100 / loopCopies}%`);
}

function renderVariant(animationTime = null) {
  const items = visibleEntries();
  const selectedEntry = entries.find((entry) => entry.id === state.selected);
  const pauseClass = isPaused() ? "is-paused" : "";
  const consentClass = state.motionConsent ? "is-motion-consented" : "";

  if (state.variant === "a") {
    root.innerHTML = `<section class="variant-a ${pauseClass} ${consentClass}" aria-label="Variante A: detalle expandible"><div class="ticker-window"><div class="ticker-track">${repeated(items, "a")}</div></div></section>`;
  } else if (state.variant === "b") {
    root.innerHTML = `<section class="variant-b ${pauseClass} ${consentClass}${selectedEntry ? " has-selection" : ""}" aria-label="Variante B: navegador y lector"><div class="event-nav"><div class="event-list">${repeated(items, "b")}</div></div><aside class="reader" aria-live="polite">${detailMarkup(selectedEntry)}</aside>${selectedEntry ? `<section class="mobile-detail-panel" aria-live="polite">${detailMarkup(selectedEntry)}</section>` : ""}</section>`;
  } else {
    root.innerHTML = `<section class="variant-c ${pauseClass} ${consentClass}" aria-label="Variante C: cinta horizontal y atril"><div class="ribbon-window"><div class="ribbon">${repeated(items, "c")}</div></div><section class="reading-desk" aria-live="polite"><span class="category">Detalle</span>${detailMarkup(selectedEntry)}</section></section>`;
  }
  applyMotionSettings();
  if (animationTime !== null) {
    requestAnimationFrame(() => {
      const animation = motionElement()?.getAnimations()[0];
      if (animation) animation.currentTime = animationTime;
    });
  }
  bindTimelineEvents();
  updateState();
  if (state.focusDetailHeading) {
    state.focusDetailHeading = false;
    requestAnimationFrame(() =>
      root.querySelector(".mobile-detail-panel .detail-title")?.focus(),
    );
  }
  if (state.returnFocusInstance) {
    const instance = state.returnFocusInstance;
    state.returnFocusInstance = null;
    requestAnimationFrame(() =>
      root.querySelector(`[data-instance="${instance}"]`)?.focus(),
    );
  }
}

function bindTimelineEvents() {
  root.querySelectorAll("[data-entry]").forEach((button) => {
    button.addEventListener("click", () => {
      const animationTime = motionTime();
      const selected = state.selectedInstance === button.dataset.instance;
      const isMobile = window.matchMedia("(max-width: 720px)").matches;
      state.selected = selected ? null : button.dataset.entry;
      state.selectedInstance = selected ? null : button.dataset.instance;
      state.focusDetailHeading = !selected && isMobile;
      state.returnFocusInstance = selected && isMobile ? button.dataset.instance : null;
      state.focused = false;
      state.hovered = button.matches(":hover");
      renderVariant(animationTime);
    });
    button.addEventListener("pointerenter", () =>
      setAttention("hovered", true),
    );
    button.addEventListener("pointerleave", () =>
      setAttention("hovered", false),
    );
    button.addEventListener("pointerdown", (event) => {
      setAttention("pointerPressed", true);
      if (event.pointerType === "touch") setAttention("touchPaused", true);
    });
    button.addEventListener("pointerup", (event) => {
      requestAnimationFrame(() => {
        setAttention("pointerPressed", false);
        if (event.pointerType === "touch") setAttention("touchPaused", false);
      });
    });
    button.addEventListener("pointercancel", () =>
      setAttention("pointerPressed", false),
    );
    button.addEventListener("focus", () => setAttention("focused", true));
    button.addEventListener("blur", () => setAttention("focused", false));
  });
  root
    .querySelectorAll("[data-close-detail]")
    .forEach((button) => button.addEventListener("click", () => closeDetail()));
}

function setAttention(cause, value) {
  state[cause] = value;
  root.firstElementChild?.classList.toggle("is-paused", isPaused());
  updateState();
}

function closeDetail() {
  const animationTime = motionTime();
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const selectedInstance = state.selectedInstance;
  state.selected = null;
  state.selectedInstance = null;
  state.returnFocusInstance = isMobile ? selectedInstance : null;
  state.pointerPressed = false;
  state.hovered = false;
  state.focused = false;
  renderVariant(animationTime);
}

function updateState() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.filter === state.filter),
    );
  });
  const current = variants.find((variant) => variant.key === state.variant);
  document.querySelector("#variant-label").textContent = current.label;
  const paused = isPaused();
  root.firstElementChild?.classList.toggle(
    "is-motion-consented",
    state.motionConsent,
  );
  motionToggle.textContent = state.selected
    ? "Cerrar detalle y reanudar"
    : paused
      ? "Reanudar movimiento"
      : "Pausar movimiento";
  motionToggle.setAttribute("aria-pressed", String(paused));
  motionStatus.textContent =
    state.reducedMotion && !state.motionConsent
      ? "Movimiento reducido: estático"
      : paused
        ? "Movimiento en pausa"
        : "Movimiento activo";
}

function changeVariant(direction) {
  const currentIndex = variants.findIndex(
    (variant) => variant.key === state.variant,
  );
  state.variant =
    variants[
      (currentIndex + direction + variants.length) % variants.length
    ].key;
  const url = new URL(window.location.href);
  url.searchParams.set("variant", state.variant);
  window.history.replaceState({}, "", url);
  renderVariant();
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    state.selected = null;
    state.selectedInstance = null;
    state.touchPaused = false;
    state.pointerPressed = false;
    state.hovered = false;
    state.focused = false;
    filterAnnouncement.textContent = `Filtro ${labelFor(state.filter) ?? "Todo"}: ${visibleEntries().length} elementos. La secuencia vuelve al inicio.`;
    renderVariant();
  });
});

motionToggle.addEventListener("click", () => {
  if (state.selected) {
    closeDetail();
    return;
  }
  if (state.reducedMotion && !state.motionConsent) {
    state.motionConsent = true;
  } else {
    state.manualPaused = !state.manualPaused;
  }
  state.touchPaused = false;
  root.firstElementChild?.classList.toggle("is-paused", isPaused());
  updateState();
});
document
  .querySelector("#previous-variant")
  .addEventListener("click", () => changeVariant(-1));
document
  .querySelector("#next-variant")
  .addEventListener("click", () => changeVariant(1));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.selected) closeDetail();
  if (
    ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) ||
    document.activeElement.isContentEditable
  )
    return;
  if (event.key === "ArrowLeft") changeVariant(-1);
  if (event.key === "ArrowRight") changeVariant(1);
});

renderVariant();
