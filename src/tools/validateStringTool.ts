import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ValidationResult, StringValidationOptions } from "../types/index.js";

// Define the schema for the tool's input arguments
const ValidateStringToolSchema = z.object({
  inputString: z.string().describe("The string to validate"),
  options: z.object({
    strict: z.boolean().optional().describe("Enable strict validation mode"),
    allowWarnings: z.boolean().optional().describe("Whether to allow warnings in validation"),
  }).optional().describe("Validation options")
});

export type ValidateStringToolArgs = z.infer<typeof ValidateStringToolSchema>;

/**
 * Tool definition for validating strings
 */
export const validateStringTool: Tool = {
  name: "validateStringTool",
  description: "Validates a string according to HED (Hierarchical Event Descriptor) standards",
  inputSchema: {
    type: "object",
    properties: {
      inputString: {
        type: "string",
        description: "The string to validate"
      },
      options: {
        type: "object",
        properties: {
          strict: {
            type: "boolean",
            description: "Enable strict validation mode"
          },
          allowWarnings: {
            type: "boolean", 
            description: "Whether to allow warnings in validation"
          }
        },
        description: "Validation options"
      }
    },
    required: ["inputString"]
  }
};

/**
 * Implementation of the validateStringTool
 */
export async function handleValidateStringTool(args: ValidateStringToolArgs): Promise<ValidationResult> {
  const { inputString, options = {} } = args;
  const { strict = false, allowWarnings = true } = options;

  try {
    // TODO: Implement actual HED validation logic here
    // For now, this is a placeholder implementation
    
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation checks (placeholder)
    if (!inputString.trim()) {
      errors.push("Input string cannot be empty");
    }

    if (inputString.length > 1000) {
      warnings.push("Input string is very long (>1000 characters)");
    }

    // Check for common HED formatting issues (placeholder)
    if (!inputString.includes("/")) {
      warnings.push("String may not follow HED tag structure (no '/' found)");
    }

    const hasErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0;

    const isValid = !hasErrors && (allowWarnings || !hasWarnings);

    return {
      isValid,
      errors: hasErrors ? errors : undefined,
      warnings: hasWarnings ? warnings : undefined
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}
