/**
 * Utilities for processing incoming definitions and managing them with DefinitionManager
 */

import { Definition, DefinitionManager, Issue, Schemas } from 'hed-validator';
import { FormattedIssue, formatIssues } from './issueFormatter.js';

export interface ConvertDefinitionsResult {
  /**
   * Successfully created Definition objects
   */
  definitions: Definition[];
  
  /**
   * Error issues encountered during processing
   */
  errors: Issue[];
  
  /**
   * Warning issues encountered during processing
   */
  warnings: Issue[];
}

export interface CreateDefinitionManagerResult {
  /**
   * The DefinitionManager with all successfully processed definitions, or null if no definitions
   */
  definitionManager: DefinitionManager | null;
  
  /**
   * Error issues encountered during processing
   */
  errors: FormattedIssue[];
  
  /**
   * Warning issues encountered during processing
   */
  warnings: FormattedIssue[];
}

/**
 * Convert a list of definition strings to Definition objects.
 * 
 * @param definitionStrings - Array of definition strings to convert
 * @param hedSchemas - The HED schemas to use for definition creation
 * @returns ConvertDefinitionsResult - Definitions and issues
 */
export function convertDefinitions(
  definitionStrings: string[], 
  hedSchemas: Schemas
): ConvertDefinitionsResult {
  const definitions: Definition[] = [];
  const allErrors: Issue[] = [];
  const allWarnings: Issue[] = [];

  // Create Definition objects from strings and collect all issues
  for (const defString of definitionStrings) {
    const [definition, errors, warnings] = Definition.createDefinition(defString, hedSchemas);
    
    // Collect errors and warnings separately
    allErrors.push(...errors);
    allWarnings.push(...warnings);
    
    if (definition) {
      definitions.push(definition);
    }
  }

  return {
    definitions,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Create a new DefinitionManager from definition strings. If any errors, no definitions are added.
 * 
 * @param definitionStrings - Array of definition strings to process
 * @param hedSchemas - The HED schemas to use for definition creation and validation
 * @returns CreateDefinitionManagerResult - DefinitionManager (or null) and formatted issues
 */
export function createDefinitionManager(
  definitionStrings: string[], 
  hedSchemas: Schemas
): CreateDefinitionManagerResult {
  // Return null DefinitionManager if definitions is empty, null, or undefined
  if (!definitionStrings || definitionStrings.length === 0) {
    return {
      definitionManager: null,
      errors: [],
      warnings: []
    };
  }

  const definitionManager = new DefinitionManager();
  
  // First convert the definitions
  const convertResult = convertDefinitions(definitionStrings, hedSchemas);
  
  // If we have definitions and no errors, add them to the manager
  if (convertResult.definitions.length > 0 && convertResult.errors.length === 0) {
    const additionIssues = definitionManager.addDefinitions(convertResult.definitions);
    
    // Separate addition issues into errors and warnings
    const additionErrors = additionIssues.filter((issue: Issue) => issue.level === 'error');
    const additionWarnings = additionIssues.filter((issue: Issue) => issue.level === 'warning');
    
    convertResult.errors.push(...additionErrors);
    convertResult.warnings.push(...additionWarnings);
  }
  
  return {
    definitionManager,
    errors: formatIssues(convertResult.errors),
    warnings: formatIssues(convertResult.warnings)
  };
}
