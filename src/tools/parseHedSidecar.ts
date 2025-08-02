import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as path from "path";
import { FormattedIssue, ParseHedSidecarResult } from "../types/index.js";
import { formatIssue, formatIssues, separateIssuesBySeverity } from "../utils/issueFormatter.js";
import { readFileFromPath } from "../utils/fileReader.js";
import { schemaCache } from '../utils/schemaCache.js';
import { mcpToZod } from '../utils/mcpToZod.js';

// Import HED validation functions
import { buildSchemasFromVersion, BidsSidecar } from "hed-validator";

// Define the MCP inputSchema first
const parseHedSidecarInputSchema = {
  type: "object" as const,
  properties: {
    filePath: {
      type: "string" as const,
      description: "The absolute path to the sidecar file to parse"
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
      type: "string" as const,
      description: "Optional JSON string containing the sidecar data to use instead of reading from filePath"
    }
  },
  required: ["filePath", "hedVersion"]
};

// Generate Zod schema from MCP schema
const ParseHedSidecarSchema = mcpToZod(parseHedSidecarInputSchema);

export type ParseHedSidecarArgs = z.infer<typeof ParseHedSidecarSchema>;

/**
 * Tool definition for parsing HED sidecar files
 */
export const parseHedSidecar: Tool = {
  name: "parseHedSidecar",
  description: "Parses a HED sidecar file using the specified HED schema version",
  inputSchema: parseHedSidecarInputSchema
};

/**
 * Parse a HED sidecar file using the specified HED schema version.
 */
export async function handleParseHedSidecar(args: ParseHedSidecarArgs): Promise<ParseHedSidecarResult> {
  const { filePath, hedVersion, checkForWarnings = false, fileData } = args;

  try {
    // Use schema cache to get or create the HED schemas
    const hedSchemas = await schemaCache.getOrCreateSchema(hedVersion);

    // Get the file data if not provided
    let data = fileData;
    if (!data) {
        data = await readFileFromPath(filePath);
    }

    // Parse JSON data (fileData is always a string now)
    const jsonData = JSON.parse(data);
   
    const fileName = path.basename(filePath) || "sidecar.json"; // Properly extract filename using path.basename
    const sidecar = new BidsSidecar(fileName, { path: filePath, name: fileName }, jsonData);
    const validationIssues = sidecar.validate(hedSchemas);
    
    // Format all validation issues
    const allFormattedIssues = formatIssues(validationIssues);
    
    // Separate issues by severity
    const { errors: formattedErrors, others: formattedWarnings } = separateIssuesBySeverity(allFormattedIssues);
    
    // Only include warnings if checkForWarnings is true
    const finalWarnings = checkForWarnings ? formattedWarnings : [];

    return {
      parsedHedSidecar: JSON.stringify(jsonData),
      errors: formattedErrors,
      warnings: finalWarnings
    };

  } catch (error) {
    return {parsedHedSidecar: "", errors: [formatIssue(error)], warnings: []};
  }
}
