// Source Server Stats
// File: webpack/actions/map.js
// Desc: actions for single maps

import 'whatwg-fetch';
import URI from 'URIjs';

import * as constants from '../constants';


/** Fetches details for a single map. */
export function fetchMap(name) {
    let url = new URI('/api/v1/map/' + name);

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: constants.FETCH_MAP,
                map: response
            });
        });
    };
}


/** Fetches a date histogram of player counts for a single map. */
export function fetchMapHistory(name) {
    let url = new URI('/api/v1/map/' + name + '/history');

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: constants.FETCH_MAP_HISTORY,
                history: response.history
            });
        });
    };
}
