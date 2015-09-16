// Source Server Stats
// File: webpack/actions/games.js
// Desc: actions for the games list

import 'whatwg-fetch';
import URI from 'URIjs';

import * as constants from '../constants';


/** Fetches the full list of games. */
export function fetchGames() {
    let url = new URI('/api/v1/games');

    return (dispatch) => {
        fetch(url)
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: constants.FETCH_GAMES_GAMES,
                games: response.games,
                total: response.total
            });
        });
    };
}
