// Source Server Stats
// File: sourcestats/webpack/actions/servers.js
// Desc: actions for the servers list

import 'whatwg-fetch';
import _ from 'lodash';
import URI from 'URIjs';

export const FILTER_SERVERS = 'FILTER_SERVERS';
export const FETCH_SERVERS = 'FETCH_SERVERS';

export const FETCH_SERVER = 'FETCH_SERVER';
export const FETCH_SERVER_TOP_PLAYERS = 'FETCH_SERVER_TOP_PLAYERS';
export const FETCH_SERVER_TOP_MAPS = 'FETCH_SERVER_TOP_MAPS';
export const FETCH_SERVER_PLAYER_HISTORY = 'FETCH_SERVER_PLAYER_HISTORY';
export const FETCH_SERVER_PING_HISTORY = 'FETCH_SERVER_PING_HISTORY';


/** Sets filters for the server list. */
export function filterServers(filters = {}) {
    // Pass a copy of the filters to the store
    return {
        type: FILTER_SERVERS,
        filters: _.cloneDeep(filters)
    };
}


var lock = false;

/** Fetches servers with our current filters. */
export function fetchServers(filters = {}) {
    // If the fetch lock is on, return no action. The component will blindly call this.
    if (lock)
        return {
            type: 'NOWT'
        };

    lock = true;
    let url = new URI('/api/v1/servers');
    let params = filters;

    return (dispatch, getState) => {
        const state = getState();

        if (!state.servers.data.hasMore) {
            lock = false;
            return;
        }

        // Add filters -> params
        _.extend(params, _.pick(state.servers.data.filters, (value) => {
            return value ? true : false;
        }));

        // Set position
        if (state.servers.data.position)
            params.from = state.servers.data.position;

        fetch(url.query(params))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_SERVERS,
                servers: response.servers,
                total: response.total,
                players: response.players
            });

            lock = false;
        });
    };
}


/** Fetches a single servers most recent state. */
export function fetchServer(hash) {
    let url = new URI(`/api/v1/server/${hash}`);

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => dispatch({
            type: FETCH_SERVER,
            server: response
        }));
    };
}


/** Fetches all maps seen on this server. */
export function fetchServerMaps(hash) {
    let url = new URI(`/api/v1/server/${hash}/top/maps`);

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => dispatch({
            type: FETCH_SERVER_TOP_MAPS,
            maps: response.maps
        }));
    };
}


/** Fetch top players seen on a server. */
export function fetchServerPlayers(hash) {
    let url = new URI(`/api/v1/server/${hash}/top/players`);

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => dispatch({
            type: FETCH_SERVER_TOP_PLAYERS,
            players: response.players
        }));
    };
}


export function fetchServerPlayerHistory(hash, filters) {
    let url = new URI(`/api/v1/server/${hash}/history/players`);

    return dispatch => {
        fetch(url.query(filters))
        .then(response => response.json())
        .then(response => dispatch({
            type: FETCH_SERVER_PLAYER_HISTORY,
            players: response.players
        }));
    };
}

export function fetchServerPingHistory(hash, filters) {
    let url = new URI(`/api/v1/server/${hash}/history/pings`);

    return dispatch => {
        fetch(url.query(filters))
        .then(response => response.json())
        .then(response => dispatch({
            type: FETCH_SERVER_PING_HISTORY,
            pings: response.pings
        }));
    };
}
