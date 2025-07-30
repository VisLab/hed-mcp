import { 
  processDefinitions, 
  createDefinitionManager, 
  addDefinitionsToManager,
  hasErrors,
  getErrors,
  getWarnings,
  DefinitionProcessingResult 
} from '../../src/utils/definitionProcessor';
import { DefinitionManager, buildSchemasFromVersion } from 'hed-validator';

describe('Definition Processor', () => {
  let hedSchemas: any;

  beforeAll(async () => {
    // Get real HED schemas for testing
    hedSchemas = await buildSchemasFromVersion('8.4.0');
  });

  describe('processDefinitions', () => {
    test('should successfully process valid definitions', async () => {
      const definitionStrings = [
        '(Definition/MyDef, (Red))',
        '(Definition/AnotherDef, (Blue))'
      ];

      const result = await processDefinitions(definitionStrings, hedSchemas);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.definitionManager).toBeInstanceOf(DefinitionManager);
      
      // Check that definitions were actually added to the manager
      expect(result.definitionManager.definitions.has('mydef')).toBe(true);
      expect(result.definitionManager.definitions.has('anotherdef')).toBe(true);
    });

    test('should handle invalid definition strings', async () => {
      const definitionStrings = [
        '(Definition/BadDef, Red)', // Invalid: missing parentheses around Red
        '(Definition/GoodDef, (Blue))' // Valid
      ];

      const result = await processDefinitions(definitionStrings, hedSchemas);

      expect(result.success).toBe(false); // Should fail due to bad definition
      expect(result.processedCount).toBe(1); // Only good definition processed
      expect(result.failedCount).toBe(1); // One failed
      expect(result.issues.length).toBeGreaterThan(0); // Should have error issues
      
      // The definition manager should not have been populated due to errors
      expect(result.definitionManager.definitions.size).toBe(0);
    });

    test('should handle empty definition strings array', async () => {
      const result = await processDefinitions([], hedSchemas);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.issues).toHaveLength(0);
      expect(result.definitionManager.definitions.size).toBe(0);
    });

    test('should handle malformed definition strings', async () => {
      const definitionStrings = [
        'Not a definition at all',
        '(Definition/ValidDef, (Green))'
      ];

      const result = await processDefinitions(definitionStrings, hedSchemas);

      expect(result.success).toBe(false); // Should fail due to malformed definition
      expect(result.processedCount).toBe(1); // Only valid definition processed
      expect(result.failedCount).toBe(1); // One failed
      expect(result.issues.length).toBeGreaterThan(0); // Should have error issues
    });

    // TODO: Add test for definitions with placeholders
    test.todo('should handle definitions with placeholders');
    
    // TODO: Add test for conflicting definitions
    test.todo('should handle conflicting definitions');
  });

  describe('createDefinitionManager', () => {
    test('should create a new manager and process definitions', async () => {
      const definitionStrings = ['(Definition/TestDef, (Yellow))'];

      const result = await createDefinitionManager(definitionStrings, hedSchemas);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.definitionManager).toBeInstanceOf(DefinitionManager);
      expect(result.definitionManager.definitions.has('testdef')).toBe(true);
    });
  });

  describe('addDefinitionsToManager', () => {
    test('should add definitions to existing manager', async () => {
      // First create a manager with one definition
      const existingManager = new DefinitionManager();
      const initialDefinitions = ['(Definition/FirstDef, (Purple))'];
      
      const initialResult = await processDefinitions(initialDefinitions, hedSchemas);
      expect(initialResult.success).toBe(true);
      
      // Copy the definitions to our existing manager
      const additionIssues = existingManager.addDefinitions(Array.from(initialResult.definitionManager.definitions.values()));
      expect(additionIssues).toHaveLength(0);

      // Now add more definitions to the existing manager
      const newDefinitionStrings = ['(Definition/SecondDef, (Orange))'];
      
      const result = await addDefinitionsToManager(existingManager, newDefinitionStrings, hedSchemas);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.definitionManager).toBe(existingManager);
      
      // Check that both definitions are in the manager
      expect(existingManager.definitions.has('firstdef')).toBe(true);
      expect(existingManager.definitions.has('seconddef')).toBe(true);
      expect(existingManager.definitions.size).toBe(2);
    });

    // TODO: Add test for adding conflicting definitions to existing manager
    test.todo('should handle adding conflicting definitions to existing manager');
  });

  describe('utility functions', () => {
    test('hasErrors should correctly identify results with errors', async () => {
      // Create a successful result
      const successResult = await processDefinitions(['(Definition/TestDef, (Red))'], hedSchemas);
      expect(hasErrors(successResult)).toBe(false);

      // Create a result with errors
      const errorResult = await processDefinitions(['(Definition/BadDef, Red)'], hedSchemas);
      expect(hasErrors(errorResult)).toBe(true);
    });

    test('getErrors and getWarnings should filter issues correctly', async () => {
      // This test will be implemented when we have examples that generate warnings
      // TODO: Find or create definition examples that generate warnings vs errors
      const result = await processDefinitions(['(Definition/BadDef, Red)'], hedSchemas);
      
      const errors = getErrors(result);
      const warnings = getWarnings(result);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every(issue => issue.severity === 'error')).toBe(true);
      expect(warnings.every(issue => issue.severity === 'warning')).toBe(true);
    });
  });

  // TODO: Add more integration scenarios when we have more definition examples
  describe('integration scenarios', () => {
    test.todo('should handle mixed valid and invalid definitions in a single batch');
    test.todo('should handle definitions with placeholders and their usage');
    test.todo('should handle library-specific definitions');
  });
});
