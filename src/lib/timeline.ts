export {};

const root = document.documentElement;
const timeline = document.querySelector<HTMLElement>(".timeline");
const fallback = timeline?.cloneNode(true);
let geometryFrame = 0;

try {
const filters = document.querySelector<HTMLFieldSetElement>(
  '[data-contract="timeline-filters"]',
);
const status = document.querySelector<HTMLElement>(
  '[data-contract="timeline-filter-status"]',
);
const rail = document.querySelector<HTMLOListElement>(
  '[data-contract="timeline-rail"]',
);

if (filters && status && rail && document.documentElement.dataset.timelineState !== "fallback") {
  const milestones = [...rail.querySelectorAll<HTMLElement>("[data-timeline-category]")];
  const entries = milestones.map((item) => ({
    item,
    summary: item.querySelector<HTMLElement>('[data-contract="milestone-summary"]'),
    detail: item.querySelector<HTMLElement>('[data-contract="milestone-detail"]'),
    metadata: document.createElement("div"),
    trigger: document.createElement("button"),
  }));

  if (entries.length > 0 && entries.every(({ summary, detail }) => summary && detail)) {
    type Entry = typeof entries[number];
    const desktop = window.matchMedia("(min-width: 1024px)");
    const hero = document.querySelector<HTMLElement>(".profile-hero");
    const experience = rail.parentElement!;
    const reader = document.createElement("aside");
    const readerArticle = document.createElement("article");
    const readerHeader = document.createElement("header");
    const readerFrame = document.createElement("div");
    const readerBody = document.createElement("div");
    const closeTemplate = document.querySelector<HTMLTemplateElement>('[data-contract="timeline-close-template"]')!;
    const closeButton = closeTemplate.content.querySelector("button")!.cloneNode(true) as HTMLButtonElement;
    const railFrame = document.createElement("div");
    railFrame.className = "timeline__rail-frame";
    rail.before(railFrame);
    railFrame.append(rail);
    const scrollers = [
      { surface: rail, frame: railFrame, gradient: document.createElement("span") },
      { surface: readerBody, frame: readerFrame, gradient: document.createElement("span") },
    ];
    for (const { frame, gradient } of scrollers) {
      gradient.className = "timeline__scroll-gradient";
      gradient.setAttribute("aria-hidden", "true");
      gradient.hidden = true;
      frame.append(gradient);
    }
    const initialFilter = filters.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')!;
    for (const { item } of entries) {
      item.hidden = initialFilter.value !== "all" && item.dataset.timelineCategory !== initialFilter.value;
    }
    let selected: Entry | undefined;

    function updateDetailState() {
      root.dataset.timelineDetailOpen = String(Boolean(selected));
      reader.inert = !selected;
      reader.setAttribute("aria-hidden", String(!selected));
    }

    function updateGeometry() {
      geometryFrame = 0;
      if (hero) {
        hero.dataset.scrollable = String(desktop.matches && hero.scrollHeight > hero.clientHeight + 1);
      }
      if (desktop.matches) {
        const gap = parseFloat(getComputedStyle(timeline!).columnGap);
        root.style.setProperty("--timeline-reader-space", `${reader.getBoundingClientRect().width + gap}px`);
      }
      for (const { surface, gradient } of scrollers) {
        const overflow = desktop.matches && surface.scrollHeight > surface.clientHeight + 1;
        surface.dataset.scrollable = String(overflow);
        gradient.hidden = !overflow || surface.scrollHeight - surface.clientHeight - surface.scrollTop <= 1;
        gradient.style.width = `${surface.clientWidth}px`;
      }
      const nodes = entries.filter(({ item }) => !item.hidden)
        .map(({ trigger }) => trigger.querySelector<HTMLElement>(".milestone__node")!);
      rail!.style.setProperty("--timeline-line-display", nodes.length > 1 ? "block" : "none");
      if (nodes.length < 2) return;
      const origin = rail!.getBoundingClientRect();
      const first = nodes[0].getBoundingClientRect();
      const last = nodes.at(-1)!.getBoundingClientRect();
      const top = first.top + first.height / 2 - origin.top - rail!.clientTop + rail!.scrollTop;
      const left = first.left + first.width / 2 - origin.left - rail!.clientLeft + rail!.scrollLeft;
      rail!.style.setProperty("--timeline-line-top", `${top}px`);
      rail!.style.setProperty("--timeline-line-left", `${left - 0.75}px`);
      rail!.style.setProperty("--timeline-line-height", `${last.top + last.height / 2 - first.top - first.height / 2}px`);
    }

    function scheduleGeometry() {
      if (!geometryFrame) geometryFrame = requestAnimationFrame(updateGeometry);
    }

    reader.id = "timeline-detail";
    reader.className = "timeline__reader";
    reader.dataset.contract = "timeline-reader";
    readerArticle.className = "timeline__reader-content";
    readerHeader.dataset.contract = "timeline-reader-header";
    readerFrame.className = "timeline__reader-frame";
    readerBody.dataset.contract = "timeline-reader-body";
    readerBody.setAttribute("role", "region");
    readerFrame.prepend(readerBody);
    readerArticle.append(closeButton, readerHeader, readerFrame);
    reader.append(readerArticle);

    function placeDetail() {
      const focused = document.activeElement;
      const returnToMilestone = !desktop.matches && (focused === readerBody || focused === rail);
      reader.setAttribute("role", desktop.matches ? "complementary" : "region");
      readerBody.tabIndex = desktop.matches && selected ? 0 : -1;
      rail!.tabIndex = -1;
      if (desktop.matches || !selected) {
        if (reader.parentElement !== experience) experience.append(reader);
      } else {
        selected.trigger.after(reader);
      }
      if (returnToMilestone) {
        selected?.trigger.focus({ preventScroll: true });
      } else if (focused instanceof HTMLElement && reader.contains(focused)) {
        focused.focus({ preventScroll: true });
      }
      updateDetailState();
      scheduleGeometry();
    }

    function select(entry: Entry) {
      if (entry.item.hidden) return;
      delete root.dataset.timelineFocusResting;
      selected?.trigger.setAttribute("aria-pressed", "false");
      selected = entry;
      reader.dataset.category = selected.item.dataset.timelineCategory;
      selected.trigger.setAttribute("aria-pressed", "true");
      reader.setAttribute("aria-label", `Detalle del hito: ${selected.trigger.getAttribute("aria-label")}`);
      readerBody.setAttribute("aria-label", `Lectura del hito: ${selected.trigger.getAttribute("aria-label")}`);
      const metadata = selected.metadata.cloneNode(true);
      readerHeader.replaceChildren(...[...selected.trigger.children].map((child) => child.cloneNode(true)), metadata);
      readerBody.replaceChildren(selected.detail!);
      placeDetail();
      readerBody.scrollTop = 0;
    }

    function closeDetail() {
      if (!selected) return;
      const trigger = selected.trigger;
      trigger.setAttribute("aria-pressed", "false");
      selected = undefined;
      readerBody.tabIndex = -1;
      // Retiene el foco lógico sin señales causadas por el propio cierre.
      root.dataset.timelineFocusResting = "idle";
      trigger.focus({ preventScroll: true });
      updateDetailState();
      scheduleGeometry();
    }

    for (const entry of entries) {
      const { summary, detail, trigger } = entry;
      trigger.type = "button";
      trigger.className = "milestone__trigger";
      trigger.dataset.contract = "milestone-trigger";
      trigger.setAttribute("aria-pressed", "false");
      trigger.setAttribute("aria-controls", reader.id);
      trigger.setAttribute("aria-label", [...summary!.querySelectorAll(".milestone__category, h3, .milestone__entity, .milestone__period")]
        .map((element) => element.textContent?.trim().replace(/\s+/g, " ")).join(", "));
      entry.metadata.className = "milestone__metadata";
      entry.metadata.append(...summary!.querySelectorAll(".milestone__period, .milestone__location, .milestone__role, .milestone__project-link"));
      trigger.append(...summary!.childNodes);
      summary!.replaceWith(trigger);
      detail!.remove();
      trigger.addEventListener("click", () => {
        if (selected !== entry) select(entry);
      });
    }

    filters.addEventListener("click", (event) => {
      const filter = event.target;
      if (!(filter instanceof HTMLButtonElement) || filter.name !== "timeline-filter") return;
      for (const option of filters!.querySelectorAll<HTMLButtonElement>('button[name="timeline-filter"]')) {
        option.setAttribute("aria-pressed", String(option === filter));
      }

      const visible = entries.filter(({ item }) => {
        item.hidden = filter.value !== "all" && item.dataset.timelineCategory !== filter.value;
        return !item.hidden;
      });
      if (selected?.item.hidden) select(visible[0]);
      const count = visible.length;
      status.textContent = `Se ${count === 1 ? "muestra" : "muestran"} ${count} ${count === 1 ? "hito" : "hitos"} de ${filter.dataset.timelineFilterLabel?.toLowerCase()}.`;
      scheduleGeometry();
    });

    root.classList.add("timeline-enhanced");
    filters.hidden = false;
    placeDetail();
    updateGeometry();
    const resizeObserver = new ResizeObserver(scheduleGeometry);
    if (hero) {
      resizeObserver.observe(hero);
      for (const child of hero.children) resizeObserver.observe(child);
    }
    for (const element of [rail, reader, readerBody, ...entries.flatMap(({ item, detail }) => [item, detail!])]) {
      resizeObserver.observe(element);
    }
    const contentObserver = new MutationObserver(scheduleGeometry);
    if (hero) contentObserver.observe(hero, { childList: true, characterData: true, subtree: true });
    contentObserver.observe(rail, { childList: true, characterData: true, subtree: true });
    contentObserver.observe(readerBody, { childList: true, characterData: true, subtree: true });
    for (const surface of [hero, ...scrollers.map(({ surface }) => surface)]) {
      if (!surface) continue;
      let scrollIdleTimer = 0;
      surface.addEventListener("scroll", () => {
        scheduleGeometry();
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        surface.dataset.scrolling = "true";
        window.clearTimeout(scrollIdleTimer);
        scrollIdleTimer = window.setTimeout(() => { delete surface.dataset.scrolling; }, 700);
      }, { passive: true });
    }
    window.addEventListener("resize", scheduleGeometry);
    document.fonts.ready.then(scheduleGeometry);
    document.fonts.addEventListener("loadingdone", scheduleGeometry);
    desktop.addEventListener("change", placeDetail);
    closeButton.addEventListener("click", closeDetail);
    document.addEventListener("keydown", (event) => {
      root.dataset.timelineInputModality = "keyboard";
      if (event.key === "Escape" && selected) {
        event.preventDefault();
        closeDetail();
      } else if (event.key !== "Escape") {
        delete root.dataset.timelineFocusResting;
      }
    });
    document.addEventListener("pointerdown", () => {
      root.dataset.timelineInputModality = "pointer";
      delete root.dataset.timelineFocusResting;
    });
    function resumePointerFeedback() {
      if (root.dataset.timelineFocusResting === "idle") root.dataset.timelineFocusResting = "pointer";
    }
    document.addEventListener("pointermove", resumePointerFeedback, { passive: true });
    document.addEventListener("wheel", resumePointerFeedback, { passive: true });
    requestAnimationFrame(() => requestAnimationFrame(() => { root.dataset.timelineMotion = "ready"; }));
  }
}
root.dataset.timelineState = root.classList.contains("timeline-enhanced") ? "ready" : "fallback";
} catch {
  // Una inicialización incompleta nunca sustituye el documento accesible de origen.
  cancelAnimationFrame(geometryFrame);
  if (fallback) timeline?.replaceWith(fallback);
  root.classList.remove("timeline-enhanced");
  delete root.dataset.timelineDetailOpen;
  root.style.removeProperty("--timeline-reader-space");
  root.dataset.timelineState = "fallback";
}
