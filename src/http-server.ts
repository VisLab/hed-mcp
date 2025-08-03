#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { 
  handleValidateHedString,
  ValidateHedStringArgs 
} from "./tools/validateHedString.js";
import {
  handleParseHedSidecar,
  ParseHedSidecarArgs
} from "./tools/parseHedSidecar.js";
import {
  handleValidateHedTsv,
  ValidateHedTsvArgs
} from "./tools/validateHedTsv.js";

/**
 * HTTP REST API server for HED validation
 * This allows browser applications to call HED validation via HTTP
 */
class HEDHttpServer {
  private app: express.Application;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Enable CORS for browser requests
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://'],
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));
    
    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API information endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'HED Validation API',
        version: '1.0.0',
        description: 'REST API for HED (Hierarchical Event Descriptor) validation',
        endpoints: {
          'GET /health': 'Health check',
          'GET /api': 'API information',
          'POST /api/validate/string': 'Validate HED string',
          'POST /api/validate/tsv': 'Validate TSV file data',
          'POST /api/validate/sidecar': 'Parse and validate sidecar JSON'
        },
        documentation: 'https://github.com/VisLab/hed-mcp-typescript'
      });
    });

    // Validate HED string
    this.app.post('/api/validate/string', async (req, res) => {
      try {
        const args: ValidateHedStringArgs = {
          hedString: req.body.hedString,
          hedVersion: req.body.hedVersion,
          checkForWarnings: req.body.checkForWarnings || false,
          definitions: req.body.definitions || []
        };

        // Validate required parameters
        if (!args.hedString || !args.hedVersion) {
          return res.status(400).json({
            error: 'Missing required parameters',
            required: ['hedString', 'hedVersion']
          });
        }

        const result = await handleValidateHedString(args);
        res.json(result);
      } catch (error) {
        console.error('String validation error:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Validate TSV data
    this.app.post('/api/validate/tsv', async (req, res) => {
      try {
        const args: ValidateHedTsvArgs = {
          filePath: req.body.filePath || '/virtual/data.tsv',
          hedVersion: req.body.hedVersion,
          checkForWarnings: req.body.checkForWarnings || false,
          fileData: req.body.fileData || req.body.tsvData,
          jsonData: req.body.jsonData || req.body.sidecarData,
          definitions: req.body.definitions || []
        };

        // Validate required parameters
        if (!args.hedVersion || (!args.fileData && !req.body.tsvData)) {
          return res.status(400).json({
            error: 'Missing required parameters',
            required: ['hedVersion', 'fileData or tsvData']
          });
        }

        const result = await handleValidateHedTsv(args);
        res.json(result);
      } catch (error) {
        console.error('TSV validation error:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Parse and validate sidecar
    this.app.post('/api/validate/sidecar', async (req, res) => {
      try {
        const args: ParseHedSidecarArgs = {
          filePath: req.body.filePath || '/virtual/sidecar.json',
          hedVersion: req.body.hedVersion,
          checkForWarnings: req.body.checkForWarnings || false,
          fileData: req.body.fileData || req.body.jsonData
        };

        // Validate required parameters
        if (!args.hedVersion || (!args.fileData && !req.body.jsonData)) {
          return res.status(400).json({
            error: 'Missing required parameters',
            required: ['hedVersion', 'fileData or jsonData']
          });
        }

        const result = await handleParseHedSidecar(args);
        res.json(result);
      } catch (error) {
        console.error('Sidecar validation error:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Serve static files (like the browser validator)
    this.app.use('/static', express.static('public'));
    
    // Serve the browser validator at root
    this.app.get('/', (req, res) => {
      res.sendFile('browser-validator.html', { root: process.cwd() });
    });

    // Error handling middleware
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not found',
        message: `Endpoint ${req.method} ${req.path} not found`,
        available: [
          'GET /health',
          'GET /api', 
          'POST /api/validate/string',
          'POST /api/validate/tsv',
          'POST /api/validate/sidecar'
        ]
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`🧠 HED HTTP API Server running on http://localhost:${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`📚 API docs: http://localhost:${this.port}/api`);
        console.log(`🌐 Browser validator: http://localhost:${this.port}/`);
        resolve();
      });
    });
  }
}

// Start the server
const port = parseInt(process.env.PORT || '3000');
const server = new HEDHttpServer(port);

server.start().catch((error) => {
  console.error('Failed to start HTTP server:', error);
  process.exit(1);
});
