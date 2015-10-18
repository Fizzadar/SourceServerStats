// Source Server Stats
// File: sourcestats/webpack/actions/games.js
// Desc: actions for the games list

import 'whatwg-fetch';
import URI from 'URIjs';

export const FETCH_GAMES = 'FETCH_GAMES';
export const FETCH_GAME = 'FETCH_GAME';
export const FETCH_GAME_TOP_MAPS = 'FETCH_GAME_TOP_MAPS';
export const FETCH_GAME_PLAYER_HISTORY = 'FETCH_GAME_PLAYER_HISTORY';


/** Fetches the full list of games. */
export function fetchGames(filters = {}) {
    const url = new URI('/api/v1/games');

    return dispatch => {
        fetch(url.query(filters))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_GAMES,
                games: response.games,
                total: response.total
            });
        });
    };
}

/** Fetches details for a single game. */
export function fetchGame(gameId) {
    const url = new URI(`/api/v1/game/${gameId}`);

    return dispatch => {
        fetch(url)
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_GAME,
                game: response
            });
        });
    };
}


/** Fetches all maps seen on this server. */
export function fetchGameMaps(gameId, filters ={}) {
    const url = new URI(`/api/v1/game/${gameId}/top/maps`);

    return dispatch => {
        fetch(url.query(filters))
        .then(response => response.json())
        .then(response => dispatch({
            type: FETCH_GAME_TOP_MAPS,
            maps: response.maps,
            total: response.total
        }));
    };
}


/** Fetches a date histogram of player counts for a single game. */
export function fetchGamePlayerHistory(gameId, filters = {}) {
    const url = new URI(`/api/v1/game/${gameId}/history/players`);

    return dispatch => {
        fetch(url.query(filters))
        .then(response => response.json())
        .then(response => {
            dispatch({
                type: FETCH_GAME_PLAYER_HISTORY,
                players: response.players
            });
        });
    };
}
