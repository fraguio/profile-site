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
    const readerBody = document.createElement("div");
    let selected = entries[0];

    reader.className = "timeline__reader";
    reader.dataset.contract = "timeline-reader";
    readerArticle.className = "timeline__reader-content";
    readerHeader.dataset.contract = "timeline-reader-header";
    readerBody.dataset.contract = "timeline-reader-body";
    readerArticle.append(readerHeader, readerBody);
    reader.append(readerArticle);

    function placeDetail() {
      reader.setAttribute("role", desktop.matches ? "complementary" : "region");
      if (desktop.matches) {
        experience.append(reader);
      } else {
        selected.trigger.after(reader);
      }
    }

    function select(entry: typeof selected) {
      if (entry.item.hidden) return;
      selected.trigger.setAttribute("aria-pressed", "false");
      selected = entry;
      selected.trigger.setAttribute("aria-pressed", "true");
      reader.setAttribute("aria-label", `Detalle del hito: ${selected.trigger.textContent?.trim().replace(/\s+/g, " ")}`);
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
    });

    desktop.addEventListener("change", placeDetail);
    select(selected);
    document.documentElement.classList.add("timeline-enhanced");
    filters.hidden = false;
    rail.tabIndex = 0;
  }
}
