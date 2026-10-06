export {};

const filters = document.querySelector<HTMLFieldSetElement>(
  '[data-contract="timeline-filters"]',
);
const status = document.querySelector<HTMLElement>(
  '[data-contract="timeline-filter-status"]',
);
const rail = document.querySelector<HTMLOListElement>(
  '[data-contract="timeline-rail"]',
);

if (filters && status && rail) {
  const milestones = [...rail.querySelectorAll<HTMLElement>("[data-timeline-category]")];
  const entries = milestones.map((item) => ({
    item,
    summary: item.querySelector<HTMLElement>('[data-contract="milestone-summary"]'),
    detail: item.querySelector<HTMLElement>('[data-contract="milestone-detail"]'),
    trigger: document.createElement("button"),
  }));

  if (entries.length > 0 && entries.every(({ summary, detail }) => summary && detail)) {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const experience = rail.parentElement!;
    const reader = document.createElement("aside");
    const readerArticle = document.createElement("article");
    const readerHeader = document.createElement("header");
    const readerFrame = document.createElement("div");
    const readerBody = document.createElement("div");
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
    let selected = entries[0];
    let geometryFrame = 0;

    function updateGeometry() {
      geometryFrame = 0;
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

    reader.className = "timeline__reader";
    reader.dataset.contract = "timeline-reader";
    readerArticle.className = "timeline__reader-content";
    readerHeader.dataset.contract = "timeline-reader-header";
    readerFrame.className = "timeline__reader-frame";
    readerBody.dataset.contract = "timeline-reader-body";
    readerBody.setAttribute("role", "region");
    readerFrame.prepend(readerBody);
    readerArticle.append(readerHeader, readerFrame);
    reader.append(readerArticle);

    function placeDetail() {
      reader.setAttribute("role", desktop.matches ? "complementary" : "region");
      readerBody.tabIndex = desktop.matches ? 0 : -1;
      if (desktop.matches) {
        experience.append(reader);
      } else {
        selected.trigger.after(reader);
      }
      scheduleGeometry();
    }

    function select(entry: typeof selected) {
      if (entry.item.hidden) return;
      selected.trigger.setAttribute("aria-pressed", "false");
      selected = entry;
      selected.trigger.setAttribute("aria-pressed", "true");
      reader.setAttribute("aria-label", `Detalle del hito: ${selected.trigger.getAttribute("aria-label")}`);
      readerBody.setAttribute("aria-label", `Lectura del hito: ${selected.trigger.getAttribute("aria-label")}`);
      readerHeader.replaceChildren(...[...selected.trigger.children].map((child) => child.cloneNode(true)));
      readerBody.replaceChildren(selected.detail!);
      placeDetail();
      readerBody.scrollTop = 0;
    }

    for (const entry of entries) {
      const { summary, detail, trigger } = entry;
      trigger.type = "button";
      trigger.className = "milestone__trigger";
      trigger.dataset.contract = "milestone-trigger";
      trigger.setAttribute("aria-pressed", "false");
      trigger.setAttribute("aria-label", [...summary!.querySelectorAll(".milestone__category, h3, .milestone__entity, .milestone__period")]
        .map((element) => element.textContent?.trim().replace(/\s+/g, " ")).join(", "));
      trigger.append(...summary!.childNodes);
      summary!.replaceWith(trigger);
      detail!.remove();
      trigger.addEventListener("click", () => {
        if (selected !== entry) select(entry);
      });
    }

    filters.addEventListener("change", (event) => {
      const filter = event.target;
      if (!(filter instanceof HTMLInputElement) || filter.name !== "timeline-filter") return;

      const visible = entries.filter(({ item }) => {
        item.hidden = filter.value !== "all" && item.dataset.timelineCategory !== filter.value;
        return !item.hidden;
      });
      if (selected.item.hidden) select(visible[0]);
      const count = visible.length;
      status.textContent = `Se ${count === 1 ? "muestra" : "muestran"} ${count} ${count === 1 ? "hito" : "hitos"} de ${filter.dataset.timelineFilterLabel?.toLowerCase()}.`;
      scheduleGeometry();
    });

    desktop.addEventListener("change", placeDetail);
    select(selected);
    document.documentElement.classList.add("timeline-enhanced");
    filters.hidden = false;
    rail.tabIndex = 0;
    const resizeObserver = new ResizeObserver(scheduleGeometry);
    for (const element of [rail, reader, readerBody, ...entries.flatMap(({ item, detail }) => [item, detail!])]) {
      resizeObserver.observe(element);
    }
    const contentObserver = new MutationObserver(scheduleGeometry);
    contentObserver.observe(rail, { childList: true, characterData: true, subtree: true });
    contentObserver.observe(readerBody, { childList: true, characterData: true, subtree: true });
    for (const { surface } of scrollers) surface.addEventListener("scroll", scheduleGeometry, { passive: true });
    window.addEventListener("resize", scheduleGeometry);
    document.fonts.ready.then(scheduleGeometry);
    document.fonts.addEventListener("loadingdone", scheduleGeometry);
  }
}
