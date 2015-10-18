// Source Server Stats
// File: sourcestats/webpack/stores/games.js
// Desc: flux store for the games view

import {
    FETCH_GAMES, FETCH_GAME,
    FETCH_GAME_TOP_MAPS,
    FETCH_GAME_PLAYER_HISTORY
} from '../actions/games';

import { parseDates } from './util';

const initialGamesState = {
    data: {
        games: [],
        totalGames: 0
    },
    update: 0
};

const initialGameState = {
    data: {
        game: {},
        maps: [],
        totalMaps: 0,
        playerHistory: []
    },
    update: 0
};


export function games(state = initialGamesState, action) {
    let update = true;

    switch (action.type) {
        case FETCH_GAMES:
            state.data.games = action.games;
            state.data.totalGames = action.total;
            break;

        default:
            update = false;
    }

    if (update)
        state.update++;

    return state;
}


export function game(state = initialGameState, action) {
    let update = true;

    switch (action.type) {
        case FETCH_GAME:
            state.data.game = action.game;
            break;

        case FETCH_GAME_PLAYER_HISTORY:
            state.data.playerHistory = parseDates(action.players, 'players');
            break;

        case FETCH_GAME_TOP_MAPS:
            state.data.maps = action.maps;
            state.data.totalMaps = action.total;
            break;

        default:
            update = false;
    }

    if (update)
        state.update++;

    return state;
}
