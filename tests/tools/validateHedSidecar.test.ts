import { handleValidateHedSidecar, ValidateHedSidecarArgs, validateHedSidecar } from '../../src/tools/validateHedSidecar';
import { buildSchemasFromVersion } from 'hed-validator';
import * as path from 'path';

describe('validateHedSidecarTool', () => {
  describe('Tool Definition', () => {
    test('should have correct tool name', () => {
      expect(validateHedSidecar.name).toBe('validateHedSidecar');
    });

    test('should have a description', () => {
      expect(validateHedSidecar.description).toBeDefined();
      if (validateHedSidecar.description) {
        expect(validateHedSidecar.description.length).toBeGreaterThan(0);
      }
    });

    test('should have input schema with required filePath', () => {
      expect(validateHedSidecar.inputSchema).toBeDefined();
      expect(validateHedSidecar.inputSchema.properties).toBeDefined();
      if (validateHedSidecar.inputSchema.properties) {
        expect(validateHedSidecar.inputSchema.properties.filePath).toBeDefined();
      }
      expect(validateHedSidecar.inputSchema.required).toContain('filePath');
    });

    test('should have required hedVersion parameter', () => {
      if (validateHedSidecar.inputSchema.properties) {
        expect(validateHedSidecar.inputSchema.properties.hedVersion).toBeDefined();
      }
      expect(validateHedSidecar.inputSchema.required).toContain('hedVersion');
    });

    test('should have optional checkForWarnings parameter', () => {
      if (validateHedSidecar.inputSchema.properties) {
        expect(validateHedSidecar.inputSchema.properties.checkForWarnings).toBeDefined();
      }
      expect(validateHedSidecar.inputSchema.required).not.toContain('checkForWarnings');
    });

    test('should have optional fileData parameter', () => {
      if (validateHedSidecar.inputSchema.properties) {
        expect(validateHedSidecar.inputSchema.properties.fileData).toBeDefined();
      }
      expect(validateHedSidecar.inputSchema.required).not.toContain('fileData');
    });
  });

  describe('Handler Function', () => {
    test('should handle valid inputs with provided fileData', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: '8.4.0',
        checkForWarnings: false,
        fileData: '{"test": "data"}'
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('should handle file reading when fileData is not provided', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: '/path/to/non-existent.json',
        hedVersion: '8.4.0',
        checkForWarnings: false
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      if (result.errors && result.errors.length > 0) {
        // Accept the actual error codes that the system produces
        expect(['FILE_READ_ERROR', 'INTERNAL_ERROR', 'VALIDATION_ERROR']).toContain(result.errors[0].code);
        expect(result.errors[0].severity).toBe('error');
      }
    });

    test('should handle checkForWarnings parameter', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: '8.4.0',
        checkForWarnings: true,
        fileData: '{"test": "data"}'
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('should handle optional fileData parameter', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: '8.4.0',
        checkForWarnings: false,
        fileData: { "test": "data" }
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('should handle JSON parsing errors', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: '8.4.0',
        checkForWarnings: false,
        fileData: 'invalid json content'
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      if (result.errors && result.errors.length > 0) {
        // The BidsSidecar handles invalid JSON and gives sidecar validation errors
        expect(['JSON_PARSE_ERROR', 'SIDECAR_INVALID']).toContain(result.errors[0].code);
        expect(result.errors[0].severity).toBe('error');
      }
    });

    test('should handle schema loading errors gracefully', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: 'invalid-version',
        checkForWarnings: false
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      if (result.errors && result.errors.length > 0) {
        expect(result.errors[0].code).toBe('VALIDATION_ERROR');
        expect(result.errors[0].severity).toBe('error');
      }
    });

    test('should build schemas from version successfully', async () => {
      // Test that buildSchemasFromVersion works with valid version
      const hedSchemas = await buildSchemasFromVersion('8.4.0');
      expect(hedSchemas).toBeDefined();
    });
  });

  describe('Test Data Files', () => {
    test('should validate participants_bad.json and detect errors and warnings', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: path.join(__dirname, '..', 'data', 'participants_bad.json'),
        hedVersion: '8.4.0',
        checkForWarnings: true
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      
      // Should have at least one error
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThanOrEqual(1);
      
      // Should have at least one warning
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThanOrEqual(1);
      
      // Check that errors and warnings have proper structure
      if (result.errors && result.errors.length > 0) {
        expect(result.errors[0]).toHaveProperty('code');
        expect(result.errors[0]).toHaveProperty('message');
        expect(result.errors[0]).toHaveProperty('severity', 'error');
      }
      
      if (result.warnings && result.warnings.length > 0) {
        expect(result.warnings[0]).toHaveProperty('code');
        expect(result.warnings[0]).toHaveProperty('message');
        expect(result.warnings[0]).toHaveProperty('severity', 'warning');
      }
    });

    test('should validate task-FacePerception_events.json with no errors or warnings', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: path.join(__dirname, '..', 'data', 'task-FacePerception_events.json'),
        hedVersion: '8.4.0',
        checkForWarnings: true
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      
      // Should have no errors
      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual([]);
      
      // Should have no warnings
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toEqual([]);
    });

    test('should handle participants_bad.json without checking for warnings', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: path.join(__dirname, '..', 'data', 'participants_bad.json'),
        hedVersion: '8.4.0',
        checkForWarnings: false
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      
      // Should still have errors
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThanOrEqual(1);
      
      // Warnings should be empty when checkForWarnings is false
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toEqual([]);
    });

    test('should validate task-FacePerception_events.json without checking for warnings', async () => {
      const args: ValidateHedSidecarArgs = {
        filePath: path.join(__dirname, '..', 'data', 'task-FacePerception_events.json'),
        hedVersion: '8.4.0',
        checkForWarnings: false
      };

      const result = await handleValidateHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      
      // Should have no errors
      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual([]);
      
      // Should have no warnings when checkForWarnings is false
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toEqual([]);
    });
  });
});
