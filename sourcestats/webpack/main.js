// Source Server Stats
// File: sourcestats/webpack/main.jsx
// Desc: frontend entry-point

import React from 'react';
import ReactDOM from 'react-dom';

// Not included by default
import 'react-select/less/default.less';
import 'metrics-graphics/dist/metricsgraphics.css';

import './main.less';
import { App } from './App';

ReactDOM.render(
    <App />,
    document.getElementById('app')
);
