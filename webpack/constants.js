// Source Server Stats
// File: webpack/constants.js
// Desc: constants!

// Shared between views
export const GRAPH_OPTIONS = {
    x_accessor: 'date',
    y_accessor: 'value',
    height: 200,
    full_width: true,
    right: 0,
    show_secondary_x_label: false
};

// Servers view
export const FILTER_SERVERS = 'FILTER_SERVERS';
export const FETCH_SERVERS = 'FETCH_SERVERS';
export const FETCH_SERVERS_MAPS = 'FETCH_SERVERS_MAPS';
export const FETCH_SERVERS_GAMES = 'FETCH_SERVERS_GAMES';

// Server view
export const FETCH_SERVER = 'FETCH_SERVER';
export const FETCH_SERVER_PLAYERS = 'FETCH_SERVER_PLAYERS';
export const FETCH_SERVER_HISTORY = 'FETCH_SERVER_HISTORY';
export const FETCH_SERVER_MAPS = 'FETCH_SERVER_MAPS';

// Maps view
export const FETCH_MAPS_MAPS = 'FETCH_MAPS';
export const FETCH_MAPS_GAMES = 'FETCH_GAMES';

// Map view
export const FETCH_MAP = 'FETCH_MAP';
export const FETCH_MAP_HISTORY = 'FETCH_MAP_HISTORY';

// Games view
export const FETCH_GAMES_GAMES = 'FETCH_GAMES_GAMES';

// Game view
export const FETCH_GAME = 'FETCH_GAME';
export const FETCH_GAME_HISTORY = 'FETCH_GAME_HISTORY';
