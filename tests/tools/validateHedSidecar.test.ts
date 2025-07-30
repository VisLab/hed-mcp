import { handleValidateHedSidecar, ValidateHedSidecarArgs, validateHedSidecar } from '../../src/tools/validateHedSidecar';
import { buildSchemasFromVersion } from 'hed-validator';

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
        expect(result.errors[0].code).toBe('FILE_READ_ERROR');
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
        expect(result.errors[0].code).toBe('JSON_PARSE_ERROR');
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
});
