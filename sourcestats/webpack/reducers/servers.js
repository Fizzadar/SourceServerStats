// Source Server Stats
// File: sourcestats/webpack/reducers/server.js
// Desc: flux reducer for a server

import _ from 'lodash';

import {
    FETCH_SERVER,
    FETCH_SERVER_TOP_MAPS, FETCH_SERVER_TOP_PLAYERS,
    FETCH_SERVER_PLAYER_HISTORY, FETCH_SERVER_PING_HISTORY,
    FETCH_SERVERS, FILTER_SERVERS
} from '../actions/servers';
import { FETCH_GAMES } from '../actions/games';

import { parseDates } from '../util';

const initialServerState = {
    data: {
        server: {
            players: []
        },
        topMaps: [],
        topPlayers: [],
        playerHistory: [],
        pingHistory: []
    },
    update: 0
};

const initialServersState = {
    data: {
        servers: [],
        totalServers: 0,
        totalPlayers: 0,
        filters: {},
        games: [],
        position: 0,
        hasMore: true
    },
    update: 0
};


export function server(state = initialServerState, action) {
    let update = true;

    switch (action.type) {
        case FETCH_SERVER:
            state.data.server = action.server;
            break;

        case FETCH_SERVER_TOP_MAPS:
            state.data.topMaps = action.maps;
            break;

        case FETCH_SERVER_TOP_PLAYERS:
            state.data.topPlayers = action.players;
            break;

        case FETCH_SERVER_PLAYER_HISTORY:
            state.data.playerHistory = parseDates(action.players, 'player_count');
            break;

        case FETCH_SERVER_PING_HISTORY:
            state.data.pingHistory = parseDates(action.pings, 'ping');
            break;

        default:
            update = false;
    }

    if (update)
        state.update++;

    return state;
}


export function servers(state = initialServersState, action) {
    let update = true;

    switch (action.type) {
        // Receives servers
        case FETCH_SERVERS:
            let length = action.servers.length;
            state.data.position += length;
            state.data.servers = state.data.servers.concat(action.servers);
            state.data.totalServers = action.total;
            state.data.totalPlayers = action.players;

            if (length === 0)
                state.data.hasMore = false;

            break;

        // Receives filter updates
        case FILTER_SERVERS:
            // Clear the servers if we're changing filters
            if (!_.isEqual(state.data.filters, action.filters)) {
                state.data.servers = [];
                state.data.position = 0;
                state.data.hasMore = true;
            }

            state.data.filters = action.filters;
            break;

        // Receives the game list
        case FETCH_GAMES:
            state.data.games = action.games;
            break;

        default:
            update = false;
    }

    if (update)
        state.update++;

    return state;
}
