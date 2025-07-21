import { validateStringTool } from '../src/tools/validateStringTool';
import { hedSchemaResource } from '../src/resources/hedSchema';
import { ValidationResult } from '../src/types/index';

describe('Project Integration', () => {
  describe('Module Imports', () => {
    test('should successfully import all main modules', () => {
      expect(validateStringTool).toBeDefined();
      expect(hedSchemaResource).toBeDefined();
    });

    test('should have tool with expected structure', () => {
      expect(validateStringTool).toHaveProperty('name');
      expect(validateStringTool).toHaveProperty('description');
      expect(validateStringTool).toHaveProperty('inputSchema');
    });

    test('should have resource with expected structure', () => {
      expect(hedSchemaResource).toHaveProperty('uri');
      expect(hedSchemaResource).toHaveProperty('name');
      expect(hedSchemaResource).toHaveProperty('description');
      expect(hedSchemaResource).toHaveProperty('mimeType');
    });
  });

  describe('Type System', () => {
    test('should create valid ValidationResult objects', () => {
      const successResult: ValidationResult = {
        isValid: true
      };

      const errorResult: ValidationResult = {
        isValid: false,
        errors: ['Test error'],
        warnings: ['Test warning']
      };

      expect(successResult.isValid).toBe(true);
      expect(errorResult.isValid).toBe(false);
      expect(errorResult.errors).toContain('Test error');
      expect(errorResult.warnings).toContain('Test warning');
    });
  });

  describe('Project Structure Consistency', () => {
    test('should have consistent naming conventions', () => {
      // Tool names should be camelCase
      expect(validateStringTool.name).toMatch(/^[a-z][a-zA-Z]*$/);
      
      // Resource URIs should follow expected pattern
      expect(hedSchemaResource.uri).toMatch(/^[a-z]+:\/\//);
    });

    test('should have proper schema definitions', () => {
      // Tool should have proper input schema
      expect(validateStringTool.inputSchema).toHaveProperty('type');
      expect(validateStringTool.inputSchema).toHaveProperty('properties');
      
      // Resource should have proper MIME type
      expect(hedSchemaResource.mimeType).toMatch(/^[a-z]+\/[a-z]+$/);
    });
  });

  describe('Configuration Validation', () => {
    test('should have tools that can be serialized', () => {
      const serialized = JSON.stringify(validateStringTool);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized.name).toBe(validateStringTool.name);
      expect(deserialized.description).toBe(validateStringTool.description);
    });

    test('should have resources that can be serialized', () => {
      const serialized = JSON.stringify(hedSchemaResource);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized.uri).toBe(hedSchemaResource.uri);
      expect(deserialized.name).toBe(hedSchemaResource.name);
    });
  });
});
