// Source Server Stats
// File: webpack/stores/games.js
// Desc: flux store for the games view

import * as constants from '../constants';

const initialState = {
    games: [],
    totalGames: 0
};


export function games(state = initialState, action) {
    switch (action.type) {
        case constants.FETCH_GAMES_GAMES:
            state.games = action.games;
            state.totalGames = action.total;
            break;
    }

    return state;
}
