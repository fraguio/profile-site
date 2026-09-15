import { readFileSync } from "node:fs";

type Resume = {
  basics: {
    email: string;
    label: string;
    name: string;
    summary: string;
  };
};

const resumePath = process.env.RESUME_PATH;

if (!resumePath) {
  throw new Error("RESUME_PATH is required.");
}

export const resume = JSON.parse(readFileSync(resumePath, "utf8")) as Resume;
