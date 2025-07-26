/**
 * Shared TypeScript types and interfaces for the HED MCP server
 */

/**
 * Standardized issue format for all tools and resources
 */
export interface FormattedIssue {
  code: string;
  detailedCode: string;
  severity: string;
  message: string;
  column: string;
  line: string;
  location: string;
}

export interface HedValidationResult {
  isValid: boolean;
  errors?: FormattedIssue[];
  warnings?: FormattedIssue[];
  issues?: Array<object | string>;
}
