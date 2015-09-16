// Source Server Stats
// File: webpack/actions/maps.js
// Desc: actions for the maps list

import 'whatwg-fetch';
import URI from 'URIjs';

import * as constants from '../constants';


/** Fetches maps with a game filter. */
export function fetchMaps(gameId = null) {
    let url = new URI('/api/v1/maps');
    let params = {
        size: 0
    };

    if (gameId)
        params.game_id = gameId;

    return (dispatch) => {
        fetch(url.query(params))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: constants.FETCH_MAPS_MAPS,
                maps: response.maps,
                total: response.total,
                gameId: gameId
            });
        });
    };
}


/** Fetches the full list of games. */
export function fetchGames() {
    let url = new URI('/api/v1/games');

    return (dispatch) => {
        fetch(url)
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: constants.FETCH_MAPS_GAMES,
                games: response.games
            });
        });
    };
}
