/**
 * Example of how to use the definition processor utilities
 */

import { processDefinitions, createDefinitionManager } from './src/utils/definitionProcessor.js';
import { buildSchemasFromVersion } from 'hed-validator';

async function exampleUsage() {
  // Load HED schemas
  const hedSchemas = await buildSchemasFromVersion('8.4.0');
  
  // Example definition strings
  const definitionStrings = [
    '(Definition/MyColor, (Red))',
    '(Definition/MyAction, (Move))',
    '(Definition/InvalidDef, Red)' // This will cause an error
  ];
  
  // Process the definitions - now synchronous!
  console.log('Processing definitions...');
  const result = processDefinitions(definitionStrings, hedSchemas);
  
  console.log('Result:', {
    success: result.success,
    processedCount: result.processedCount,
    failedCount: result.failedCount,
    issueCount: result.issues.length,
    definitionCount: result.definitionManager.definitions.size
  });
  
  if (result.issues.length > 0) {
    console.log('Issues found:');
    result.issues.forEach(issue => {
      console.log(`  ${issue.severity}: ${issue.message}`);
    });
  }
  
  // If successful, the definition manager can be used for validation
  if (result.success) {
    console.log('Definitions in manager:');
    for (const [name, definition] of result.definitionManager.definitions) {
      console.log(`  - ${name}: ${(definition as any).defContents?.normalized || 'No contents'}`);
    }
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export { exampleUsage };
