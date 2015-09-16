// Source Server Stats
// File: sourcestats/webpack/main.jsx
// Desc: frontend entry-point

import React from 'react';
// Not included by default
import 'react-select/less/default.less';
import 'metrics-graphics/dist/metricsgraphics.css';

import './main.less';
import { App } from './App';

React.render(
    <App />,
    document.getElementById('app')
);
