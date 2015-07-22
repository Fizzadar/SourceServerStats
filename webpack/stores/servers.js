// Source Server Stats
// File: webpack/stores/servers.js
// Desc: flux store for the servers index

import _ from 'lodash';

import * as constants from '../constants';

const initialState = {
    servers: [],
    totalServers: 0,
    totalPlayers: 0,
    filters: {},
    games: [],
    position: 0,
    hasMore: true
};


export function servers(state = initialState, action) {
    switch (action.type) {
        // Receives servers
        case constants.FETCH_SERVERS:
            let length = action.servers.length;
            state.position += length;
            state.servers = state.servers.concat(action.servers);
            state.totalServers = action.total;
            state.totalPlayers = action.players;

            if (length === 0)
                state.hasMore = false;

            break;

        // Receives filter updates
        case constants.FILTER_SERVERS:
            // Clear the servers if we're changing filters
            if (!_.isEqual(state.filters, action.filters)) {
                state.servers = [];
                state.position = 0;
                state.hasMore = true;
            }

            state.filters = action.filters;
            break;

        // Receives the game list
        case constants.FETCH_SERVERS_GAMES:
            state.games = action.games;
            break;
    }

    return state;
}
