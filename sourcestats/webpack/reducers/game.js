// Source Server Stats
// File: webpack/stores/game.js
// Desc: flux store for a game

import * as constants from '../constants';

const initialState = {
    game: {},
    history: []
};


export function game(state = initialState, action) {
    switch (action.type) {
        case constants.FETCH_GAME:
            state.game = action.game;
            break;

        case constants.FETCH_GAME_HISTORY:
            state.history = action.history;
            break;
    }

    return state;
}
