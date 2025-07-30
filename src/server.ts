#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import tools
import { 
  validateHedString, 
  handleValidateHedString,
  ValidateHedStringArgs 
} from "./tools/validateHedString.js";
import {
  validateHedSidecar,
  handleValidateHedSidecar,
  ValidateHedSidecarArgs
} from "./tools/validateHedSidecar.js";

// Import resources
import { hedSchemaResource, handleResourceRequest } from "./resources/hedSchema.js";

// Import schema cache
import { schemaCache } from "./utils/schemaCache.js";

/**
 * HED MCP Server
 * Provides tools and resources for HED (Hierarchical Event Descriptor) validation
 */
class HEDMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "hed-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    
    // Log cache initialization
    console.error("HED Schema cache initialized");
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [validateHedString, validateHedSidecar],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "validateHedString":
          const result = await handleValidateHedString(args as ValidateHedStringArgs);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };

        case "validateHedSidecar":
          const sidecarResult = await handleValidateHedSidecar(args as ValidateHedSidecarArgs);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(sidecarResult, null, 2),
              },
            ],
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private setupResourceHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [hedSchemaResource],
      };
    });

    // Handle resource requests
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        const content = await handleResourceRequest(uri);
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(content, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to read resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("HED MCP Server running on stdio");
  }
}

// Start the server
const server = new HEDMCPServer();
server.run().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
