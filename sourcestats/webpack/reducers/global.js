// Source Server Stats
// File: sourcestats/webpack/reducers/history.js
// Desc: flux reducer for the global history view

import {
    FETCH_PLAYER_HISTORY,
    FETCH_SERVER_HISTORY
} from '../actions/history';

import { FETCH_MAPS } from '../actions/maps';
import { FETCH_GAMES } from '../actions/games';
import { FETCH_SERVERS } from '../actions/servers';

import { parseDates } from './util';

const initialHistoryState = {
    data: {
        serverHistory: [],
        playerHistory: [],
        totalMaps: 0,
        totalGames: 0,
        totalServers: 0,
        totalPlayers: 0
    },
    update: 0
};


export function global(state = initialHistoryState, action) {
    let update = true;

    switch(action.type) {
        case FETCH_SERVER_HISTORY:
            state.data.serverHistory = parseDates(action.servers, 'servers');
            break;

        case FETCH_PLAYER_HISTORY:
            state.data.playerHistory = parseDates(action.players, 'players');
            break;

        case FETCH_MAPS:
            state.data.totalMaps = action.total;
            break;

        case FETCH_GAMES:
            state.data.totalGames = action.total;
            break;

        case FETCH_SERVERS:
            state.data.totalServers = action.total;
            state.data.totalPlayers = action.players;
            break;

        default:
            update = false;
    }

    if (update)
        state.update++;

    return state;
}
