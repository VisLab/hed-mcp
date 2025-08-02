import { handleParseHedSidecar, ParseHedSidecarArgs, parseHedSidecar } from '../../src/tools/parseHedSidecar';
import { buildSchemasFromVersion } from 'hed-validator';
import * as path from 'path';

describe('parseHedSidecarTool', () => {
  describe('Tool Definition', () => {
    test('should have correct tool name', () => {
      expect(parseHedSidecar.name).toBe('parseHedSidecar');
    });

    test('should have a description', () => {
      expect(parseHedSidecar.description).toBeDefined();
      if (parseHedSidecar.description) {
        expect(parseHedSidecar.description.length).toBeGreaterThan(0);
      }
    });

    test('should have input schema with required filePath', () => {
      expect(parseHedSidecar.inputSchema).toBeDefined();
      expect(parseHedSidecar.inputSchema.properties).toBeDefined();
      if (parseHedSidecar.inputSchema.properties) {
        expect(parseHedSidecar.inputSchema.properties.filePath).toBeDefined();
      }
      expect(parseHedSidecar.inputSchema.required).toContain('filePath');
    });

    test('should have required hedVersion parameter', () => {
      if (parseHedSidecar.inputSchema.properties) {
        expect(parseHedSidecar.inputSchema.properties.hedVersion).toBeDefined();
      }
      expect(parseHedSidecar.inputSchema.required).toContain('hedVersion');
    });

    test('should have optional checkForWarnings parameter', () => {
      if (parseHedSidecar.inputSchema.properties) {
        expect(parseHedSidecar.inputSchema.properties.checkForWarnings).toBeDefined();
      }
      expect(parseHedSidecar.inputSchema.required).not.toContain('checkForWarnings');
    });

    test('should have optional fileData parameter', () => {
      if (parseHedSidecar.inputSchema.properties) {
        expect(parseHedSidecar.inputSchema.properties.fileData).toBeDefined();
      }
      expect(parseHedSidecar.inputSchema.required).not.toContain('fileData');
    });
  });

  describe('Handler Function', () => {
    test('should handle valid inputs with provided fileData', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: '8.4.0',
        checkForWarnings: false,
        fileData: '{"response": {"HED": "Label/#, Red/Blech"}}' // Example valid JSON data
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.parsedHedSidecar).toBeDefined();
      expect(typeof result.parsedHedSidecar).toBe('string');
    });

    test('should handle bad file reading when fileData is not provided', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: '/path/to/non-existent.json',
        hedVersion: '8.4.0',
        checkForWarnings: false
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(['FILE_READ_ERROR', 'INTERNAL_ERROR', 'VALIDATION_ERROR']).toContain(result.errors[0].code);
      expect(result.errors[0].severity).toBe('error');
    });

    test('should handle checkForWarnings parameter with fileData', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: '8.4.0',
        checkForWarnings: true,
        fileData:  '{"response": {"HED": "Label/#, Red/Blech"}}' // Example valid JSON data
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.errors).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should handle invalid JSON string in fileData parameter', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: '8.4.0',
        checkForWarnings: false,
        fileData: 'invalid json content' // Invalid JSON string
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
    });

    test('should handle JSON parsing errors', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: '8.4.0',
        checkForWarnings: false,
        fileData: 'invalid json content'
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('INTERNAL_ERROR');
    });

    test('should handle schema loading errors gracefully', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: '/path/to/test.json',
        hedVersion: 'invalid-version',
        checkForWarnings: false
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('SCHEMA_LOAD_FAILED');
      expect(result.errors[0].severity).toBe('error');
    });

    test('should build schemas from version successfully', async () => {
      // Test that buildSchemasFromVersion works with valid version
      const hedSchemas = await buildSchemasFromVersion('8.4.0');
      expect(hedSchemas).toBeDefined();
    });
  });

  describe('Test Data Files', () => {
    test('should validate participants_bad.json and detect errors and warnings', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: path.join(__dirname, '..', 'data', 'participants_bad.json'),
        hedVersion: '8.4.0',
        checkForWarnings: true
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors[0]).toHaveProperty('code');
      expect(result.errors[0]).toHaveProperty('message');
      expect(result.errors[0]).toHaveProperty('severity', 'error');
      expect(result.warnings).toBeDefined();
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings[0]).toHaveProperty('code');
      expect(result.warnings[0]).toHaveProperty('message');
      expect(result.warnings[0]).toHaveProperty('severity', 'warning');
    });

    test('should validate task-FacePerception_events.json with no errors or warnings', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: path.join(__dirname, '..', 'data', 'task-FacePerception_events.json'),
        hedVersion: '8.4.0',
        checkForWarnings: true
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      
      // Should have no errors
      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual([]);
      
      // Should have no warnings
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toEqual([]);
    });

    test('should handle participants_bad.json without checking for warnings', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: path.join(__dirname, '..', 'data', 'participants_bad.json'),
        hedVersion: '8.4.0',
        checkForWarnings: false
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      
      // Should still have errors
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      
      // Warnings should be empty when checkForWarnings is false
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toEqual([]);
    });

    test('should validate task-FacePerception_events.json without checking for warnings', async () => {
      const args: ParseHedSidecarArgs = {
        filePath: path.join(__dirname, '..', 'data', 'task-FacePerception_events.json'),
        hedVersion: '8.4.0',
        checkForWarnings: false
      };

      const result = await handleParseHedSidecar(args);
      
      expect(result).toBeDefined();
      
      // Should have no errors
      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual([]);
      
      // Should have no warnings when checkForWarnings is false
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toEqual([]);
    });
  });
});
