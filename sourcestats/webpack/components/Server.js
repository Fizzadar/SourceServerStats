// Source Server Stats
// File: sourcestats/webpack/components/Server.js
// Desc: the single server view

import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import * as actions from '../actions/servers';

import Graph from './shared/Graph';


class Server extends React.Component {
    static PropTypes = {
        fetchServer: PropTypes.func.isRequired,
        fetchServerMaps: PropTypes.func.isRequired,
        fetchServerPlayers: PropTypes.func.isRequired,
        fetchServerPingHistory: PropTypes.func.isRequired,
        fetchServerPlayerHistory: PropTypes.func.isRequired
    }

    componentDidMount() {
        this.props.fetchServer(this.props.hash);
        this.props.fetchServerMaps(this.props.hash);
    }

    render() {
        const { server, topMaps, playerHistory, pingHistory } = this.props.data;

        return (<div id='server' className='content page'>
            <h2>{server.name}</h2>

            <div className='info'>
                <ul>
                    <li><strong>Address:</strong> {server.host}:{server.port} (
                        <a className='green' href={`steam://connect/${server.host}:${server.port}`}>connect</a>
                    )</li>
                    <li><strong>Players:</strong> {server.player_count}/{server.max_players}</li>
                    <li>
                        <strong>Game:</strong> {server.game_id > 0 ? <span>
                            <Link to={`/game/${server.game_id}`}>
                                {server.game}
                            </Link>{server.game === server.gamemode ? '' : ': ' + server.gamemode}
                        </span> : server.gamemode}
                    </li>
                    <li>
                        <strong>Map:</strong> <Link to={`/map/${server.map}`}>{server.map}</Link>
                    </li>
                </ul>

                <ul className='maps split'>
                    <li className='title'>Top maps</li>
                    {topMaps.map(map => <li key={map}>
                        <Link to={`/map/${map}`}>{map}</Link>
                    </li>)}
                </ul>

                <ul className='players split'>
                    <li className='title'>Current players</li>
                    {server.players.map(player => <li key={player.name}>{player.name}</li>)}
                </ul>
            </div>

            <div className='history'>
                <Graph
                    title='Player count / time'
                    data={playerHistory}
                    fetch={filters => {
                        this.props.fetchServerPlayerHistory(this.props.hash, filters);
                    }}
                />

                <Graph
                    title='Ping count / time'
                    data={pingHistory}
                    fetch={filters => {
                        this.props.fetchServerPingHistory(this.props.hash, filters);
                    }}
                />
            </div>
        </div>);
    }
}


@connect(state => ({
    data: state.server.data,
    update: state.server.update
}))
export class ServerContainer extends React.Component {
    render() {
        const { data, update, dispatch, params } = this.props;

        return <Server
            data={data}
            update={update}
            hash={params.hash}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
