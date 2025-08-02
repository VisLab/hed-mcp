import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as path from "path";
import { FormattedIssue, HedValidationResult } from "../types/index.js";
import { formatIssues, separateIssuesBySeverity } from "../utils/issueFormatter.js";
import { readFileFromPath } from "../utils/fileReader.js";
import { schemaCache } from '../utils/schemaCache.js';
import { mcpToZod } from '../utils/mcpToZod.js';

// Import HED validation functions
import { buildSchemasFromVersion, BidsSidecar } from "hed-validator";

// Define the MCP inputSchema first
const validateHedSidecarInputSchema = {
  type: "object" as const,
  properties: {
    filePath: {
      type: "string" as const,
      description: "The absolute path to the sidecar file to validate"
    },
    hedVersion: {
      type: "string" as const,
      description: "The HED schema version to use (e.g., 8.4.0 or lang_1.1.0, score_2.1.0)"
    },
    checkForWarnings: {
      type: "boolean" as const,
      description: "Whether to check for warnings in addition to errors",
      default: false
    },
    fileData: {
      description: "Optional file data to use instead of reading from filePath"
    }
  },
  required: ["filePath", "hedVersion"]
};

// Generate Zod schema from MCP schema
const ValidateHedSidecarSchema = mcpToZod(validateHedSidecarInputSchema);

export type ValidateHedSidecarArgs = z.infer<typeof ValidateHedSidecarSchema>;

/**
 * Tool definition for validating HED sidecar files
 */
export const validateHedSidecar: Tool = {
  name: "validateHedSidecar",
  description: "Validates a HED sidecar file using the specified HED schema version",
  inputSchema: validateHedSidecarInputSchema
};

/**
 * Validate a HED sidecar file using the specified HED schema version.
 */
export async function handleValidateHedSidecar(args: ValidateHedSidecarArgs): Promise<HedValidationResult> {
  const { filePath, hedVersion, checkForWarnings = false, fileData } = args;

  try {
    // Use schema cache to get or create the HED schemas
    const hedSchemas = await schemaCache.getOrCreateSchema(hedVersion);

    // Get the file data if not provided
    let data = fileData;
    if (data === undefined || data === null || data === '') {
      try {
        data = await readFileFromPath(filePath);
      } catch (error) {
        return {
          isValid: false,
          errors: [{
            code: "INTERNAL_ERROR",
            detailedCode: "fileReadError",
            severity: "error",
            message: `Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            line: "",
            column: "",
            location: filePath
          } as FormattedIssue],
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
            code: "SIDECAR_INVALID",
            detailedCode: "illegalSidecarData",
            severity: "error",
            message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Invalid JSON format'}`,
            line: "",
            column: "",
            location: filePath
          } as FormattedIssue],
          warnings: []
        };
      }
    } else {
      jsonData = data;
    }
    
    const fileName = path.basename(filePath) || "sidecar.json"; // Properly extract filename using path.basename
    const sidecar = new BidsSidecar(fileName, { path: filePath, name: fileName }, jsonData);
    const validationIssues = sidecar.validate(hedSchemas);
    
    // Format all validation issues
    const allFormattedIssues = formatIssues(validationIssues);
    
    // Separate issues by severity
    const { errors: formattedErrors, others: formattedWarnings } = separateIssuesBySeverity(allFormattedIssues);
    
    const isValid = formattedErrors.length === 0;
    
    // Only include warnings if checkForWarnings is true
    const finalWarnings = checkForWarnings ? formattedWarnings : [];
    
    return {
      isValid: isValid,
      errors: formattedErrors,
      warnings: finalWarnings
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [{
        code: "INTERNAL_ERROR",
        detailedCode: "unExpectedErrorDuringValidation",
        severity: "error",
        message: `Validation failed: ${error && typeof error === "object" && "message" in error ? error.message : error instanceof Error ? error.message : 'Unknown error'}`,
        line: "",
        column: "",
        location: ""
      } as FormattedIssue],
      warnings: []
    };
  }
}
