import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { EnsureKontentAsParent } from './EnsureKontentAsParent';
import { ConfigProvider } from './ConfigContext';
import { AlgoliaElement } from './AlgoliaElement';
import { PoweredBy } from 'react-instantsearch-hooks-web';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <EnsureKontentAsParent>
      <ConfigProvider>
        <AlgoliaElement />
      </ConfigProvider>
      <PoweredBy />
    </EnsureKontentAsParent>
  </React.StrictMode>
);
