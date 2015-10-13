/// Source Server Stats
// File: webpack/components/Servers.js
// Desc: the servers list/table

import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Select from 'react-select';

import { timeAgo } from '../util';
import * as actions from '../actions/servers';

const body = document.body;
const html = document.documentElement;


class Servers extends React.Component {
    loopLock = false
    searchBackoff = null
    serverFilters = {}

    static PropTypes = {
        filterServers: PropTypes.func.isRequired,
        fetchServers: PropTypes.func.isRequired,
        fetchGames: PropTypes.func.isRequired
    }

    static contextTypes = {
        router: PropTypes.object
    }

    componentDidMount() {
        let { query } = this.context.router.state.location;
        query = query || {};

        // Fetch games if needed
        if (this.props.games.length === 0)
            this.props.fetchGames();

        // Set the filters to the query
        this.serverFilters = query;
        this.filterServers();

        this.startLoop();
    }

    componentDidUpdate() {
        const { query } = this.context.router.state.location;

        if (query === null && _.keys(this.serverFilters).length > 0) {
            this.serverFilters = {};
            this.filterServers();
        }
    }

    startLoop() {
        this.loop = setInterval(() => {
            if (this.loopLock)
                return;

            const height = Math.max(
                body.scrollHeight, body.offsetHeight,
                html.clientHeight, html.scrollHeight, html.offsetHeight
            );

            if ((window.scrollY + window.innerHeight) >= (height - 200)) {
                this.props.fetchServers();
            }
        }, 100);
    }

    componentWillUnmount() {
        clearInterval(this.loop);
    }

    filterServers() {
        this.loopLock = true;
        this.props.filterServers(this.serverFilters);
    }

    debouncedFilterServers = _.debounce(() => this.filterServers(), 100);

    handleFilter(key, value) {
        if (value)
            this.serverFilters[key] = value;
        else
            delete this.serverFilters[key];

        this.context.router.transitionTo('/servers', _.pick(this.serverFilters, (v) => v));
        this.debouncedFilterServers();
    }

    handleSubmit(e) {
        e.preventDefault();
        this.filterServers();
    }

    render() {
        // Allows the scroll checker to run
        this.loopLock = false;

        let { query } = this.context.router.state.location;
        query = query || {};

        return (<div id='servers'>
            <form className='top-filters' onSubmit={::this.handleSubmit}>
                <Select
                    value={query.game_id}
                    placeholder='Filter by game...'
                    options={this.props.games.map((game) => {
                        return {
                            value: game[0][0].toString(),
                            label: game[0][1] + ' (' + game[1].toLocaleString() + ' servers)'
                        };
                    })}
                    onChange={(e) => this.handleFilter('game_id', e)}
                />

                <input
                    type='text'
                    placeholder='Search server names, games &amp; maps'
                    defaultValue={query.query}
                    onChange={(e) => this.handleFilter('query', e.target.value)}
                />

                <span className='right'>
                    Tracking <strong>{this.props.totalServers.toLocaleString()}</strong> servers with <strong>{this.props.totalPlayers.toLocaleString()}</strong> players
                </span>
            </form>

            <table cellSpacing='0'>
                <thead><tr>
                    <th>Seen</th>
                    <th>Name</th>
                    <th>Game</th>
                    <th>Map</th>
                    <th>Players</th>
                    <th>Ping</th>
                    <th width="100px"></th>
                </tr></thead>
                <tbody>
                    {this.props.servers.map((server, i) => (<tr key={i}>
                        <td>{timeAgo(server.datetime)}</td>
                        <td>
                            <Link to={`/server/${server.server_hash}`}>{server.name}</Link>
                        </td>
                        <td>
                            {server.game_id > 0 ? <span>
                                <Link to={`/game/${server.game_id}`}>
                                    {server.game}
                                </Link>{server.game === server.gamemode ? '' : ': ' + server.gamemode}
                            </span> : server.gamemode}
                        </td>
                        <td>
                            <Link to={`/map/${server.map}`}>{server.map}</Link>
                        </td>
                        <td>{server.player_count}/{server.max_players}</td>
                        <td>{Math.round(server.ping)}ms</td>
                        <td><a className='green' href={`steam://connect/${server.host}:${server.port}`}>
                            Connect &rarr;
                        </a></td>
                    </tr>))}
                </tbody>
            </table>
        </div>);
    }
}


@connect(state => ({
    servers: state.servers.servers,
    totalServers: state.servers.totalServers,
    totalPlayers: state.servers.totalPlayers,
    filters: state.servers.filters,
    games: state.servers.games
}))
export class ServersContainer extends React.Component {
    render() {
        const {
            servers, totalServers, totalPlayers,
            filters, games, dispatch
        } = this.props;

        return <Servers
            servers={servers}
            totalServers={totalServers}
            totalPlayers={totalPlayers}
            filters={filters}
            games={games}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
