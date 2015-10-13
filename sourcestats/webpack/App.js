// Source Server Stats
// File: sourcestats/webpack/App.jsx
// Desc: App wrapper class for routes/etc

import React from 'react';
import thunk from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { Router, Route, Redirect } from 'react-router';
import { history } from 'react-router/lib/BrowserHistory';

import * as components from './components';
import * as reducers from './reducers';


const reducer = combineReducers(reducers);
const createMiddlewareStore = applyMiddleware(thunk)(createStore);
const store = createMiddlewareStore(reducer);

function renderRoutes() {
    const {
        AppContainer,
        ServersContainer, ServerContainer,
        MapsContainer, MapContainer,
        GamesContainer, GameContainer
    } = components;

    return (
        <Router history={history}>
            <Route component={AppContainer}>
                <Redirect from='/' to='/servers' />
                <Route path='/servers' component={ServersContainer} />
                <Route path='/maps' component={MapsContainer} />
                <Route path='/games' component={GamesContainer} />
                <Route path='/server/:hash' component={ServerContainer} />
                <Route path='/map/:map' component={MapContainer} />
                <Route path='/game/:game_id' component={GameContainer} />
            </Route>
        </Router>
    );
}

export class App extends React.Component {
    render() {
        return (
            <Provider store={store}>
                {renderRoutes}
            </Provider>
        );
    }
}
