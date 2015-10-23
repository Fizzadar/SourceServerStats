// Source Server Stats
// File: sourcestats/webpack/stores/maps.js
// Desc: flux store for the maps view

import {
    FETCH_MAPS, FETCH_MAP,
    FETCH_MAP_PLAYER_HISTORY
} from '../actions/maps';
import { FETCH_GAMES } from '../actions/games';

import { parseDates } from '../util';

const initialMapsState = {
    data: {
        maps: [],
        totalMaps: 0,
        gameId: null,
        games: []
    },
    update: 0
};

const initialMapState = {
    data: {
        map: {
            games: []
        },
        playerHistory: []
    },
    update: []
};


export function maps(state = initialMapsState, action) {
    let update = true;

    switch (action.type) {
        case FETCH_MAPS:
            state.data.maps = action.maps;
            state.data.totalMaps = action.total;
            break;

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


export function map(state = initialMapState, action) {
    let update = true;

    switch (action.type) {
        case FETCH_MAP:
            state.data.map = action.map;
            break;

        case FETCH_MAP_PLAYER_HISTORY:
            state.data.playerHistory = parseDates(action.players, 'player_count');
            break;

        default:
            update = false;
    }

    if (update)
        state.update++;

    return state;
}
