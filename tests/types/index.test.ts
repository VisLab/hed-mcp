import { ValidationResult, StringValidationOptions, HEDValidationContext } from '../../src/types/index';

describe('Type Definitions', () => {
  describe('ValidationResult', () => {
    test('should accept valid ValidationResult with minimal properties', () => {
      const result: ValidationResult = {
        isValid: true
      };
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });

    test('should accept ValidationResult with errors and warnings', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1']
      };
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
      expect(result.errors).toContain('Error 1');
      expect(result.warnings).toContain('Warning 1');
    });
  });

  describe('StringValidationOptions', () => {
    test('should accept empty options object', () => {
      const options: StringValidationOptions = {};
      
      expect(options.strict).toBeUndefined();
      expect(options.allowWarnings).toBeUndefined();
    });

    test('should accept options with all properties set', () => {
      const options: StringValidationOptions = {
        strict: true,
        allowWarnings: false
      };
      
      expect(options.strict).toBe(true);
      expect(options.allowWarnings).toBe(false);
    });
  });

  describe('HEDValidationContext', () => {
    test('should accept empty context object', () => {
      const context: HEDValidationContext = {};
      
      expect(context.schemaVersion).toBeUndefined();
      expect(context.validationRules).toBeUndefined();
    });

    test('should accept full context object', () => {
      const context: HEDValidationContext = {
        schemaVersion: '8.3.0',
        validationRules: ['syntax', 'semantics', 'units']
      };
      
      expect(context.schemaVersion).toBe('8.3.0');
      expect(context.validationRules).toHaveLength(3);
      expect(context.validationRules).toEqual(['syntax', 'semantics', 'units']);
    });
  });
});
