import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { applyTheme } from '@/themes';

applyTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
	<App />
);
