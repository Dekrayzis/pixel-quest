import React from 'react';
import ReactDOM from 'react-dom/client';
import { LevelEditor } from './LevelEditor';
import './editor.scss';

ReactDOM.createRoot(document.getElementById('editor-root')!).render(
  <React.StrictMode>
    <LevelEditor />
  </React.StrictMode>
);
