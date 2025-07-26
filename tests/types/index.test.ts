import { FormattedIssue, HedValidationResult } from '../../src/types/index';

describe('Type Definitions', () => {
  describe('FormattedIssue', () => {
    test('should correctly represent a formatted issue', () => {
      const issue: FormattedIssue = {
        code: 'HED_TAG_NOT_FOUND',
        detailedCode: 'HED_TAG_NOT_FOUND_DETAIL',
        severity: 'error',
        message: 'The HED tag "Event" was not found in the schema.',
        column: '12',
        line: '5',
        location: 'Line 5, Column 12',
      };

      expect(issue.code).toBe('HED_TAG_NOT_FOUND');
      expect(issue.detailedCode).toBe('HED_TAG_NOT_FOUND_DETAIL');
      expect(issue.severity).toBe('error');
      expect(issue.message).toContain('not found in the schema');
      expect(issue.column).toBe('12');
      expect(issue.line).toBe('5');
      expect(issue.location).toBe('Line 5, Column 12');
    });
  });

  describe('HedValidationResult', () => {
    test('should represent a valid result', () => {
      const result: HedValidationResult = {
        isValid: true,
      };

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.warnings).toBeUndefined();
      expect(result.issues).toBeUndefined();
    });

    test('should represent an invalid result with errors', () => {
      const error: FormattedIssue = {
        code: 'ERROR_CODE',
        detailedCode: 'DETAILED_ERROR',
        severity: 'error',
        message: 'An error occurred',
        column: '1',
        line: '1',
        location: 'Line 1, Column 1',
      };
      const result: HedValidationResult = {
        isValid: false,
        errors: [error],
      };

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0].code).toBe('ERROR_CODE');
    });

    test('should represent a valid result with warnings', () => {
      const warning: FormattedIssue = {
        code: 'WARNING_CODE',
        detailedCode: 'DETAILED_WARNING',
        severity: 'warning',
        message: 'A warning was issued',
        column: '10',
        line: '2',
        location: 'Line 2, Column 10',
      };
      const result: HedValidationResult = {
        isValid: true,
        warnings: [warning],
      };

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings?.[0].severity).toBe('warning');
    });

    test('should handle results with generic issues', () => {
      const result: HedValidationResult = {
        isValid: false,
        issues: ['This is a simple issue string.', { custom: 'issue object' }],
      };

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.issues).toContain('This is a simple issue string.');
    });
  });
});
