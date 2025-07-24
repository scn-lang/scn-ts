import { useState, useEffect, useCallback, useRef, type FC } from 'react';
import {
  generateScn,
  initializeParser,
  logger,
  type FileContent,
  type LogLevel,
  type RankedCodeGraph,
} from 'scn-ts';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import './App.css';

const defaultInput = JSON.stringify(
  [
    {
      path: 'src/components/Button.tsx',
      content: `import React from 'react';\nimport { styled } from '../styles';\nimport { useApi } from '../hooks/useApi';\n\ninterface ButtonProps {\n  onClick?: () => void;\n  children: React.ReactNode;\n  variant?: 'primary' | 'secondary';\n}\n\nexport const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => {\n  const { isLoading } = useApi();\n  \n  return (\n    <StyledButton \n      onClick={onClick} \n      disabled={isLoading}\n      className={\`btn btn-\${variant}\`}\n    >\n      {children}\n    </StyledButton>\n  );\n};\n\nconst StyledButton = styled.button\`\n  padding: 0.5rem 1rem;\n  border-radius: 4px;\n  border: none;\n  cursor: pointer;\n  \n  &.btn-primary {\n    background-color: #007bff;\n    color: white;\n  }\n  \n  &.btn-secondary {\n    background-color: #6c757d;\n    color: white;\n  }\n  \n  &:disabled {\n    opacity: 0.6;\n    cursor: not-allowed;\n  }\n\`;`,
    },
    {
      path: 'src/hooks/useApi.ts',
      content: `import { useState, useEffect, useCallback } from 'react';\nimport { ApiClient } from '../api/client';\n\nconst apiClient = new ApiClient();\n\nexport interface UseApiState<T> {\n  data: T | null;\n  isLoading: boolean;\n  error: string | null;\n}\n\nexport function useApi<T>() {\n  const [state, setState] = useState<UseApiState<T>>({\n    data: null,\n    isLoading: false,\n    error: null,\n  });\n\n  const execute = useCallback(async (apiCall: () => Promise<T>) => {\n    setState(prev => ({ ...prev, isLoading: true, error: null }));\n    \n    try {\n      const result = await apiCall();\n      setState({ data: result, isLoading: false, error: null });\n      return result;\n    } catch (error) {\n      const errorMessage = error instanceof Error ? error.message : 'An error occurred';\n      setState({ data: null, isLoading: false, error: errorMessage });\n      throw error;\n    }\n  }, []);\n\n  return {\n    ...state,\n    execute,\n    client: apiClient,\n  };\n}`
    },
  ],
  null,
  2
);

type LogEntry = {
  level: LogLevel | 'log';
  args: any[];
  timestamp: number;
}

type PerformanceMetrics = {
  startTime: number;
  endTime: number;
  duration: number;
  filesProcessed: number;
  nodesFound: number;
  edgesFound: number;
  maxWorkers: number;
  workerMode: 'sequential' | 'worker' | 'web-worker';
}

type WorkerConfig = {
  maxWorkers: number;
  stressTestEnabled: boolean;
  stressTestMultiplier: number;
}

function App() {
  const [input, setInput] = useState(defaultInput);
  const [output, setOutput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [workerConfig, setWorkerConfig] = useState<WorkerConfig>({
    maxWorkers: 1,
    stressTestEnabled: false,
    stressTestMultiplier: 1,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    logger.setLevel('debug');

    const originalConsole = { ...console };
    const intercept = (level: LogLevel | 'log', ...args: any[]) => {
      (originalConsole as any)[level](...args);
      setLogs(prev => [...prev, { level, args, timestamp: Date.now() }]);
    };

    console.log = (...args) => intercept('log', ...args);
    console.info = (...args) => intercept('info', ...args);
    console.warn = (...args) => intercept('warn', ...args);
    console.error = (...args) => intercept('error', ...args);
    console.debug = (...args) => intercept('debug', ...args);

    return () => {
      Object.assign(console, originalConsole);
    };
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setIsAnalyzing(true);
    setOutput('');
    setLogs([]);
    
    const startTime = performance.now();
    console.info('Starting SCN generation...', { workerConfig });

    try {
      let files: FileContent[] = JSON.parse(input);
      if (!Array.isArray(files) || !files.every(f => f.path && typeof f.content === 'string')) {
          throw new Error('Invalid input format. Must be an array of {path: string, content: string}');
      }

      // Apply stress test multiplier if enabled
      if (workerConfig.stressTestEnabled && workerConfig.stressTestMultiplier > 1) {
        const originalFiles = [...files];
        files = [];
        for (let i = 0; i < workerConfig.stressTestMultiplier; i++) {
          const multipliedFiles = originalFiles.map(f => ({
            ...f,
            path: `stress-${i}/${f.path}`,
          }));
          files.push(...multipliedFiles);
        }
        console.info(`Stress test enabled: multiplied ${originalFiles.length} files by ${workerConfig.stressTestMultiplier} = ${files.length} total files`);
      }
      
      console.info('Initializing parser...');
      await initializeParser({ wasmBaseUrl: '/wasm/' });
      console.info('Parser initialized.');

      const maxWorkers = workerConfig.maxWorkers;
      const workerMode = maxWorkers > 1 ? 'web-worker' : 'sequential';

      console.info(`Generating SCN for ${files.length} files with ${maxWorkers} workers (mode: ${workerMode})...`);
      
      const analysisStartTime = performance.now();
      const { scn, graph } = await generateScn({
        files,
        maxWorkers,
      });
      const analysisEndTime = performance.now();
      
      setOutput(scn);
      console.info('SCN generation complete.');

      const endTime = performance.now();
      const metrics: PerformanceMetrics = {
        startTime,
        endTime,
        duration: endTime - startTime,
        filesProcessed: files.length,
        nodesFound: graph.nodes.size,
        edgesFound: graph.edges.length,
        maxWorkers,
        workerMode,
      };
      
      setCurrentMetrics(metrics);
      setPerformanceMetrics(prev => [...prev, metrics]);
      
      console.info('Performance metrics:', {
        totalDuration: `${metrics.duration.toFixed(2)}ms`,
        analysisDuration: `${(analysisEndTime - analysisStartTime).toFixed(2)}ms`,
      });

    } catch (e: any) {
      console.error('Generation failed:', e.message, e);
      setOutput(`# Generation Failed\n\n**Error:**\n\`\`\`\n${e.stack || e.message}\n\`\`\``);
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  }, [input, workerConfig]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleClearMetrics = useCallback(() => {
    setPerformanceMetrics([]);
    setCurrentMetrics(null);
  }, []);

  const handleRunBenchmark = useCallback(async () => {
    const workerCounts = [1, 2, 4, 8];
    const originalConfig = { ...workerConfig };

    for (const maxWorkers of workerCounts) {
      if (abortControllerRef.current?.signal.aborted) break;
      
      setWorkerConfig(prev => ({ ...prev, maxWorkers }));
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      await handleAnalyze();
      await new Promise(resolve => setTimeout(resolve, 500)); // Pause between runs
    }
    
    // Restore original config
    setWorkerConfig(originalConfig);
  }, [workerConfig, handleAnalyze]);

  return (
    <>
      <h1>SCN-TS Web Demo - Worker Battle Test</h1>
      <div className="main-container">
        <div className="config-panel">
          <h3>SCN-TS Worker Battle Test Configuration</h3>
          <div className="config-grid">
            <label className="config-item">
              Max Workers:
              <input
                type="number"
                min="1"
                max="8"
                value={workerConfig.maxWorkers}
                onChange={e => setWorkerConfig(prev => ({ ...prev, maxWorkers: parseInt(e.target.value) || 1 }))}
                title="Number of worker threads for parallel analysis (1 = sequential)"
              />
            </label>
            
            <label className="config-item">
              <input
                type="checkbox"
                checked={workerConfig.stressTestEnabled}
                onChange={e => setWorkerConfig(prev => ({ ...prev, stressTestEnabled: e.target.checked }))}
              />
              Stress Test Mode
            </label>
            
            <label className="config-item">
              File Multiplier:
              <input
                type="number"
                min="1"
                max="20"
                value={workerConfig.stressTestMultiplier}
                onChange={e => setWorkerConfig(prev => ({ ...prev, stressTestMultiplier: parseInt(e.target.value) || 1 }))}
                disabled={!workerConfig.stressTestEnabled}
                title="Multiply input files by this factor for stress testing"
              />
            </label>
            
            <div className="config-info">
              <strong>Current Mode:</strong> {workerConfig.maxWorkers > 1 ? `Parallel (${workerConfig.maxWorkers} workers)` : 'Sequential'}
              {workerConfig.stressTestEnabled && (
                <span> | Stress Test: {workerConfig.stressTestMultiplier}x files</span>
              )}
            </div>
          </div>
          
          <div className="action-buttons">
            <button onClick={handleAnalyze} disabled={isAnalyzing} className="primary-button">
              {isAnalyzing ? 'Generating...' : 'Generate SCN'}
            </button>
            <button onClick={handleCancel} disabled={!isAnalyzing} className="secondary-button">
              Cancel
            </button>
            <button onClick={handleRunBenchmark} disabled={isAnalyzing} className="secondary-button">
              Run Worker Benchmark (1,2,4,8 workers)
            </button>
            <button onClick={handleClearMetrics} className="secondary-button">
              Clear Metrics
            </button>
          </div>
          
          {currentMetrics && (
            <div className="current-metrics">
              <h4>Last Run Metrics</h4>
              <div className="metrics-grid">
                <span>Duration: {currentMetrics.duration.toFixed(2)}ms</span>
                <span>Files: {currentMetrics.filesProcessed}</span>
                <span>Nodes: {currentMetrics.nodesFound}</span>
                <span>Edges: {currentMetrics.edgesFound}</span>
                <span>Workers: {currentMetrics.maxWorkers}</span>
                <span>Mode: {currentMetrics.workerMode}</span>
                <span>Files/sec: {(currentMetrics.filesProcessed / (currentMetrics.duration / 1000)).toFixed(2)}</span>
                <span>Nodes/sec: {(currentMetrics.nodesFound / (currentMetrics.duration / 1000)).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="container">
          <div className="panel">
              <h3>Input Files (JSON format)</h3>
              <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Enter FileContent[] as JSON string..."
                  spellCheck="false"
              />
          </div>
          <div className="panel">
              <h3>Output SCN</h3>
              <div className="output-panel">
                <SyntaxHighlighter
                  language="swift" // Using a language with similar comment/symbol syntax for basic highlighting
                  style={vscDarkPlus as any}
                  PreTag="pre"
                >
                  {output}
                </SyntaxHighlighter>
              </div>
          </div>
        </div>
        
        <div className="bottom-panels">
          <div className="panel">
            <h3>Performance History</h3>
            <div className="metrics-history">
              {performanceMetrics.length === 0 ? (
                <p>No metrics yet. Run an analysis to see performance data.</p>
              ) : (
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th>Mode</th>
                      <th>Workers</th>
                      <th>Files</th>
                      <th>Duration (ms)</th>
                      <th>Nodes</th>
                      <th>Files/sec</th>
                      <th>Nodes/sec</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceMetrics.map((metric, i) => (
                      <tr key={i} className={i === performanceMetrics.length - 1 ? 'latest' : ''}>
                        <td>{i + 1}</td>
                        <td>{metric.workerMode}</td>
                        <td>{metric.maxWorkers}</td>
                        <td>{metric.filesProcessed}</td>
                        <td>{metric.duration.toFixed(2)}</td>
                        <td>{metric.nodesFound}</td>
                        <td>{(metric.filesProcessed / (metric.duration / 1000)).toFixed(2)}</td>
                        <td>{(metric.nodesFound / (metric.duration / 1000)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="panel">
              <h3>Logs</h3>
              <div className="logs-panel">
                  {logs.map((log, i) => (
                      <div key={i} className={`log-entry log-${log.level}`}>
                          <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className="log-level">[{log.level.toUpperCase()}]</span>
                          <span className="log-message">{log.args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}</span>
                      </div>
                  ))}
              </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;