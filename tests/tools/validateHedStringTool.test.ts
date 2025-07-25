import { handleValidateHedString, ValidateHedStringArgs, validateHedString } from '../../src/tools/validateHedStringTool';
import { DefinitionManager } from 'hed-validator';

describe('validateHedStringTool', () => {
  describe('Tool Definition', () => {
    test('should have correct tool name', () => {
      expect(validateHedString.name).toBe('validateHedString');
    });

    test('should have a description', () => {
      expect(validateHedString.description).toBeDefined();
      if (validateHedString.description) {
        expect(validateHedString.description.length).toBeGreaterThan(0);
      }
    });

    test('should have input schema with required hedString', () => {
      expect(validateHedString.inputSchema).toBeDefined();
      expect(validateHedString.inputSchema.properties).toBeDefined();
      if (validateHedString.inputSchema.properties) {
        expect(validateHedString.inputSchema.properties.hedString).toBeDefined();
      }
      expect(validateHedString.inputSchema.required).toContain('hedString');
    });

    test('should have required hedVersion parameter', () => {
      if (validateHedString.inputSchema.properties) {
        expect(validateHedString.inputSchema.properties.hedVersion).toBeDefined();
      }
      expect(validateHedString.inputSchema.required).toContain('hedVersion');
    });

    test('should have optional definitions parameter', () => {
      if (validateHedString.inputSchema.properties) {
        expect(validateHedString.inputSchema.properties.definitions).toBeDefined();
      }
      expect(validateHedString.inputSchema.required).not.toContain('definitions');
    });

    test('should have optional checkForWarnings parameter', () => {
        if (validateHedString.inputSchema.properties) {
            expect(validateHedString.inputSchema.properties.checkForWarnings).toBeDefined();
        }
        expect(validateHedString.inputSchema.required).not.toContain('checkForWarnings');
    });
  });

  describe('handleValidateHedString', () => {
    test('should return invalid for an empty HED string', async () => {
      const args: ValidateHedStringArgs = {
        hedString: '',
        hedVersion: '8.3.0'
      };

      const result = await handleValidateHedString(args);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toEqual([]);
    });

    test('should return valid for a simple HED string', async () => {
      const args: ValidateHedStringArgs = {
        hedString: 'Event/Sensory-event',
        hedVersion: '8.3.0'
      };

      const result = await handleValidateHedString(args);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('should return an error for an invalid HED string', async () => {
        const args: ValidateHedStringArgs = {
          hedString: 'InvalidTag',
          hedVersion: '8.4.0'
        };
  
        const result = await handleValidateHedString(args);
  
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('TAG_NOT_FOUND');
        expect(result.warnings).toEqual([]);
    });

    test('should not return warnings when checkForWarnings is false', async () => {
        const args: ValidateHedStringArgs = {
          hedString: 'Event,Item/Object/Man-made-object/Vehicle/Train', // Train requires Train-car
          hedVersion: '8.4.0',
          checkForWarnings: false,
        };
  
        const result = await handleValidateHedString(args);
  
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    test('should return warnings when checkForWarnings is true', async () => {
        const args: ValidateHedStringArgs = {
          hedString: 'Event,Item/Object/Man-made-object/Vehicle/Train', // Train requires Train-car
          hedVersion: '8.4.0',
          checkForWarnings: true,
        };
  
        const result = await handleValidateHedString(args);
  
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].code).toBe('CHILD_REQUIRED');
    });

    test('should handle definitions parameter', async () => {
        // TODO: This test requires a valid definition and a HED string that uses it.
        const args: ValidateHedStringArgs = {
          hedString: 'Red, Def/myDef',
          hedVersion: '8.4.0',
          definitions: ['(Definition/myDef, (Event))']
        };
  
        const result = await handleValidateHedString(args);
  
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    test('should return an error for an invalid HED version', async () => {
        const args: ValidateHedStringArgs = {
          hedString: 'Event',
          hedVersion: 'invalid-version'
        };
  
        const result = await handleValidateHedString(args);
  
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('VALIDATION_ERROR');
    });
  });
});
