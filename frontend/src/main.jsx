import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import serviceWorkerManager from './Utils/serviceWorker';

// Prevent multiple root creation during hot reload
if (import.meta.hot) {
  import.meta.hot.accept();
}

const rootElement = document.getElementById('root');
if (!rootElement._reactRoot) {
  const root = ReactDOM.createRoot(rootElement);
  rootElement._reactRoot = root;
  root.render(<App />);
} else {
  rootElement._reactRoot.render(<App />);
}

// Register service worker in production
if (import.meta.env.PROD) {
  serviceWorkerManager.register().then((success) => {
    if (success) {
      console.log('Service Worker registered successfully');
    }
  });
}