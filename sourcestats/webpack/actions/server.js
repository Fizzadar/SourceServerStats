// Source Server Stats
// File: webpack/actions/server.js
// Desc: single server actions

import * as constants from '../constants.js';


/** Fetches a single servers most recent state. */
export function fetchServer(hash) {
    let url = '/api/v1/server/' + hash;

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => dispatch({
            type: constants.FETCH_SERVER,
            server: response
        }));
    };
}


/** Fetches all maps seen on this server. */
export function fetchServerMaps(hash) {
    let url = '/api/v1/server/' + hash + '/history/maps';

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => dispatch({
            type: constants.FETCH_SERVER_MAPS,
            maps: response.maps
        }));
    };
}


/** Fetch all players seen on a server. */
export function fetchServerPlayers(hash) {
    let url = '/api/v1/server/' + hash + '/history/players';

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => dispatch({
            type: constants.FETCH_SERVER_PLAYERS,
            players: response.players
        }));
    };
}


/** Fetch a histogram of (players, ping) for this server. */
export function fetchServerHistory(hash) {
    let url = '/api/v1/server/' + hash + '/history';

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => dispatch({
            type: constants.FETCH_SERVER_HISTORY,
            history: response.history
        }));
    };
}
