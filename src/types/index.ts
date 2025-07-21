/**
 * Shared TypeScript types and interfaces for the HED MCP server
 */

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface StringValidationOptions {
  strict?: boolean;
  allowWarnings?: boolean;
}

export interface HEDValidationContext {
  schemaVersion?: string;
  validationRules?: string[];
}
