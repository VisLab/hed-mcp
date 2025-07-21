import { handleValidateStringTool, ValidateStringToolArgs, validateStringTool } from '../../src/tools/validateStringTool';

describe('ValidateStringTool', () => {
  describe('Tool Definition', () => {
    test('should have correct tool name', () => {
      expect(validateStringTool.name).toBe('validateStringTool');
    });

    test('should have a description', () => {
      expect(validateStringTool.description).toBeDefined();
      if (validateStringTool.description) {
        expect(validateStringTool.description.length).toBeGreaterThan(0);
      }
    });

    test('should have input schema with required inputString', () => {
      expect(validateStringTool.inputSchema).toBeDefined();
      expect(validateStringTool.inputSchema.properties).toBeDefined();
      if (validateStringTool.inputSchema.properties) {
        expect(validateStringTool.inputSchema.properties.inputString).toBeDefined();
      }
      expect(validateStringTool.inputSchema.required).toContain('inputString');
    });

    test('should have optional options parameter', () => {
      if (validateStringTool.inputSchema.properties) {
        expect(validateStringTool.inputSchema.properties.options).toBeDefined();
      }
      expect(validateStringTool.inputSchema.required).not.toContain('options');
    });
  });

  describe('handleValidateStringTool', () => {
    test('should return invalid result for empty string', async () => {
      const args: ValidateStringToolArgs = {
        inputString: ''
      };

      const result = await handleValidateStringTool(args);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('Input string cannot be empty');
    });

    test('should return invalid result for whitespace-only string', async () => {
      const args: ValidateStringToolArgs = {
        inputString: '   \t\n  '
      };

      const result = await handleValidateStringTool(args);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('Input string cannot be empty');
    });

    test('should return warning for very long string', async () => {
      const longString = 'a'.repeat(1001);
      const args: ValidateStringToolArgs = {
        inputString: longString
      };

      const result = await handleValidateStringTool(args);

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('Input string is very long (>1000 characters)');
    });

    test('should return warning for string without HED structure', async () => {
      const args: ValidateStringToolArgs = {
        inputString: 'simple text without tags'
      };

      const result = await handleValidateStringTool(args);

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('String may not follow HED tag structure (no \'/\' found)');
    });

    test('should validate string with HED-like structure', async () => {
      const args: ValidateStringToolArgs = {
        inputString: 'Action/Move/Walk, Agent/Person'
      };

      const result = await handleValidateStringTool(args);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should respect allowWarnings option when false', async () => {
      const args: ValidateStringToolArgs = {
        inputString: 'simple text without tags',
        options: {
          allowWarnings: false
        }
      };

      const result = await handleValidateStringTool(args);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toBeDefined();
    });

    test('should respect allowWarnings option when true', async () => {
      const args: ValidateStringToolArgs = {
        inputString: 'simple text without tags',
        options: {
          allowWarnings: true
        }
      };

      const result = await handleValidateStringTool(args);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
    });

    test('should handle options with strict mode', async () => {
      const args: ValidateStringToolArgs = {
        inputString: 'Action/Move/Walk',
        options: {
          strict: true,
          allowWarnings: true
        }
      };

      const result = await handleValidateStringTool(args);

      expect(result.isValid).toBe(true);
    });

    test('should handle missing options parameter', async () => {
      const args: ValidateStringToolArgs = {
        inputString: 'Action/Move/Walk'
      };

      const result = await handleValidateStringTool(args);

      expect(result.isValid).toBe(true);
    });

    test('should handle partial options object', async () => {
      const args: ValidateStringToolArgs = {
        inputString: 'Action/Move/Walk',
        options: {
          strict: true
          // allowWarnings not specified, should default to true
        }
      };

      const result = await handleValidateStringTool(args);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should return structured error response on unexpected failure', async () => {
      // This test simulates what would happen if the validation logic threw an error
      const args: ValidateStringToolArgs = {
        inputString: 'test string'
      };

      // Note: Since our current implementation doesn't throw errors,
      // this tests the error handling structure
      const result = await handleValidateStringTool(args);

      expect(result).toHaveProperty('isValid');
      expect(typeof result.isValid).toBe('boolean');
    });
  });
});
