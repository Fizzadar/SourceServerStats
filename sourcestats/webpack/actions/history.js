// Source Server Stats
// File: sourcestats/webpack/actions/history.js
// Desc: actions for global stats

import 'whatwg-fetch';
import URI from 'URIjs';

export const FETCH_PLAYER_HISTORY = 'FETCH_PLAYER_HISTORY';
export const FETCH_SERVER_HISTORY = 'FETCH_SERVER_HISTORY';


export function fetchServerHistory(filters) {
    let url = new URI('/api/v1/history/servers');

    return dispatch => {
        fetch(url.query(filters))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_SERVER_HISTORY,
                servers: response.servers
            });
        });
    };
}


export function fetchPlayerHistory(filters) {
    let url = new URI('/api/v1/history/players');

    return dispatch => {
        fetch(url.query(filters))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_PLAYER_HISTORY,
                players: response.players
            });
        });
    };
}
