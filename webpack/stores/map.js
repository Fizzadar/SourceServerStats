// Source Server Stats
// File: webpack/stores/map.js
// Desc: flux store for a map

import * as constants from '../constants';

const initialState = {
    map: {
        games: []
    },
    history: []
};


export function map(state = initialState, action) {
    switch (action.type) {
        case constants.FETCH_MAP:
            state.map = action.map;
            break;

        case constants.FETCH_MAP_HISTORY:
            state.history = action.history;
            break;
    }

    return state;
}
