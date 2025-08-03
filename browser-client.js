/**
 * Browser integration script for HED MCP Server
 * This script provides a bridge between browser JavaScript and the Node.js MCP server
 */

// Browser-compatible HED validation client
class HEDBrowserClient {
  constructor(serverEndpoint = '/api/hed') {
    this.serverEndpoint = serverEndpoint;
    this.isAvailable = false;
    this.checkAvailability();
  }

  async checkAvailability() {
    try {
      // Try to ping the server
      const response = await fetch(this.serverEndpoint + '/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      this.isAvailable = response.ok;
    } catch (error) {
      console.warn('HED server not available, using mock validation');
      this.isAvailable = false;
    }
  }

  async validateHedString(hedString, hedVersion = '8.4.0', options = {}) {
    if (this.isAvailable) {
      return await this.callServer('validate/string', {
        hedString,
        hedVersion,
        checkForWarnings: options.checkForWarnings || false,
        definitions: options.definitions || []
      });
    } else {
      return this.mockValidateHedString(hedString, hedVersion, options);
    }
  }

  async validateHedTsv(tsvData, hedVersion = '8.4.0', options = {}) {
    if (this.isAvailable) {
      return await this.callServer('validate/tsv', {
        tsvData,
        hedVersion,
        checkForWarnings: options.checkForWarnings || false,
        sidecarData: options.sidecarData,
        definitions: options.definitions || []
      });
    } else {
      return this.mockValidateTsv(tsvData, hedVersion, options);
    }
  }

  async parseHedSidecar(jsonData, hedVersion = '8.4.0', options = {}) {
    if (this.isAvailable) {
      return await this.callServer('validate/sidecar', {
        jsonData,
        hedVersion,
        checkForWarnings: options.checkForWarnings || false
      });
    } else {
      return this.mockValidateSidecar(jsonData, hedVersion, options);
    }
  }

  async callServer(endpoint, data) {
    try {
      const response = await fetch(`${this.serverEndpoint}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Server call failed:', error);
      return {
        errors: [{
          code: 'SERVER_ERROR',
          severity: 'error',
          message: `Failed to contact HED server: ${error.message}`
        }],
        warnings: []
      };
    }
  }

  // Mock validation methods for when server is not available
  mockValidateHedString(hedString, hedVersion, options = {}) {
    const errors = [];
    const warnings = [];

    // Basic mock validation logic
    if (!hedString || hedString.trim() === '') {
      errors.push({
        code: 'EMPTY_STRING',
        severity: 'error',
        message: 'HED string cannot be empty'
      });
    }

    // Check for obviously invalid patterns
    if (hedString.includes('InvalidTag')) {
      errors.push({
        code: 'TAG_INVALID',
        severity: 'error',
        message: 'Invalid HED tag detected',
        location: hedString
      });
    }

    // Mock warning for extension tags
    if (options.checkForWarnings && /\w+\/[A-Z][a-z]*[A-Z]\w*/.test(hedString)) {
      warnings.push({
        code: 'TAG_EXTENDED',
        severity: 'warning',
        message: 'Extension tag detected - consider using standard tags',
        location: hedString
      });
    }

    return { errors, warnings };
  }

  mockValidateTsv(tsvData, hedVersion, options = {}) {
    const errors = [];
    const warnings = [];

    try {
      const lines = tsvData.trim().split('\n');
      if (lines.length < 2) {
        return {
          errors: [{
            code: 'INVALID_TSV',
            severity: 'error',
            message: 'TSV must have at least a header and one data row'
          }],
          warnings: []
        };
      }

      const headers = lines[0].split('\t');
      const hedIndex = headers.findIndex(h => h.toLowerCase().includes('hed'));

      if (hedIndex === -1) {
        return {
          errors: [],
          warnings: [],
          message: 'No HED column found in TSV'
        };
      }

      // Validate each row with HED data
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split('\t');
        const hedString = cells[hedIndex];

        if (hedString && hedString.trim()) {
          const result = this.mockValidateHedString(hedString, hedVersion, options);
          errors.push(...result.errors.map(e => ({ ...e, line: i + 1 })));
          warnings.push(...result.warnings.map(w => ({ ...w, line: i + 1 })));
        }
      }

      return { errors, warnings };
    } catch (error) {
      return {
        errors: [{
          code: 'TSV_PARSE_ERROR',
          severity: 'error',
          message: 'Failed to parse TSV data: ' + error.message
        }],
        warnings: []
      };
    }
  }

  mockValidateSidecar(jsonData, hedVersion, options = {}) {
    const errors = [];
    const warnings = [];

    try {
      const sidecar = JSON.parse(jsonData);

      // Recursively find and validate HED strings
      const validateHedInObject = (obj, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (key === 'HED' && typeof value === 'string') {
            const result = this.mockValidateHedString(value, hedVersion, options);
            errors.push(...result.errors.map(e => ({ ...e, location: currentPath })));
            warnings.push(...result.warnings.map(w => ({ ...w, location: currentPath })));
          } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            validateHedInObject(value, currentPath);
          }
        }
      };

      validateHedInObject(sidecar);

      return {
        errors,
        warnings,
        parsedHedSidecar: JSON.stringify(sidecar, null, 2)
      };
    } catch (error) {
      return {
        errors: [{
          code: 'JSON_PARSE_ERROR',
          severity: 'error',
          message: 'Invalid JSON format: ' + error.message
        }],
        warnings: []
      };
    }
  }
}

// Utility functions for browser integration
const HEDUtils = {
  // Format validation results for display
  formatResults(result) {
    let output = '';
    
    if (result.errors && result.errors.length > 0) {
      output += `❌ ${result.errors.length} Error(s):\n`;
      result.errors.forEach((error, i) => {
        output += `  ${i + 1}. [${error.code}] ${error.message}`;
        if (error.location) output += ` (${error.location})`;
        if (error.line) output += ` at line ${error.line}`;
        output += '\n';
      });
    } else {
      output += '✅ No errors found\n';
    }

    if (result.warnings && result.warnings.length > 0) {
      output += `\n⚠️  ${result.warnings.length} Warning(s):\n`;
      result.warnings.forEach((warning, i) => {
        output += `  ${i + 1}. [${warning.code}] ${warning.message}`;
        if (warning.location) output += ` (${warning.location})`;
        if (warning.line) output += ` at line ${warning.line}`;
        output += '\n';
      });
    }

    if (result.message) {
      output += `\nℹ️  ${result.message}\n`;
    }

    return output.trim();
  },

  // Create a simple validation form
  createValidationForm(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with ID '${containerId}' not found`);
    }

    const client = new HEDBrowserClient(options.serverEndpoint);

    container.innerHTML = `
      <div class="hed-validator-form">
        <h3>🧠 HED String Validator</h3>
        
        <div class="form-group">
          <label for="hed-string">HED String:</label>
          <textarea id="hed-string" rows="3" placeholder="Enter HED string to validate...">Event/Sensory-event, Red, Blue</textarea>
        </div>
        
        <div class="form-group">
          <label for="hed-version">Schema Version:</label>
          <select id="hed-version">
            <option value="8.4.0">8.4.0 (Standard)</option>
            <option value="8.3.0">8.3.0 (Standard)</option>
            <option value="8.5.0">8.5.0 (Standard)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="check-warnings"> Check for warnings
          </label>
        </div>
        
        <button id="validate-btn" type="button">Validate</button>
        <button id="clear-btn" type="button">Clear</button>
        
        <div id="validation-results" class="results-area" style="display: none;"></div>
      </div>
    `;

    // Add basic styles
    const style = document.createElement('style');
    style.textContent = `
      .hed-validator-form {
        max-width: 600px;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .form-group {
        margin-bottom: 15px;
      }
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }
      .form-group input, .form-group textarea, .form-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .form-group textarea {
        font-family: monospace;
        resize: vertical;
      }
      button {
        padding: 10px 20px;
        margin-right: 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      #validate-btn {
        background-color: #007cba;
        color: white;
      }
      #validate-btn:hover {
        background-color: #005a8b;
      }
      #clear-btn {
        background-color: #6c757d;
        color: white;
      }
      .results-area {
        margin-top: 20px;
        padding: 15px;
        border-radius: 4px;
        font-family: monospace;
        white-space: pre-wrap;
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
      }
      .results-area.success {
        background-color: #d4edda;
        border-color: #c3e6cb;
        color: #155724;
      }
      .results-area.error {
        background-color: #f8d7da;
        border-color: #f5c6cb;
        color: #721c24;
      }
      .results-area.warning {
        background-color: #fff3cd;
        border-color: #ffeaa7;
        color: #856404;
      }
    `;
    document.head.appendChild(style);

    // Event handlers
    const validateBtn = container.querySelector('#validate-btn');
    const clearBtn = container.querySelector('#clear-btn');
    const resultsDiv = container.querySelector('#validation-results');

    validateBtn.addEventListener('click', async () => {
      const hedString = container.querySelector('#hed-string').value;
      const hedVersion = container.querySelector('#hed-version').value;
      const checkWarnings = container.querySelector('#check-warnings').checked;

      validateBtn.textContent = 'Validating...';
      validateBtn.disabled = true;

      try {
        const result = await client.validateHedString(hedString, hedVersion, {
          checkForWarnings: checkWarnings
        });

        const formattedResult = HEDUtils.formatResults(result);
        resultsDiv.textContent = formattedResult;
        resultsDiv.style.display = 'block';

        // Set appropriate styling based on results
        resultsDiv.className = 'results-area';
        if (result.errors && result.errors.length > 0) {
          resultsDiv.classList.add('error');
        } else if (result.warnings && result.warnings.length > 0) {
          resultsDiv.classList.add('warning');
        } else {
          resultsDiv.classList.add('success');
        }
      } catch (error) {
        resultsDiv.textContent = `Error: ${error.message}`;
        resultsDiv.className = 'results-area error';
        resultsDiv.style.display = 'block';
      } finally {
        validateBtn.textContent = 'Validate';
        validateBtn.disabled = false;
      }
    });

    clearBtn.addEventListener('click', () => {
      container.querySelector('#hed-string').value = '';
      resultsDiv.style.display = 'none';
    });

    return client;
  }
};

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { HEDBrowserClient, HEDUtils };
} else if (typeof window !== 'undefined') {
  // Browser environment
  window.HEDBrowserClient = HEDBrowserClient;
  window.HEDUtils = HEDUtils;
}
