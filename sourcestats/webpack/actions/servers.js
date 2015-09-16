// Source Server Stats
// File: webpack/actions/servers.js
// Desc: actions for the servers list

import 'whatwg-fetch';
import _ from 'lodash';
import URI from 'URIjs';

import * as constants from '../constants';

var lock = false;


/** Sets filters for the server list. */
export function filterServers(filters = {}) {
    // Pass a copy of the filters to the store
    return {
        type: constants.FILTER_SERVERS,
        filters: _.cloneDeep(filters)
    };
}


/** Fetches servers with our current filters. */
export function fetchServers() {
    // If the fetch lock is on, return no action. The component will blindly call this.
    if (lock)
        return {};

    lock = true;
    let url = new URI('/api/v1/servers');
    let params = {};

    return (dispatch, getState) => {
        const state = getState();

        if (!state.servers.hasMore) {
            lock = false;
            return;
        }

        // Add filters -> params
        _.extend(params, _.pick(state.servers.filters, (value) => {
            return value ? true : false;
        }));

        // Set position
        if (state.servers.position)
            params.from = state.servers.position;

        fetch(url.query(params))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: constants.FETCH_SERVERS,
                servers: response.servers,
                total: response.total,
                players: response.players
            });

            lock = false;
        });
    };
}


/** Fetches the list of games matching our other filters (for the dropdown). */
export function fetchGames() {
    let url = new URI('/api/v1/games');

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: constants.FETCH_SERVERS_GAMES,
                games: response.games
            });
        });
    };
}
