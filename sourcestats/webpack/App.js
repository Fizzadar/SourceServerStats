// Source Server Stats
// File: sourcestats/webpack/App.jsx
// Desc: App wrapper class for routes/etc

import React from 'react';
import thunk from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { Router, Route, Redirect } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';

import * as components from './components';
import * as reducers from './reducers';


const reducer = combineReducers(reducers);
const createMiddlewareStore = applyMiddleware(thunk)(createStore);
const store = createMiddlewareStore(reducer);

export class App extends React.Component {
    render() {
        const {
            AppContainer,
            ServersContainer, ServerContainer,
            MapsContainer, MapContainer,
            GamesContainer, GameContainer,
            GlobalContainer
        } = components;

        return (
            <Provider store={store}>
                <Router history={createBrowserHistory()}>
                    <Route component={AppContainer}>
                        <Redirect from='/' to='/servers' />
                        <Route path='/servers' component={ServersContainer} />
                        <Route path='/maps' component={MapsContainer} />
                        <Route path='/games' component={GamesContainer} />
                        <Route path='/server/:hash' component={ServerContainer} />
                        <Route path='/map/:map' component={MapContainer} />
                        <Route path='/game/:game_id' component={GameContainer} />
                        <Route path='/global' component={GlobalContainer} />
                    </Route>
                </Router>
            </Provider>
        );
    }
}
