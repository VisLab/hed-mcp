import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { FormattedIssue, HedValidationResult } from "../types/index.js";
import { formatIssues } from "../utils/issueFormatter.js";

// Import HED validation functions
import { parseStandaloneString, buildSchemasFromVersion } from "hed-validator";

// Define the schema for the tool's input arguments
const ValidateHedStringSchema = z.object({
  hedString: z.string().describe("The HED string to validate"),
  hedVersion: z.string().describe("The HED schema version to use (e.g., '8.4.0' or 'lang_1.1.0, score_2.1.0')"),
  checkForWarnings: z.boolean().optional().default(false).describe("Whether to check for warnings in addition to errors"),
  definitions: z.array(z.string()).optional().describe("Optional array of definition strings")
});

export type ValidateHedStringArgs = z.infer<typeof ValidateHedStringSchema>;

/**
 * Tool definition for validating HED strings
 */
export const validateHedString: Tool = {
  name: "validateHedString",
  description: "Validates a string of HED tags using the specified HED schema version and definitions",
  inputSchema: {
    type: "object",
    properties: {
      hedString: {
        type: "string",
        description: "The HED string to validate"
      },
      hedVersion: {
        type: "string",
        description: "The HED schema version to use (e.g., '8.4.0' or 'lang_1.1.0, score_2.1.0')"
      },
      checkForWarnings: {
        type: "boolean",
        description: "Whether to check for warnings in addition to errors",
        default: false
      },
      definitions: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of definition strings to use during validation"
      }
    },
    required: ["hedString", "hedVersion"]
  }
};

/**
 * Validate a HED string using the parseStandaloneString function
 * from the hed-javascript package.
 */
export async function handleValidateHedString(args: ValidateHedStringArgs): Promise<HedValidationResult> {
  const { hedString, hedVersion, checkForWarnings = false, definitions = [] } = args;

  try {
    // Use buildSchemasFromVersion with the specified version
    const hedSchemas = await buildSchemasFromVersion(hedVersion);
    console.log(`Successfully loaded HED schemas for version ${hedVersion}`);

    // Process definitions if provided
    let defManager: any = null;
    if (definitions.length > 0) {
      console.log(`Processing ${definitions.length} definitions`);
      // TODO: Create and configure DefinitionManager when needed
      // For now, we'll pass undefined to defManager as you specified
    }

    // Parse and validate the HED string
    const [parsedString, errors, warnings] = parseStandaloneString(hedString, hedSchemas, defManager);

    // Format errors and warnings using the utility function
    const formattedErrors = formatIssues(errors);
    const isValid = formattedErrors.length === 0;
    let formattedWarnings: FormattedIssue[] = [];
    if (checkForWarnings && warnings.length > 0) {
      formattedWarnings = formatIssues(warnings);
    }

    return {
      isValid: isValid,
      errors: formattedErrors,
      warnings: formattedWarnings
    };

  } catch (error) {
    console.error('HED validation error:', error);
    return {
      isValid: false,
      errors: [{
        code: "VALIDATION_ERROR",
        detailedCode: "VALIDATION_ERROR",
        severity: "error",
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        line: "",
        column: "",
        location: ""
      }]
    };
  }
}
