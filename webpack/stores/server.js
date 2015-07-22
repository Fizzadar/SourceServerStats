// Source Server Stats
// File: webpack/stores/server.js
// Desc: flux store for a server

import * as constants from '../constants';

const initialState = {
    server: {
        players: []
    },
    maps: [],
    players: [],
    history: []
};


export function server(state = initialState, action) {
    switch (action.type) {
        case constants.FETCH_SERVER:
            state.server = action.server;
            break;

        case constants.FETCH_SERVER_MAPS:
            state.maps = action.maps;
            break;

        case constants.FETCH_SERVER_PLAYERS:
            state.players = action.players;
            break;

        case constants.FETCH_SERVER_HISTORY:
            state.history = action.history;
            break;
    }

    return state;
}
