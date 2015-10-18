// Source Server Stats
// File: sourcestats/webpack/actions/maps.js
// Desc: actions for the maps list

import 'whatwg-fetch';
import URI from 'URIjs';

export const FETCH_MAPS = 'FETCH_MAPS';
export const FETCH_MAP = 'FETCH_MAP';
export const FETCH_MAP_PLAYER_HISTORY = 'FETCH_MAP_PLAYER_HISTORY';


/** Fetches maps with a game filter. */
export function fetchMaps(gameId = null) {
    let url = new URI('/api/v1/maps');
    let params = {
        size: 0
    };

    if (gameId)
        params.game_id = gameId;

    return dispatch => {
        fetch(url.query(params))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_MAPS,
                maps: response.maps,
                total: response.total,
                gameId: gameId
            });
        });
    };
}


/** Fetches details for a single map. */
export function fetchMap(name) {
    let url = new URI(`/api/v1/map/${name}`);

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_MAP,
                map: response
            });
        });
    };
}


/** Fetches a date histogram of player counts for a single map. */
export function fetchMapPlayerHistory(name, filters) {
    let url = new URI(`/api/v1/map/${name}/history/players`);

    return dispatch => {
        fetch(url.query(filters))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_MAP_PLAYER_HISTORY,
                players: response.players
            });
        });
    };
}
