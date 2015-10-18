// Source Server Stats
// File: sourcestats/webpack/actions/maps.js
// Desc: actions for the maps list

import 'whatwg-fetch';
import URI from 'URIjs';

export const FETCH_MAPS = 'FETCH_MAPS';
export const FETCH_MAP = 'FETCH_MAP';
export const FETCH_MAP_PLAYER_HISTORY = 'FETCH_MAP_PLAYER_HISTORY';


export function fetchMaps(filters = {}) {
    const url = new URI('/api/v1/maps');

    return dispatch => {
        fetch(url.query(filters))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_MAPS,
                maps: response.maps,
                total: response.total
            });
        });
    };
}


export function fetchMap(name) {
    const url = new URI(`/api/v1/map/${name}`);

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


export function fetchMapPlayerHistory(name, filters) {
    const url = new URI(`/api/v1/map/${name}/history/players`);

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
