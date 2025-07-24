// Configure web-tree-sitter before any other imports
(window as any).TreeSitterModule = {
  locateFile: (path: string) => {
    if (path === 'tree-sitter.wasm') {
      return '/tree-sitter.wasm';
    }
    return path;
  }
};

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)