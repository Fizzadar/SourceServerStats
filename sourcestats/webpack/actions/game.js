// Source Server Stats
// File: webpack/actions/game.js
// Desc: actions for single games

import 'whatwg-fetch';
import URI from 'URIjs';

import * as constants from '../constants';


/** Fetches details for a single game. */
export function fetchGame(gameId) {
    let url = new URI('/api/v1/game/' + gameId);

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: constants.FETCH_GAME,
                game: response
            });
        });
    };
}


/** Fetches a date histogram of player counts for a single game. */
export function fetchGameHistory(gameId) {
    let url = new URI('/api/v1/game/' + gameId + '/history');

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: constants.FETCH_GAME_HISTORY,
                history: response.history
            });
        });
    };
}
