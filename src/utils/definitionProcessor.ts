/**
 * Utilities for processing incoming definitions and managing them with DefinitionManager
 */

import { Definition, DefinitionManager } from 'hed-validator';
import { FormattedIssue } from '../types/index.js';

/**
 * Simple function to convert raw issues to FormattedIssue format
 * This is a placeholder implementation that handles basic issue conversion
 */
function convertIssues(issues: any[]): FormattedIssue[] {
  return issues.map(issue => ({
    code: issue.internalCode || 'UNKNOWN_ERROR',
    detailedCode: issue.hedCode || 'UNKNOWN_DETAILED',
    severity: issue.level || 'error',
    message: issue.message || 'Unknown error',
    column: '0',
    line: '0',
    location: 'definition'
  }));
}

export interface DefinitionProcessingResult {
  /**
   * Whether the processing was successful (no errors)
   */
  success: boolean;
  
  /**
   * The DefinitionManager with all successfully processed definitions
   */
  definitionManager: DefinitionManager;
  
  /**
   * All issues (errors and warnings) encountered during processing
   */
  issues: FormattedIssue[];
  
  /**
   * Number of definitions successfully processed
   */
  processedCount: number;
  
  /**
   * Number of definitions that failed to process
   */
  failedCount: number;
}

/**
 * Process a list of definition strings and create a DefinitionManager with them.
 * 
 * This function:
 * 1. Creates Definition objects from each definition string
 * 2. Collects all issues (errors and warnings) 
 * 3. If there are errors, stops processing and returns the issues
 * 4. If no errors, adds all definitions to a DefinitionManager
 * 5. Returns the manager and all issues in a single result
 * 
 * @param definitionStrings - Array of definition strings to process
 * @param hedSchemas - The HED schemas to use for definition creation and validation
 * @returns Promise<DefinitionProcessingResult> - Complete processing result
 */
export async function processDefinitions(
  definitionStrings: string[], 
  hedSchemas: any
): Promise<DefinitionProcessingResult> {
  const definitionManager = new DefinitionManager();
  const allIssues: any[] = [];
  const createdDefinitions: Definition[] = [];
  let processedCount = 0;
  let failedCount = 0;

  console.log(`Processing ${definitionStrings.length} definition strings`);

  // Step 1: Create Definition objects from strings and collect all issues
  for (const defString of definitionStrings) {
    try {
      const [definition, errors, warnings] = Definition.createDefinition(defString, hedSchemas);
      
      // Collect all issues (both errors and warnings)
      allIssues.push(...errors, ...warnings);
      
      if (definition) {
        createdDefinitions.push(definition);
        processedCount++;
        console.log(`Successfully created definition: ${definition.name}`);
      } else {
        failedCount++;
        console.log(`Failed to create definition from: ${defString}`);
      }
    } catch (error) {
      failedCount++;
      console.error(`Exception while creating definition from "${defString}":`, error);
      // Add a generic error for exceptions
      allIssues.push({
        internalCode: 'definitionProcessingException',
        hedCode: 'DEFINITION_ERROR',
        level: 'error',
        message: `Exception while processing definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
        parameters: { definition: defString }
      });
    }
  }

  // Step 2: Check if there are any errors
  const hasErrors = allIssues.some(issue => issue.level === 'error');
  
  if (hasErrors) {
    console.log(`Definition processing stopped due to ${allIssues.filter(i => i.level === 'error').length} errors`);
    return {
      success: false,
      definitionManager,
      issues: convertIssues(allIssues),
      processedCount,
      failedCount
    };
  }

  // Step 3: If no errors, add all definitions to the DefinitionManager
  console.log(`Adding ${createdDefinitions.length} definitions to DefinitionManager`);
  
  try {
    const additionIssues = definitionManager.addDefinitions(createdDefinitions);
    allIssues.push(...additionIssues);
    
    // Check if adding definitions created any errors
    const additionHasErrors = additionIssues.some(issue => issue.level === 'error');
    
    if (additionHasErrors) {
      console.log(`Definition addition failed due to ${additionIssues.filter(i => i.level === 'error').length} errors`);
      return {
        success: false,
        definitionManager,
        issues: convertIssues(allIssues),
        processedCount,
        failedCount
      };
    }
    
    console.log(`Successfully added all definitions to DefinitionManager`);
    
  } catch (error) {
    console.error('Exception while adding definitions to manager:', error);
    allIssues.push({
      internalCode: 'definitionManagerException',
      hedCode: 'DEFINITION_MANAGER_ERROR',
      level: 'error',
      message: `Exception while adding definitions to manager: ${error instanceof Error ? error.message : 'Unknown error'}`,
      parameters: {}
    });
    
    return {
      success: false,
      definitionManager,
      issues: convertIssues(allIssues),
      processedCount,
      failedCount
    };
  }

  // Step 4: Return successful result with all issues (including warnings)
  return {
    success: true,
    definitionManager,
    issues: convertIssues(allIssues),
    processedCount,
    failedCount
  };
}

/**
 * Create a new DefinitionManager and process definitions into it.
 * This is a convenience function that creates a fresh DefinitionManager.
 * 
 * @param definitionStrings - Array of definition strings to process
 * @param hedSchemas - The HED schemas to use for definition creation and validation
 * @returns Promise<DefinitionProcessingResult> - Complete processing result with new manager
 */
export async function createDefinitionManager(
  definitionStrings: string[], 
  hedSchemas: any
): Promise<DefinitionProcessingResult> {
  return processDefinitions(definitionStrings, hedSchemas);
}

/**
 * Add definitions to an existing DefinitionManager.
 * This function processes new definitions and adds them to an existing manager.
 * 
 * @param existingManager - The existing DefinitionManager to add definitions to
 * @param definitionStrings - Array of definition strings to process
 * @param hedSchemas - The HED schemas to use for definition creation and validation
 * @returns Promise<DefinitionProcessingResult> - Complete processing result with updated manager
 */
export async function addDefinitionsToManager(
  existingManager: DefinitionManager,
  definitionStrings: string[], 
  hedSchemas: any
): Promise<DefinitionProcessingResult> {
  const allIssues: any[] = [];
  const createdDefinitions: Definition[] = [];
  let processedCount = 0;
  let failedCount = 0;

  console.log(`Processing ${definitionStrings.length} additional definition strings`);

  // Step 1: Create Definition objects from strings and collect all issues
  for (const defString of definitionStrings) {
    try {
      const [definition, errors, warnings] = Definition.createDefinition(defString, hedSchemas);
      
      // Collect all issues (both errors and warnings)
      allIssues.push(...errors, ...warnings);
      
      if (definition) {
        createdDefinitions.push(definition);
        processedCount++;
        console.log(`Successfully created definition: ${definition.name}`);
      } else {
        failedCount++;
        console.log(`Failed to create definition from: ${defString}`);
      }
    } catch (error) {
      failedCount++;
      console.error(`Exception while creating definition from "${defString}":`, error);
      // Add a generic error for exceptions
      allIssues.push({
        internalCode: 'definitionProcessingException',
        hedCode: 'DEFINITION_ERROR',
        level: 'error',
        message: `Exception while processing definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
        parameters: { definition: defString }
      });
    }
  }

  // Step 2: Check if there are any errors
  const hasErrors = allIssues.some(issue => issue.level === 'error');
  
  if (hasErrors) {
    console.log(`Definition processing stopped due to ${allIssues.filter(i => i.level === 'error').length} errors`);
    return {
      success: false,
      definitionManager: existingManager,
      issues: convertIssues(allIssues),
      processedCount,
      failedCount
    };
  }

  // Step 3: If no errors, add all definitions to the existing DefinitionManager
  console.log(`Adding ${createdDefinitions.length} definitions to existing DefinitionManager`);
  
  try {
    const additionIssues = existingManager.addDefinitions(createdDefinitions);
    allIssues.push(...additionIssues);
    
    // Check if adding definitions created any errors
    const additionHasErrors = additionIssues.some(issue => issue.level === 'error');
    
    if (additionHasErrors) {
      console.log(`Definition addition failed due to ${additionIssues.filter(i => i.level === 'error').length} errors`);
      return {
        success: false,
        definitionManager: existingManager,
        issues: convertIssues(allIssues),
        processedCount,
        failedCount
      };
    }
    
    console.log(`Successfully added all definitions to existing DefinitionManager`);
    
  } catch (error) {
    console.error('Exception while adding definitions to existing manager:', error);
    allIssues.push({
      internalCode: 'definitionManagerException',
      hedCode: 'DEFINITION_MANAGER_ERROR',
      level: 'error',
      message: `Exception while adding definitions to manager: ${error instanceof Error ? error.message : 'Unknown error'}`,
      parameters: {}
    });
    
    return {
      success: false,
      definitionManager: existingManager,
      issues: convertIssues(allIssues),
      processedCount,
      failedCount
    };
  }

  // Step 4: Return successful result with all issues (including warnings)
  return {
    success: true,
    definitionManager: existingManager,
    issues: convertIssues(allIssues),
    processedCount,
    failedCount
  };
}

/**
 * Utility function to check if a DefinitionProcessingResult has errors.
 * 
 * @param result - The processing result to check
 * @returns boolean - True if there are errors, false otherwise
 */
export function hasErrors(result: DefinitionProcessingResult): boolean {
  return !result.success || result.issues.some(issue => issue.severity === 'error');
}

/**
 * Utility function to get only the error issues from a DefinitionProcessingResult.
 * 
 * @param result - The processing result to filter
 * @returns FormattedIssue[] - Array of only error issues
 */
export function getErrors(result: DefinitionProcessingResult): FormattedIssue[] {
  return result.issues.filter(issue => issue.severity === 'error');
}

/**
 * Utility function to get only the warning issues from a DefinitionProcessingResult.
 * 
 * @param result - The processing result to filter
 * @returns FormattedIssue[] - Array of only warning issues
 */
export function getWarnings(result: DefinitionProcessingResult): FormattedIssue[] {
  return result.issues.filter(issue => issue.severity === 'warning');
}
