import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import resumeSchema from "../../schemas/jsonresume-1.3.1.json";

type Profile = {
  network?: string;
  url?: string;
};

type Resume = {
  basics: {
    email: string;
    label: string;
    name: string;
    summary: string;
    url?: string;
    location?: {
      city?: string;
      countryCode?: string;
      region?: string;
    };
    profiles?: Profile[];
  };
  education?: Array<{
    area?: string;
    courses?: string[];
    endDate?: string;
    institution?: string;
    skills?: string[];
    startDate: string;
    studyType?: string;
  }>;
  projects?: Array<{
    description?: string;
    endDate?: string;
    entity?: string;
    highlights?: string[];
    keywords?: string[];
    name?: string;
    roles?: string[];
    startDate: string;
  }>;
  work?: Array<{
    description?: string;
    endDate?: string;
    highlights?: string[];
    location?: string;
    name?: string;
    position?: string;
    skills?: string[];
    startDate: string;
    summary?: string;
  }>;
};

export type TimelineCategory = "education" | "projects" | "work";

type TimelineMilestone = {
  category: TimelineCategory;
  categoryLabel: string;
  description?: string;
  endDate?: string;
  endDateLabel?: string;
  entity?: string;
  highlights: string[];
  location?: string;
  order: number;
  roles: string[];
  skills: string[];
  startDate: string;
  startDateLabel: string;
  summary?: string;
  title?: string;
};

type ResumeRecord = Record<string, unknown>;

const schemaValidator = addFormats(new Ajv({ allErrors: true })).compile(
  resumeSchema,
);

const resumePath = process.env.RESUME_PATH;

if (!resumePath) {
  throw new Error("RESUME_PATH is required.");
}

const resumeData = JSON.parse(readFileSync(resumePath, "utf8")) as unknown;

validateResume(resumeData);

export const resume = resumeData as Resume;
export const timeline = createTimeline(resume);
export const formattedLocation = formatLocation(resume.basics.location);
export const professionalProfiles = (resume.basics.profiles ?? []).filter(
  (profile) => profile.network?.trim() && profile.url?.trim(),
).sort(
  (left, right) => profilePriority(left.network) - profilePriority(right.network),
);

function validateResume(resume: unknown) {
  if (!schemaValidator(resume)) {
    const diagnostics = (schemaValidator.errors ?? []).map((error) => {
      const path = toResumePath(error.instancePath);
      const value = formatValue(valueAtPath(resume, error.instancePath));

      return `${path}: ${value} violates JSON Resume 1.3.1 schema: ${error.message}.`;
    });

    throw new Error(["Resume validation failed:", ...diagnostics].join("\n"));
  }

  const diagnostics = validateLocalRules(resume as ResumeRecord);

  if (diagnostics.length > 0) {
    throw new Error(["Resume validation failed:", ...diagnostics].join("\n"));
  }
}

function validateLocalRules(resume: ResumeRecord) {
  const diagnostics = [];
  const basics = asRecord(resume.basics);

  for (const field of ["name", "label", "email", "summary"]) {
    const value = basics?.[field];

    if (typeof value !== "string" || value.trim() === "") {
      diagnostics.push(
        `resume.basics.${field}: ${formatValue(value)} violates local presentation rule "is required and must be a non-empty string".`,
      );
    }
  }

  for (const section of ["work", "education", "projects"]) {
    const entries = resume[section];

    if (!Array.isArray(entries)) {
      continue;
    }

    for (const [index, entry] of entries.entries()) {
      const record = asRecord(entry);

      if (!record) {
        continue;
      }

      const prefix = `resume.${section}[${index}]`;
      const startDate = record.startDate;
      const endDate = record.endDate;

      if (!isValidDate(startDate)) {
        diagnostics.push(
          `${prefix}.startDate: ${formatValue(startDate)} violates local rule "must be a valid ISO 8601 date".`,
        );
      }

      if (endDate !== undefined && !isValidDate(endDate)) {
        diagnostics.push(
          `${prefix}.endDate: ${formatValue(endDate)} violates local rule "must be a valid ISO 8601 date".`,
        );
      }

      if (
        isValidDate(startDate) &&
        isValidDate(endDate) &&
        toDatePosition(endDate) < toDatePosition(startDate)
      ) {
        diagnostics.push(
          `${prefix}.endDate: ${formatValue(endDate)} violates local rule "must not be earlier than startDate ${formatValue(startDate)}".`,
        );
      }

      if (section === "work" || section === "education") {
        validateSkills(diagnostics, `${prefix}.skills`, record.skills);
      }
    }
  }

  return diagnostics;
}

function validateSkills(diagnostics: string[], path: string, skills: unknown) {
  if (skills === undefined) {
    return;
  }

  if (!Array.isArray(skills)) {
    diagnostics.push(
      `${path}: ${formatValue(skills)} violates local rule "must be an array of non-empty strings".`,
    );
    return;
  }

  for (const [index, skill] of skills.entries()) {
    if (typeof skill !== "string" || skill.trim() === "") {
      diagnostics.push(
        `${path}[${index}]: ${formatValue(skill)} violates local rule "must be a non-empty string".`,
      );
    }
  }
}

function createTimeline(resume: Resume) {
  const milestones: TimelineMilestone[] = [];
  let order = 0;

  for (const work of resume.work ?? []) {
    const title = text(work.position) ?? text(work.name);

    milestones.push({
      category: "work",
      categoryLabel: "Experiencia profesional",
      description: text(work.description),
      endDate: work.endDate,
      endDateLabel: work.endDate ? formatDate(work.endDate) : undefined,
      entity: title === work.name ? undefined : text(work.name),
      highlights: uniqueTexts(work.highlights),
      location: text(work.location),
      order: order++,
      roles: [],
      skills: uniqueTexts(work.skills),
      startDate: work.startDate,
      startDateLabel: formatDate(work.startDate),
      summary: text(work.summary),
      title,
    });
  }

  for (const education of resume.education ?? []) {
    const title = educationTitle(education);

    milestones.push({
      category: "education",
      categoryLabel: "Formación",
      description: undefined,
      endDate: education.endDate,
      endDateLabel: education.endDate ? formatDate(education.endDate) : undefined,
      entity: title === education.institution ? undefined : text(education.institution),
      highlights: uniqueTexts(education.courses),
      location: undefined,
      order: order++,
      roles: [],
      skills: uniqueTexts(education.skills),
      startDate: education.startDate,
      startDateLabel: formatDate(education.startDate),
      summary: undefined,
      title,
    });
  }

  for (const project of resume.projects ?? []) {
    milestones.push({
      category: "projects",
      categoryLabel: "Proyectos",
      description: text(project.description),
      endDate: project.endDate,
      endDateLabel: project.endDate ? formatDate(project.endDate) : undefined,
      entity: text(project.entity),
      highlights: uniqueTexts(project.highlights),
      location: undefined,
      order: order++,
      roles: uniqueTexts(project.roles),
      skills: uniqueTexts(project.keywords),
      startDate: project.startDate,
      startDateLabel: formatDate(project.startDate),
      summary: undefined,
      title: text(project.name),
    });
  }

  return milestones.sort(compareMilestones);
}

function formatLocation(location: Resume["basics"]["location"]) {
  if (!location) {
    return undefined;
  }

  const country = location.countryCode
    ? localizeCountry(location.countryCode)
    : undefined;
  const values = [location.city, location.region, country].filter(
    (value) => value?.trim(),
  );

  return values.length > 0 ? values.join(", ") : undefined;
}

function localizeCountry(countryCode: string) {
  try {
    return new Intl.DisplayNames(["es"], { type: "region" }).of(countryCode);
  } catch {
    return countryCode;
  }
}

function profilePriority(network: string | undefined) {
  switch (network?.toLowerCase()) {
    case "linkedin":
      return 0;
    case "github":
      return 1;
    default:
      return 2;
  }
}

function compareMilestones(left: TimelineMilestone, right: TimelineMilestone) {
  if (left.endDate === undefined && right.endDate !== undefined) {
    return -1;
  }

  if (left.endDate !== undefined && right.endDate === undefined) {
    return 1;
  }

  if (left.endDate && right.endDate) {
    const endDateDifference = toDatePosition(right.endDate) - toDatePosition(left.endDate);

    if (endDateDifference !== 0) {
      return endDateDifference;
    }
  }

  const startDateDifference =
    toDatePosition(right.startDate) - toDatePosition(left.startDate);

  return startDateDifference === 0 ? left.order - right.order : startDateDifference;
}

function educationTitle(education: NonNullable<Resume["education"]>[number]) {
  const studyType = text(education.studyType);
  const area = text(education.area);

  if (studyType && area) {
    return `${studyType} en ${area}`;
  }

  return studyType ?? area ?? text(education.institution);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    timeZone: "UTC",
  };

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

function uniqueTexts(values: string[] | undefined) {
  return [...new Set((values ?? []).flatMap((value) => text(value) ?? []))];
}

function text(value: string | undefined) {
  return value?.trim() === "" ? undefined : value;
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2] ?? "01");
  const day = Number(match[3] ?? "01");
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function toDatePosition(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

function toResumePath(instancePath: string) {
  if (instancePath === "") {
    return "resume";
  }

  return `resume${instancePath.replace(/\/(\d+)|\/([^/]+)/g, (_, index, field) =>
    index === undefined ? `.${field}` : `[${index}]`,
  )}`;
}

function valueAtPath(value: unknown, instancePath: string): unknown {
  if (instancePath === "") {
    return value;
  }

  return instancePath.slice(1).split("/").reduce<unknown>((current, segment) => {
    if (Array.isArray(current)) {
      return current[Number(segment)];
    }

    return asRecord(current)?.[segment];
  }, value);
}

function asRecord(value: unknown): ResumeRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as ResumeRecord)
    : undefined;
}

function formatValue(value: unknown) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (value === undefined) {
    return "undefined";
  }

  if (Array.isArray(value)) {
    return "[array]";
  }

  if (value !== null && typeof value === "object") {
    return "[object]";
  }

  return String(value);
}
