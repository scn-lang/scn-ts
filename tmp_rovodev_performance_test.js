#!/usr/bin/env bun

import { generateScn } from './src/index.js';
import { setupTestProject } from './test/test.util.js';

async function createLargeTestProject() {
  const files = {};
  
  // Create 20 TypeScript files with dependencies
  for (let i = 0; i < 20; i++) {
    const imports = [];
    const calls = [];
    
    // Each file imports from 2-3 previous files
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (Math.random() > 0.5) {
        imports.push(`import { func${j} } from './file${j}';`);
        calls.push(`func${j}();`);
      }
    }
    
    files[`file${i}.ts`] = `
${imports.join('\n')}

export function func${i}() {
  console.log('Function ${i}');
  ${calls.join('\n  ')}
}

export class Class${i} {
  method${i}() {
    return 'Method ${i}';
  }
}

export const constant${i} = ${i};
`;
  }
  
  return await setupTestProject(files);
}

async function measurePerformance(maxWorkers, label) {
  const project = await createLargeTestProject();
  
  try {
    const startTime = performance.now();
    
    await generateScn({
      root: project.projectDir,
      include: ['**/*.ts'],
      maxWorkers: maxWorkers
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    return duration;
  } finally {
    await project.cleanup();
  }
}

async function runPerformanceComparison() {
  console.log('🚀 SCN-TS Performance Test with Worker API');
  console.log('==========================================');
  
  // Warm up
  console.log('Warming up...');
  await measurePerformance(1, 'Warmup');
  
  console.log('\nRunning performance comparison:');
  
  // Test single-threaded
  const singleThreaded = await measurePerformance(1, 'Single-threaded (maxWorkers: 1)');
  
  // Test with 2 workers
  const twoWorkers = await measurePerformance(2, 'Parallel (maxWorkers: 2)     ');
  
  // Test with 4 workers
  const fourWorkers = await measurePerformance(4, 'Parallel (maxWorkers: 4)     ');
  
  console.log('\n📊 Results:');
  console.log(`Single-threaded: ${singleThreaded.toFixed(2)}ms`);
  console.log(`2 workers:       ${twoWorkers.toFixed(2)}ms (${(singleThreaded/twoWorkers).toFixed(2)}x speedup)`);
  console.log(`4 workers:       ${fourWorkers.toFixed(2)}ms (${(singleThreaded/fourWorkers).toFixed(2)}x speedup)`);
}

runPerformanceComparison().catch(console.error);