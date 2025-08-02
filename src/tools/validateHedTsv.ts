import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as path from "path";
import { FormattedIssue, HedValidationResult } from "../types/index.js";
import { formatIssues, separateIssuesBySeverity } from "../utils/issueFormatter.js";
import { readFileFromPath } from "../utils/fileReader.js";
import { schemaCache } from '../utils/schemaCache.js';
import { mcpToZod } from '../utils/mcpToZod.js';

// Import HED validation functions
import { buildSchemasFromVersion } from "hed-validator";

// Define the MCP inputSchema first
const validateHedTsvInputSchema = {
  type: "object" as const,
  properties: {
    filePath: {
      type: "string" as const,
      description: "The absolute path to the TSV file to validate"
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
      description: "Optional file data to use instead of reading from filePath",
    },
    jsonData: {
      type: "string" as const,
      description: "Optional JSON data string"
    },
    definitions: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "Array of definition strings to use during validation"
    }
  },
  required: ["filePath", "hedVersion"]
};

// Generate Zod schema from MCP schema
const ValidateHedTsvSchema = mcpToZod(validateHedTsvInputSchema);

export type ValidateHedTsvArgs = z.infer<typeof ValidateHedTsvSchema>;

/**
 * Tool definition for validating HED TSV files
 */
export const validateHedTsv: Tool = {
  name: "validateHedTsv",
  description: "Validates a HED TSV file using the specified HED schema version",
  inputSchema: validateHedTsvInputSchema
};

/**
 * Validate a HED TSV file using the specified HED schema version.
 * TODO: Implementation details to be filled in.
 */
export async function handleValidateHedTsv(args: ValidateHedTsvArgs): Promise<HedValidationResult> {
  const { filePath, hedVersion, checkForWarnings = false, fileData, jsonData, definitions } = args;

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

    // TODO: Implement TSV validation logic here
    // This is a placeholder implementation
    console.log('TODO: Implement TSV validation logic');
    console.log('Parameters received:', { filePath, hedVersion, checkForWarnings, jsonData, definitions });
    console.log('File data type:', typeof data);
    
    // Placeholder return - replace with actual validation logic
    return {
      isValid: true,
      errors: [],
      warnings: []
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
