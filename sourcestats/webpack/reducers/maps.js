// Source Server Stats
// File: webpack/stores/maps.js
// Desc: flux store for the maps view

import * as constants from '../constants';

const initialState = {
    maps: [],
    totalMaps: 0,
    gameId: null,
    games: []
};


export function maps(state = initialState, action) {
    switch (action.type) {
        case constants.FETCH_MAPS_MAPS:
            state.maps = action.maps;
            state.totalMaps = action.total;
            state.gameId = action.gameId;
            break;

        case constants.FETCH_MAPS_GAMES:
            state.games = action.games;
            break;
    }

    return state;
}
