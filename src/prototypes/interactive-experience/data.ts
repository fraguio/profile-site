import fixture from "./resume.fixture.json";

type Basics = {
  email: string;
  label: string;
  name: string;
  summary: string;
  url?: string;
};

export type ResumeEntry = {
  description?: string;
  details?: string[];
  endDate?: string;
  entity?: string;
  highlights?: string[];
  institution?: string;
  keywords?: string[];
  location?: string;
  name?: string;
  notes?: string;
  position?: string;
  roles?: string[];
  skills?: string[];
  startDate: string;
  summary?: string;
  title?: string;
};

export type PrototypeResume = {
  basics: Basics;
  education: ResumeEntry[];
  projects: ResumeEntry[];
  work: ResumeEntry[];
};

validatePrototypeResume(fixture);

export const prototypeResume = fixture as PrototypeResume;

export function associatedSkills(entry: ResumeEntry, section: "education" | "projects" | "work") {
  const source = section === "projects" ? entry.keywords : entry.skills;

  return [...new Set((source ?? []).filter((skill) => skill.trim() !== ""))];
}

export function formatPeriod(entry: ResumeEntry) {
  return `${formatDate(entry.startDate)} - ${entry.endDate ? formatDate(entry.endDate) : "Actualidad"}`;
}

function validatePrototypeResume(value: unknown): asserts value is PrototypeResume {
  if (!isRecord(value) || !isRecord(value.basics)) {
    throw new Error("Prototype fixture must include basics.");
  }

  for (const field of ["name", "label", "email", "summary"]) {
    if (typeof value.basics[field] !== "string" || value.basics[field].trim() === "") {
      throw new Error(`Prototype fixture basics.${field} must be a non-empty string.`);
    }
  }

  for (const section of ["work", "education", "projects"]) {
    if (!Array.isArray(value[section])) {
      throw new Error(`Prototype fixture ${section} must be an array.`);
    }

    for (const [index, entry] of value[section].entries()) {
      if (!isRecord(entry) || !isIsoDate(entry.startDate) || (entry.endDate && !isIsoDate(entry.endDate))) {
        throw new Error(`Prototype fixture ${section}[${index}] must contain valid dates.`);
      }
    }
  }
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const options: Intl.DateTimeFormatOptions = { timeZone: "UTC", year: "numeric" };

  if (month !== undefined) {
    options.month = "long";
  }

  if (day !== undefined) {
    options.day = "numeric";
  }

  return new Intl.DateTimeFormat("es-ES", options).format(
    new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)),
  );
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
