import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import resumeSchema from "../../schemas/jsonresume-1.3.1.json";

type Resume = {
  basics: {
    email: string;
    label: string;
    name: string;
    summary: string;
  };
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
