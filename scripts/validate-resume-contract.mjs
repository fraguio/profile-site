import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const DEFAULT_RESUME_PATH = "data/resume.json";
const DEFAULT_SCHEMA_PATH = "schema/resume-schema-v1.2.1.json";

function printUsage() {
  console.error("Usage: node scripts/validate-resume-contract.mjs [--resume <path>] [--schema <path>]");
}

function parseArgs(argv) {
  const options = {
    resume: DEFAULT_RESUME_PATH,
    schema: DEFAULT_SCHEMA_PATH
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--resume" || token === "--schema") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        printUsage();
        throw new Error(`Missing value for '${token}'`);
      }

      const optionName = token.slice(2);
      options[optionName] = value;
      index += 1;
      continue;
    }

    printUsage();
    throw new Error(`Unknown argument '${token}'`);
  }

  return options;
}

async function readJsonFile(filePath, label) {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Unable to load ${label} at '${filePath}': ${error.message}`);
  }
}

function toFieldPath(instancePath) {
  if (!instancePath || instancePath === "/") {
    return "<root>";
  }

  return instancePath
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .join(".");
}

function toSchemaPath(schemaPathValue) {
  if (!schemaPathValue || schemaPathValue === "#") {
    return "<root>";
  }

  return schemaPathValue
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .join(".");
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const resumePath = path.resolve(args.resume);
    const schemaPath = path.resolve(args.schema);

    const [schema, resume] = await Promise.all([
      readJsonFile(schemaPath, "schema"),
      readJsonFile(resumePath, "resume payload")
    ]);

    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(resume);

    if (!valid) {
      console.error("::error::JSON Resume v1.2.1 validation failed. Rendering and deploy are blocked.");

      const diagnostics = [...(validate.errors ?? [])].sort((left, right) => {
        const leftPath = left.instancePath ?? "";
        const rightPath = right.instancePath ?? "";
        if (leftPath !== rightPath) {
          return leftPath.localeCompare(rightPath);
        }

        const leftSchema = left.schemaPath ?? "";
        const rightSchema = right.schemaPath ?? "";
        return leftSchema.localeCompare(rightSchema);
      });

      diagnostics.forEach((diagnostic, index) => {
        const field = toFieldPath(diagnostic.instancePath);
        const rule = diagnostic.keyword ?? "<unknown>";
        const schemaRule = toSchemaPath(diagnostic.schemaPath);
        const rootCause = diagnostic.message ?? "<unknown>";

        console.error(`[${index + 1}] field=${field}`);
        console.error(`    rule=${rule}`);
        console.error(`    schema_rule=${schemaRule}`);
        console.error(`    root_cause=${rootCause}`);
      });

      process.exit(1);
    }

    console.log("JSON Resume v1.2.1 validation passed.");
  } catch (error) {
    console.error("::error::JSON Resume v1.2.1 validation failed. Rendering and deploy are blocked.");
    console.error(`root_cause=${error.message}`);
    process.exit(1);
  }
}

await main();
