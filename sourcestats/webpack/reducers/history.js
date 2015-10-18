// Source Server Stats
// File: sourcestats/webpack/reducers/history.js
// Desc: flux reducer for the global history view

import {
    FETCH_PLAYER_HISTORY,
    FETCH_SERVER_HISTORY
} from '../actions/history';

import { parseDates } from './util';

const initialHistoryState = {
    data: {
        serverHistory: [],
        playerHistory: []
    },
    update: 0
};


export function history(state = initialHistoryState, action) {
    let update = true;

    switch(action.type) {
        case FETCH_SERVER_HISTORY:
            state.data.serverHistory = parseDates(action.servers, 'servers');
            break;

        case FETCH_PLAYER_HISTORY:
            state.data.playerHistory = parseDates(action.players, 'players');
            break;

        default:
            update = false;
    }

    if (update)
        state.update++;

    return state;
}
