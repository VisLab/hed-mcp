import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormattedIssue, HedValidationResult } from "../types/index.js";
import { formatIssues } from "../utils/issueFormatter.js";
import { readFileFromPath } from "../utils/fileReader.js";

// Import HED validation functions
import { buildSchemasFromVersion, BidsSidecar } from "hed-validator";

// Define the schema for the tool's input arguments
const ValidateHedSidecarSchema = z.object({
  filePath: z.string().describe("The absolute path to the sidecar file to validate"),
  hedVersion: z.string().describe("The HED schema version to use (e.g., 8.4.0 or lang_1.1.0, score_2.1.0)"),
  checkForWarnings: z.boolean().optional().default(false).describe("Whether to check for warnings in addition to errors"),
  fileData: z.any().optional().describe("Optional file data to use instead of reading from filePath")
});

export type ValidateHedSidecarArgs = z.infer<typeof ValidateHedSidecarSchema>;

/**
 * Tool definition for validating HED sidecar files
 */
export const validateHedSidecar: Tool = {
  name: "validateHedSidecar",
  description: "Validates a HED sidecar file using the specified HED schema version",
  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "The absolute path to the sidecar file to validate"
      },
      hedVersion: {
        type: "string",
        description: "The HED schema version to use (e.g., 8.4.0 or lang_1.1.0, score_2.1.0)"
      },
      checkForWarnings: {
        type: "boolean",
        description: "Whether to check for warnings in addition to errors",
        default: false
      },
      fileData: {
        description: "Optional file data to use instead of reading from filePath",
      }
    },
    required: ["filePath", "hedVersion"]
  }
};

/**
 * Validate a HED sidecar file using the specified HED schema version.
 */
export async function handleValidateHedSidecar(args: ValidateHedSidecarArgs): Promise<HedValidationResult> {
  const { filePath, hedVersion, checkForWarnings = false, fileData='' } = args;

  try {
    // Use buildSchemasFromVersion with the specified version
    const hedSchemas = await buildSchemasFromVersion(hedVersion);
    console.log(`Successfully loaded HED schemas for version ${hedVersion}`);

    // Get the file data if not provided
    let data = fileData;
    if (data === undefined || data === null || data === '') {
      try {
        data = await readFileFromPath(filePath);
      } catch (error) {
        return {
          isValid: false,
          errors: [{
            code: "FILE_READ_ERROR",
            detailedCode: "FILE_READ_ERROR",
            severity: "error",
            message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            line: "",
            column: "",
            location: filePath
          }],
          warnings: []
        };
      }
    }

    // Parse JSON data if it's a string, otherwise assume it's already parsed
    let jsonData;
    if (typeof data === 'string') {
      try {
        jsonData = JSON.parse(data);
      } catch (error) {
        return {
          isValid: false,
          errors: [{
            code: "JSON_PARSE_ERROR",
            detailedCode: "JSON_PARSE_ERROR",
            severity: "error",
            message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Invalid JSON format'}`,
            line: "",
            column: "",
            location: filePath
          }],
          warnings: []
        };
      }
    } else {
      jsonData = data;
    }
    const fileName = filePath.split(/[/\\]/).pop() || "sidecar.json"; // Extract file name from path (handle both / and \)
    const sidecar = new BidsSidecar(fileName, { path: filePath, name: fileName }, jsonData);
    const validationIssues = sidecar.validate(hedSchemas);
    // TODO: warning separation here.
    
    const formattedErrors = formatIssues(validationIssues);
    const isValid = formattedErrors.length === 0;
    let formattedWarnings: FormattedIssue[] = [];
    // if (checkForWarnings && formattedWarnings.length > 0) {
    //  formattedWarnings = formatIssues(warnings);
    // }
    
    return {
      isValid: isValid,
      errors: formattedErrors,
      warnings: formattedWarnings
    };

  } catch (error) {
    console.error('HED sidecar validation error:', error);
    return {
      isValid: false,
      errors: [{
        code: "VALIDATION_ERROR",
        detailedCode: "VALIDATION_ERROR",
        severity: "error",
        message: `Validation failed: ${error && typeof error === "object" && "message" in error ? error.message : error instanceof Error ? error.message : 'Unknown error'}`,
        line: "",
        column: "",
        location: ""
      }],
      warnings: []
    };
  }
}
