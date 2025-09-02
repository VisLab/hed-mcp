/**
 * HED Validator Browser Client
 * 
 * A modern, clean browser client for HED validation that can work with either:
 * 1. The HED MCP HTTP server (full validation with hed-validator library)
 * 2. Mock validation (for demonstration when server is not available)
 * 
 * Usage:
 *   const client = new HEDValidatorClient();
 *   const result = await client.validateString('Event/Sensory-event, Red');
 * 
 * @author HED MCP TypeScript Project
 * @version 1.0.0
 */

class HEDValidatorClient {
    constructor(options = {}) {
        this.serverEndpoint = options.serverEndpoint || '/api/hed';
        this.timeout = options.timeout || 10000;
        this.isServerAvailable = false;
        this.initialized = false;
        
        // Auto-initialize on creation
        this.initialize();
    }

    /**
     * Initialize the client and check server availability
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            const response = await fetch(`${this.serverEndpoint}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(this.timeout)
            });
            
            this.isServerAvailable = response.ok;
        } catch (error) {
            console.info('HED server not available, using mock validation:', error.message);
            this.isServerAvailable = false;
        }
        
        this.initialized = true;
        this.dispatchEvent('ready', { serverAvailable: this.isServerAvailable });
    }

    /**
     * Validate a HED string
     */
    async validateString(hedString, options = {}) {
        await this.initialize();
        
        const params = {
            hedString: hedString.trim(),
            hedVersion: options.hedVersion || '8.4.0',
            checkForWarnings: options.checkForWarnings || false,
            definitions: options.definitions || []
        };

        if (this.isServerAvailable) {
            return await this.callServer('validate/string', params);
        } else {
            return this.mockValidateString(params);
        }
    }

    /**
     * Validate TSV data
     */
    async validateTsv(tsvData, options = {}) {
        await this.initialize();
        
        const params = {
            filePath: options.filePath || '/virtual/data.tsv',
            hedVersion: options.hedVersion || '8.4.0',
            checkForWarnings: options.checkForWarnings || false,
            fileData: tsvData.trim(),
            jsonData: options.jsonData || null,
            definitions: options.definitions || []
        };

        if (this.isServerAvailable) {
            return await this.callServer('validate/tsv', params);
        } else {
            return this.mockValidateTsv(params);
        }
    }

    /**
     * Validate sidecar JSON
     */
    async validateSidecar(jsonData, options = {}) {
        await this.initialize();
        
        const params = {
            filePath: options.filePath || '/virtual/sidecar.json',
            hedVersion: options.hedVersion || '8.4.0',
            checkForWarnings: options.checkForWarnings || false,
            fileData: jsonData.trim()
        };

        if (this.isServerAvailable) {
            return await this.callServer('validate/sidecar', params);
        } else {
            return this.mockValidateSidecar(params);
        }
    }

    /**
     * Get file contents from path
     */
    async getFileFromPath(filePath) {
        await this.initialize();
        
        const params = { filePath: filePath };

        if (this.isServerAvailable) {
            // For HTTP server, we'll need to add this endpoint
            try {
                const response = await fetch(`${this.serverEndpoint}/file`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params),
                    signal: AbortSignal.timeout(this.timeout)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.text();
            } catch (error) {
                console.warn('File reading not available via HTTP server:', error.message);
                throw new Error('File reading not available in browser environment');
            }
        } else {
            throw new Error('File reading requires server connection');
        }
    }

    /**
     * Call the HED server API
     */
    async callServer(endpoint, params) {
        try {
            const response = await fetch(`${this.serverEndpoint}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
                signal: AbortSignal.timeout(this.timeout)
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Server call failed:', error);
            throw new Error(`Failed to connect to HED server: ${error.message}`);
        }
    }

    // Mock validation methods for when server is not available
    mockValidateString({ hedString, hedVersion, checkForWarnings, definitions }) {
        const errors = [];
        const warnings = [];

        // Simple validation rules
        if (hedString.includes('InvalidTag')) {
            errors.push({
                code: 'INVALID_TAG',
                severity: 'error',
                message: 'Tag "InvalidTag" is not a valid HED tag',
                location: hedString.indexOf('InvalidTag')
            });
        }

        if (checkForWarnings && /[A-Z][a-z]*\/[A-Z][a-z]*Object/.test(hedString)) {
            warnings.push({
                code: 'EXTENSION_TAG',
                severity: 'warning',
                message: 'Extension tag used - consider using more specific standard tags',
                location: hedString
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            hedVersion,
            validationTime: Date.now(),
            mock: true
        };
    }

    mockValidateTsv({ filePath, hedVersion, checkForWarnings, fileData, jsonData, definitions }) {
        const tsvData = fileData;
        const sidecarData = jsonData;
        
        const lines = tsvData.trim().split('\n');
        if (lines.length === 0) {
            return { isValid: false, errors: [{ code: 'EMPTY_FILE', message: 'TSV data is empty' }] };
        }

        const headers = lines[0].split('\t');
        const hedIndex = headers.indexOf('HED');
        
        if (hedIndex === -1) {
            return {
                isValid: true,
                errors: [],
                warnings: [],
                message: 'No HED column found - nothing to validate',
                mock: true
            };
        }

        const errors = [];
        const warnings = [];

        // Validate each row with HED data
        for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split('\t');
            const hedString = cells[hedIndex];
            
            if (hedString && hedString.trim()) {
                const result = this.mockValidateString({
                    hedString,
                    hedVersion,
                    checkForWarnings,
                    definitions: definitions || []
                });
                
                errors.push(...result.errors.map(e => ({ ...e, line: i + 1, row: i })));
                warnings.push(...result.warnings.map(w => ({ ...w, line: i + 1, row: i })));
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            rowsProcessed: lines.length - 1,
            hedVersion,
            mock: true
        };
    }

    mockValidateSidecar({ filePath, hedVersion, checkForWarnings, fileData }) {
        const jsonData = fileData;
        
        const errors = [];
        const warnings = [];

        try {
            const sidecar = JSON.parse(jsonData);
            
            // Recursively find and validate HED strings
            const validateHedInObject = (obj, path = '') => {
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    
                    if (key === 'HED' && typeof value === 'string') {
                        const result = this.mockValidateString({
                            hedString: value,
                            hedVersion,
                            checkForWarnings,
                            definitions: []
                        });
                        
                        errors.push(...result.errors.map(e => ({ ...e, path: currentPath })));
                        warnings.push(...result.warnings.map(w => ({ ...w, path: currentPath })));
                    } else if (typeof value === 'object' && value !== null) {
                        validateHedInObject(value, currentPath);
                    }
                }
            };

            validateHedInObject(sidecar);

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                hedVersion,
                parsedSidecar: sidecar,
                mock: true
            };
        } catch (parseError) {
            return {
                isValid: false,
                errors: [{
                    code: 'JSON_PARSE_ERROR',
                    severity: 'error',
                    message: `Invalid JSON format: ${parseError.message}`
                }],
                warnings: [],
                mock: true
            };
        }
    }

    /**
     * Simple event system for client status updates
     */
    dispatchEvent(type, data) {
        const event = new CustomEvent(`hed-validator-${type}`, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * Format validation results for display
     */
    static formatResults(result) {
        if (!result) return 'No results';
        
        let output = '';
        
        if (result.mock) {
            output += '📝 Mock Validation Results\n';
        }
        
        if (result.isValid) {
            output += '✅ Validation Successful!\n';
        } else {
            output += '❌ Validation Failed\n';
        }
        
        if (result.errors && result.errors.length > 0) {
            output += `\n🚫 Errors (${result.errors.length}):\n`;
            result.errors.forEach((error, i) => {
                output += `  ${i + 1}. [${error.code}] ${error.message}`;
                if (error.line) output += ` (line ${error.line})`;
                if (error.path) output += ` (${error.path})`;
                output += '\n';
            });
        }
        
        if (result.warnings && result.warnings.length > 0) {
            output += `\n⚠️ Warnings (${result.warnings.length}):\n`;
            result.warnings.forEach((warning, i) => {
                output += `  ${i + 1}. [${warning.code}] ${warning.message}`;
                if (warning.line) output += ` (line ${warning.line})`;
                if (warning.path) output += ` (${warning.path})`;
                output += '\n';
            });
        }
        
        if (result.rowsProcessed) {
            output += `\n📊 Processed ${result.rowsProcessed} rows`;
        }
        
        if (result.hedVersion) {
            output += `\n🏷️ HED Version: ${result.hedVersion}`;
        }
        
        return output;
    }

    /**
     * Get available HED schema versions (mock data)
     */
    static getAvailableVersions() {
        return [
            { value: '8.4.0', label: '8.4.0 (Latest Standard)' },
            { value: '8.3.0', label: '8.3.0 (Standard)' },
            { value: '8.2.0', label: '8.2.0 (Standard)' },
            { value: 'lang_1.1.0', label: '8.4.0 + Language Library' },
            { value: 'score_2.1.0', label: '8.4.0 + Score Library' }
        ];
    }

    /**
     * Create a complete validation form in the specified container
     */
    static createValidationForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container element with id '${containerId}' not found`);
            return null;
        }

        const client = new HEDValidatorClient();
        
        container.innerHTML = `
            <div class="tool-section">
                <div class="tool-header">
                    🧪 Quick HED Validation
                </div>
                <div class="tool-body">
                    <div class="form-group">
                        <label for="quick-hed-input">HED String:</label>
                        <textarea id="quick-hed-input" placeholder="Enter HED string to validate...">Event/Sensory-event, Red, Blue</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="quick-version-select">HED Version:</label>
                        <select id="quick-version-select">
                            ${HEDValidatorClient.getAvailableVersions().map(v => 
                                `<option value="${v.value}">${v.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="quick-warnings-check">
                        <label for="quick-warnings-check">Check for warnings</label>
                    </div>
                    
                    <button id="quick-validate-btn" class="btn">Validate</button>
                    
                    <div id="quick-results" class="results"></div>
                </div>
            </div>
        `;

        // Add event listener
        document.getElementById('quick-validate-btn').addEventListener('click', async () => {
            const hedString = document.getElementById('quick-hed-input').value;
            const hedVersion = document.getElementById('quick-version-select').value;
            const checkWarnings = document.getElementById('quick-warnings-check').checked;
            const resultsDiv = document.getElementById('quick-results');
            
            // Show loading
            resultsDiv.className = 'results loading';
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = '<span class="spinner"></span> Validating...';
            
            try {
                const result = await client.validateString(hedString, {
                    hedVersion,
                    checkForWarnings: checkWarnings
                });
                
                resultsDiv.className = `results ${result.isValid ? 'success' : 'error'}`;
                resultsDiv.textContent = HEDValidatorClient.formatResults(result);
            } catch (error) {
                resultsDiv.className = 'results error';
                resultsDiv.textContent = `Error: ${error.message}`;
            }
        });

        return client;
    }
}

// Global utility object for backwards compatibility
window.HEDValidator = HEDValidatorClient;
window.HEDUtils = {
    createValidationForm: HEDValidatorClient.createValidationForm,
    formatResults: HEDValidatorClient.formatResults
};

// Auto-create client instance for global use
window.hedValidator = new HEDValidatorClient();

console.log('🧠 HED Validator Browser Client loaded successfully!');
