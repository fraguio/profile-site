import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const viewport of [
  { width: 1366, height: 768 }, { width: 1440, height: 900 },
  { width: 360, height: 800 }, { width: 390, height: 844 },
]) {
  test(`la geometría del hito permanece estable al seleccionar en ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    test.info().annotations.push({ type: "fuente", description: "fictitious-resume.json; Todo; Inter local cargada" });
    await page.setViewportSize(viewport);
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    const trigger = page.getByRole("button", { name: /Proyecto de Empate/ });
    const measure = () => trigger.evaluate((button) => {
      const rect = (element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        button: rect(button), title: rect(button.querySelector("h3")),
        node: rect(button.querySelector(".milestone__node")),
        period: rect(button.querySelector(".milestone__period--compact")),
        surface: rect(button.querySelector(".milestone__surface")),
        border: getComputedStyle(button.querySelector(".milestone__surface")).borderTopWidth,
      };
    });
    await trigger.scrollIntoViewIfNeeded();
    const before = await measure();
    await trigger.click();
    const after = await measure();
    for (const part of ["button", "title", "surface", "node"]) {
      expect(after[part].width).toBe(before[part].width);
      expect(after[part].height).toBe(before[part].height);
    }
    expect(before.border).toBe("1px");
    expect(after.border).toBe("1px");
    expect(after.node.width).toBe(20);
    expect(after.title.width).toBeGreaterThan(viewport.width >= 1024 ? 170 : 190);
    expect(after.node.x + after.node.width).toBeLessThan(after.title.x);
    if (viewport.width >= 1024) {
      expect(after.period.x + after.period.width).toBeLessThanOrEqual(after.node.x);
      const openPeriod = await page.getByRole("button", { name: /Arquitecta de software/ }).locator(".milestone__period--compact").boundingBox();
      expect(openPeriod.height).toBeLessThanOrEqual(20);
    } else {
      expect(after.period.y + after.period.height).toBeLessThanOrEqual(after.surface.y);
    }
    await expect(trigger.locator(".milestone__period--compact")).toHaveText("2021 – 2022");
    await expect(page.locator('[data-contract="timeline-reader"]')).toContainText("1 de enero de 2021 - 31 de diciembre de 2022");
    await page.getByRole("button", { name: /Arquitecta de software/ }).click();
    const deselected = await measure();
    expect(deselected.title.width).toBe(before.title.width);
    expect(deselected.button.height).toBe(before.button.height);
    await page.screenshot({ path: test.info().outputPath("timeline.png"), fullPage: true });
  });

  test(`la línea conecta los nodos visibles sin slots residuales en ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    test.info().annotations.push({ type: "fuente", description: "fictitious-resume.json; Todo → Formación → Proyectos → Todo; Inter local" });
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    let releaseFonts;
    const fontsAvailable = new Promise((resolve) => { releaseFonts = resolve; });
    await page.route(/\.(woff2?)$/, async (route) => {
      await fontsAvailable;
      await route.continue();
    });
    await page.goto("./", { waitUntil: "domcontentloaded" });
    const rail = page.locator('[data-contract="timeline-rail"]');
    const endpoints = () => rail.evaluate((list) => {
      const style = getComputedStyle(list, "::before");
      const origin = list.getBoundingClientRect();
      const nodes = [...list.querySelectorAll('[data-timeline-category]:not([hidden]) .milestone__trigger .milestone__node')].map((node) => {
        const box = node.getBoundingClientRect();
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      });
      const x = origin.x + list.clientLeft + parseFloat(style.left) - list.scrollLeft + parseFloat(style.width) / 2;
      const y = origin.y + list.clientTop + parseFloat(style.top) - list.scrollTop;
      return { display: style.display, start: { x, y }, end: { x, y: y + parseFloat(style.height) }, nodes };
    });
    const expectConnected = async () => {
      await expect.poll(async () => {
        const line = await endpoints();
        return Math.max(Math.abs(line.start.x - line.nodes[0].x), Math.abs(line.start.y - line.nodes[0].y),
          Math.abs(line.end.x - line.nodes.at(-1).x), Math.abs(line.end.y - line.nodes.at(-1).y));
      }).toBeLessThan(1);
    };
    await expect(page.locator('[data-contract="milestone-trigger"]').first()).toBeVisible();
    await expectConnected();
    releaseFonts();
    await page.evaluate(() => document.fonts.ready);
    await expectConnected();
    await page.locator('[data-contract="milestone-trigger"]').last().click();
    await expectConnected();
    await page.getByRole("button", { name: /Proyecto Vigente/ }).click();
    await expectConnected();
    await page.getByRole("radio", { name: "Formación", exact: true }).click();
    await expect.poll(async () => (await endpoints()).display).toBe("none");
    await page.getByRole("radio", { name: "Proyectos", exact: true }).click();
    await expectConnected();
    const measureGaps = () => rail.evaluate((list) => {
      const items = [...list.querySelectorAll('[data-timeline-category]:not([hidden])')];
      return items.slice(1).map((item, index) => {
        const previousContent = items[index].querySelector('[data-contract="timeline-reader"]')
          ?? items[index].querySelector("button");
        return item.querySelector("button").getBoundingClientRect().top - previousContent.getBoundingClientRect().bottom;
      });
    });
    for (const gap of await measureGaps()) expect(gap).toBeCloseTo(20, 0);
    const last = page.getByRole("button", { name: /Proyecto de Empate/ });
    await last.click();
    await expectConnected();
    for (const gap of await measureGaps()) expect(gap).toBeCloseTo(20, 0);
    await page.getByRole("radio", { name: "Todo", exact: true }).click();
    await expectConnected();
    // Cambio de contenido visible: el wrapping desplaza el centro del nodo sin cambiar el viewport.
    await last.locator("h3").evaluate((heading) => { heading.textContent += " con un título más largo que ocupa varias líneas y conserva todo su contenido"; });
    await expectConnected();
    await page.setViewportSize({ width: viewport.width >= 1024 ? 390 : 1366, height: 844 });
    await expectConnected();
  });
}

for (const viewport of [
  { width: 1366, height: 768 }, { width: 1440, height: 900 },
  { width: 360, height: 800 }, { width: 390, height: 844 },
]) {
  test(`los filtros compactos no se recortan y separan foco y selección en ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    const filters = page.getByRole("group", { name: "Filtrar trayectoria" });
    const options = filters.locator("label");
    const boxes = await options.evaluateAll((labels) => labels.map((label) => {
      const { x, y, width, height } = label.getBoundingClientRect();
      return { x, y, width, height };
    }));
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.height).toBeLessThanOrEqual(32);
    }
    for (let index = 1; index < boxes.length; index++) {
      const previous = boxes[index - 1];
      const current = boxes[index];
      if (current.y === previous.y) expect(current.x - previous.x - previous.width).toBeCloseTo(8, 0);
      else expect(current.y - previous.y - previous.height).toBeCloseTo(8, 0);
    }
    const all = page.getByRole("radio", { name: "Todo", exact: true });
    await expect(all.locator("..")).toHaveCSS("background-color", "rgb(203, 213, 225)");
    await all.focus();
    await page.keyboard.press("ArrowRight");
    const work = page.getByRole("radio", { name: "Experiencia profesional" });
    await expect(work).toBeFocused();
    await expect(work.locator("..")).toHaveCSS("background-color", "rgb(224, 179, 84)");
    await expect(work.locator("..")).toHaveCSS("box-shadow", "rgb(7, 19, 26) 0px 0px 0px 1px inset");
    const first = page.getByRole("button", { name: /Arquitecta de software/ });
    await first.focus();
    await expect(first).toHaveCSS("outline-style", "none");
    await expect(first).toHaveCSS("outline-offset", "0px");
    await expect(first).toHaveCSS("box-shadow", "rgb(201, 190, 166) 0px 0px 0px 1px inset");
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await expect(work.locator("..")).toHaveCSS("box-shadow", "none");
    await page.getByRole("radio", { name: "Proyectos", exact: true }).click();
    await expect(page.getByRole("radio", { name: "Proyectos", exact: true }).locator("..")).toHaveCSS("background-color", "rgb(129, 140, 248)");
    await page.getByRole("radio", { name: "Formación", exact: true }).click();
    await expect(page.getByRole("radio", { name: "Formación", exact: true }).locator("..")).toHaveCSS("background-color", "rgb(45, 212, 191)");
  });
}

test("la experiencia interactiva compone identidad y trayectoria en columnas en desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");

  const hero = page.getByRole("heading", { name: "Alicia Ejemplo" });
  const timeline = page.getByRole("region", { name: "Trayectoria" });
  const readLink = page.getByRole("link", { name: "Leer CV web" });

  await expect(page.getByRole("main")).toHaveCSS("display", "grid");
  await expect(page.getByRole("heading", { name: "Alicia Ejemplo" })).toBeInViewport();
  await expect(page.getByRole("heading", { name: "Alicia Ejemplo" })).toHaveCSS(
    "font-family",
    /Newsreader/,
  );
  await expect(
    page.getByText("Especialista en sistemas ficticios", { exact: true }),
  ).toBeInViewport();
  await expect(readLink).toBeInViewport();
  await expect(readLink).toHaveCSS("font-family", /Inter/);
  await expect(page.getByRole("link", { name: "Contactar" })).toBeInViewport();

  const [heroBox, timelineBox] = await Promise.all([
    hero.boundingBox(),
    timeline.boundingBox(),
  ]);

  expect(heroBox).not.toBeNull();
  expect(timelineBox).not.toBeNull();
  expect(timelineBox.x).toBeGreaterThan(heroBox.x + heroBox.width);

  for (let index = 0; index < 5; index++) await page.keyboard.press("Tab");
  await expect(readLink).toBeFocused();
  await expect(readLink).toHaveCSS("box-shadow", "rgb(201, 190, 166) 0px 0px 0px 1px inset");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/profile-site\/read\/$/);
});

test.describe("en mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("la identidad mantiene CTAs visibles y enlaza la trayectoria consecutiva", async ({
    page,
  }) => {
    await page.goto("./");

    const hero = page.getByRole("heading", { name: "Alicia Ejemplo" });
    const timeline = page.getByRole("region", { name: "Trayectoria" });
    const exploreLink = page.getByRole("link", {
      name: "Explorar trayectoria",
    });

    await expect(page.getByRole("heading", { name: "Alicia Ejemplo" })).toBeInViewport();
    await expect(page.getByRole("link", { name: "Leer CV web" })).toBeInViewport();
    await expect(page.getByRole("link", { name: "Contactar" })).toBeInViewport();
    await expect(exploreLink).toBeVisible();
    await expect(exploreLink).toHaveAttribute("href", "#timeline-heading");
    await expect(page.getByRole("main")).toHaveCSS("display", "block");

    const [heroBox, timelineBox] = await Promise.all([
      hero.boundingBox(),
      timeline.boundingBox(),
    ]);

    expect(heroBox).not.toBeNull();
    expect(timelineBox).not.toBeNull();
    expect(timelineBox.y).toBeGreaterThan(heroBox.y);

    await exploreLink.click();
    await expect(page.getByRole("heading", { name: "Trayectoria" })).toBeInViewport();
  });
});

test("la experiencia interactiva conserva el arbol completo al desactivar JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4321/profile-site/");

  await expect(page.getByRole("heading", { name: "Alicia Ejemplo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Leer CV web" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contactar" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explorar trayectoria" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trayectoria" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Trayectoria" }).getByRole("article"),
  ).toHaveCount(6);
  await expect(page.locator('[data-contract="timeline-filters"]')).toBeHidden();
  await expect(page.locator('[data-contract="timeline-reader"]')).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);

  await context.close();
});

test("el fallback desktop no muestra un lector y conserva todos los detalles", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4321/profile-site/");

  await expect(page.locator('[data-contract="timeline-reader"]')).toHaveCount(0);
  await expect(
    page.getByRole("article").filter({ hasText: "Arquitecta de software" }),
  ).toContainText("Redujo el tiempo de entrega.");
  await expect(
    page.getByRole("article").filter({ hasText: "Proyecto Vigente" }),
  ).toContainText("Node.js");

  await context.close();
});

test("el filtro inicial muestra la trayectoria combinada", async ({ page }) => {
  await page.goto("./");

  const filters = page.getByRole("group", { name: "Filtrar trayectoria" });

  await expect(filters).toBeVisible();
  await expect(
    page.getByRole("radio", { name: "Todo", exact: true }),
  ).toBeChecked();
  await expect(page.getByRole("radio")).toHaveCount(4);
  await expect(page.locator("[data-timeline-category]")).toHaveCount(6);
  await expect(page.locator("[data-timeline-category]:not([hidden])")).toHaveCount(6);
});

test("los filtros muestran cada categoria y anuncian el resultado sin persistirlo", async ({
  page,
}) => {
  await page.goto("./");

  const status = page.getByRole("status");
  const timeline = page.getByRole("region", { name: "Trayectoria" });
  const initialUrl = page.url();
  const initialBrowserState = await page.evaluate(() => ({
    historyLength: window.history.length,
    localStorage: Object.entries(window.localStorage),
    sessionStorage: Object.entries(window.sessionStorage),
  }));

  for (const [filterValue, label, count, announcement] of [
    [
      "work",
      "Experiencia profesional",
      2,
      "Se muestran 2 hitos de experiencia profesional.",
    ],
    ["projects", "Proyectos", 3, "Se muestran 3 hitos de proyectos."],
    ["education", "Formación", 1, "Se muestra 1 hito de formación."],
    ["all", "Todo", 6, "Se muestran 6 hitos de toda la trayectoria."],
  ]) {
    await page.getByRole("radio", { name: label }).click();

    await expect(page.locator("[data-timeline-category]:not([hidden])")).toHaveCount(
      count,
    );
    await expect(timeline.locator('[data-contract="timeline-rail"]').getByRole("article")).toHaveCount(count);
    if (filterValue !== "all") {
      await expect(
        timeline.locator(`[data-timeline-category="${filterValue}"]:not([hidden])`),
      ).toHaveCount(count);
    }
    await expect(status).toHaveText(announcement);
    await expect(page).toHaveURL(initialUrl);
    expect(
      await page.evaluate(() => ({
        historyLength: window.history.length,
        localStorage: Object.entries(window.localStorage),
        sessionStorage: Object.entries(window.sessionStorage),
      })),
    ).toEqual(initialBrowserState);
  }

  await page.reload();

  await expect(
    page.getByRole("radio", { name: "Todo", exact: true }),
  ).toBeChecked();
  await expect(page.locator("[data-timeline-category]:not([hidden])")).toHaveCount(6);
  await expect(page.locator('[data-contract="milestone-trigger"]').first()).toHaveAttribute("aria-pressed", "true");
});

test("el teclado cambia el filtro y conserva el foco sin desplazar el documento", async ({
  page,
}) => {
  await page.goto("./");

  const allFilter = page.getByRole("radio", { name: "Todo", exact: true });
  const workFilter = page.getByRole("radio", {
    name: "Experiencia profesional",
  });
  const timeline = page.getByRole("region", { name: "Trayectoria" });
  const rail = page.locator('[data-contract="timeline-rail"]');
  const initialScrollTop = await page.evaluate(() => window.scrollY);

  await rail.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  expect(await rail.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  await allFilter.focus();
  await page.keyboard.press("ArrowRight");

  await expect(workFilter).toBeChecked();
  await expect(workFilter).toBeFocused();
  await expect(workFilter).toBeInViewport();
  await expect(page.getByRole("status")).toHaveText(
    "Se muestran 2 hitos de experiencia profesional.",
  );
  await expect(rail.getByRole("article")).toHaveCount(2);
  await expect(timeline.locator("[data-timeline-category]").first()).toHaveAttribute(
    "data-timeline-category",
    "work",
  );
  expect(await page.evaluate(() => window.scrollY)).toBe(initialScrollTop);
  await expect(rail.locator('[data-contract="milestone-trigger"][aria-pressed="true"]')).toHaveCount(1);
});

test.describe("con entrada touch", () => {
  test.use({ hasTouch: true });

  test("el filtro responde al toque", async ({ page }) => {
    await page.goto("./");

    await page.getByRole("radio", { name: "Proyectos" }).tap();

    await expect(page.locator("[data-timeline-category]:not([hidden])")).toHaveCount(3);
  });
});

test.describe("lector lateral desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("selecciona inicialmente el primer hito y mantiene un detalle por clic, Enter, Espacio y Escape", async ({
    page,
  }) => {
    await page.goto("./");

    const firstMilestone = page
      .locator('[data-contract="milestone-trigger"]')
      .filter({ hasText: "Arquitecta de software" });
    const secondMilestone = page
      .locator('[data-contract="milestone-trigger"]')
      .filter({ hasText: "Proyecto Vigente" });
    const reader = page.locator('[data-contract="timeline-reader"]');
    const rail = page.locator('[data-contract="timeline-rail"]');
    const initialRailBox = await rail.boundingBox();

    await expect(firstMilestone).toHaveAttribute("aria-pressed", "true");
    await expect(reader).toBeVisible();
    await expect(firstMilestone).toHaveAccessibleName(/Experiencia profesional.*Arquitecta de software.*Laboratorio Vigente.*enero de 2025.*Actualidad/);
    await expect(firstMilestone).not.toHaveAttribute("aria-expanded");

    await firstMilestone.click({ force: true });

    await expect(firstMilestone).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]'),
    ).toHaveCount(1);
    await expect(reader).toBeVisible();
    await expect(reader).toContainText("Experiencia profesional");
    await expect(reader).toContainText("Arquitecta de software");
    await expect(reader).toContainText("Laboratorio Vigente");
    await expect(reader).toContainText("enero de 2025 - Actualidad");
    expect(await rail.boundingBox()).toEqual(initialRailBox);

    await secondMilestone.click({ force: true });

    await expect(firstMilestone).toHaveAttribute("aria-pressed", "false");
    await expect(secondMilestone).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]'),
    ).toHaveCount(1);
    await expect(reader).toContainText("Proyecto Vigente");

    await firstMilestone.focus();
    await page.keyboard.press("Enter");
    await expect(firstMilestone).toHaveAttribute("aria-pressed", "true");
    await expect(firstMilestone).toBeFocused();
    await secondMilestone.focus();
    await page.keyboard.press("Space");

    await expect(reader).toBeVisible();
    await expect(secondMilestone).toHaveAttribute("aria-pressed", "true");
    await expect(secondMilestone).toBeFocused();
    await page.keyboard.press("Space");
    await expect(secondMilestone).toHaveAttribute("aria-pressed", "true");
    expect(await rail.boundingBox()).toEqual(initialRailBox);

    await secondMilestone.focus();
    await page.keyboard.press("Enter");
    await expect(reader).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(reader).toBeVisible();
    await expect(secondMilestone).toHaveAttribute("aria-pressed", "true");
    await expect(secondMilestone).toBeFocused();
    await expect(page.getByRole("button", { name: /Cerrar|Pausar|Reanudar/ })).toHaveCount(0);
  });

  test("un filtro compatible conserva el detalle y uno excluyente selecciona el primer resultado", async ({
    page,
  }) => {
    await page.goto("./");

    const milestone = page
      .locator('[data-contract="milestone-trigger"]')
      .filter({ hasText: "Arquitecta de software" });
    const reader = page.locator('[data-contract="timeline-reader"]');

    const readerNode = await reader.elementHandle();
    const detailNode = await reader.locator('[data-contract="milestone-detail"]').elementHandle();
    const workFilter = page.getByRole("radio", { name: "Experiencia profesional" });
    await workFilter.click();
    await expect(workFilter).toBeFocused();
    await expect(milestone).toHaveAttribute("aria-pressed", "true");
    expect(await detailNode.evaluate((node) => node.isConnected)).toBe(true);
    const projectsFilter = page.getByRole("radio", { name: "Proyectos", exact: true });
    await projectsFilter.click();
    await expect(projectsFilter).toBeFocused();
    await expect(reader).toBeVisible();
    expect(await readerNode.evaluate((node) => node.isConnected)).toBe(true);
    expect(await detailNode.evaluate((node) => node.isConnected)).toBe(false);
    await expect(
      page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]'),
    ).toHaveCount(1);
    const firstProject = page.getByRole("button", { name: /Proyecto Vigente/ });
    await expect(firstProject).toHaveAttribute("aria-pressed", "true");
    await expect(reader).toContainText("Proyecto Vigente");
    await expect(reader).not.toContainText("Madrid");
    await expect(reader).not.toContainText("Redujo el tiempo de entrega.");
    await expect(page.getByRole("status")).toHaveText(
      "Se muestran 3 hitos de proyectos.",
    );
    await page.keyboard.press("Tab");
    await expect(page.getByRole("list", { name: "Hitos de la trayectoria", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(firstProject).toBeFocused();
    const educationFilter = page.getByRole("radio", { name: "Formación" });
    await educationFilter.focus();
    for (const key of ["Space", "ArrowLeft", "ArrowLeft", "ArrowRight", "ArrowRight"]) {
      await page.keyboard.press(key);
      const checkedValue = await page.getByRole("radio", { checked: true }).inputValue();
      const selected = page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]');
      await expect(selected).toHaveCount(1);
      await expect(selected).toBeVisible();
      if (checkedValue !== "all") {
        expect(await selected.evaluate((node) => node.closest("[data-timeline-category]").dataset.timelineCategory)).toBe(checkedValue);
      }
    }
  });
});

test("el breakpoint recoloca la misma instancia conservando filtro, selección y contenido", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("./");
  await page.getByRole("radio", { name: "Proyectos", exact: true }).click();
  const trigger = page.getByRole("button", { name: /Proyecto de Empate/ });
  await trigger.click();
  const reader = page.locator('[data-contract="timeline-reader"]');
  const readerNode = await reader.elementHandle();
  const detailNode = await reader.locator('[data-contract="milestone-detail"]').elementHandle();
  for (const viewport of [{ width: 360, height: 800 }, { width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect(reader).toHaveAttribute("role", viewport.width >= 1024 ? "complementary" : "region");
    await expect(page.getByRole("radio", { name: "Proyectos", exact: true })).toBeChecked();
    await expect(trigger).toHaveAttribute("aria-pressed", "true");
    await expect(trigger).toBeFocused();
    await expect(reader).toContainText("Proyecto de Empate");
    await expect(reader).toHaveCount(1);
    expect(await readerNode.evaluate((node) => node.isConnected)).toBe(true);
    expect(await detailNode.evaluate((node) => node.isConnected)).toBe(true);
    if (viewport.width < 1024) {
      expect(await trigger.evaluate((node) => node.nextElementSibling?.getAttribute("data-contract"))).toBe("timeline-reader");
    } else {
      expect(await reader.evaluate((node) => node.parentElement.contains(document.querySelector('[data-contract="timeline-rail"]')))).toBe(true);
    }
  }
});

test("la experiencia interactiva no contiene vulneraciones Axe de nivel AA", async ({
  page,
}) => {
  await page.goto("./");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("las acciones comunican la activacion sin depender solo del color", async ({
  page,
}) => {
  await page.goto("./");

  const contactLink = page.getByRole("link", { name: "Contactar" });

  await contactLink.hover();
  await page.mouse.down();
  await expect(contactLink).toHaveCSS("text-decoration-line", "underline");
  await page.mouse.up();
});
