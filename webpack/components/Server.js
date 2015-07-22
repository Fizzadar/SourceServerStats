// Source Server Stats
// File: webpack/components/Server.js
// Desc: the single server view

import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'redux/react';
import { Link } from 'react-router';
import MG from 'metrics-graphics';

import * as constants from '../constants';
import * as actions from '../actions/server';


class Server extends React.Component {
    static PropTypes = {
        fetchServer: PropTypes.func.isRequired,
        fetchServerMaps: PropTypes.func.isRequired,
        fetchServerHistory: PropTypes.func.isRequired
    }

    componentDidMount() {
        this.props.fetchServer(this.props.hash);
        this.props.fetchServerMaps(this.props.hash);
        this.props.fetchServerHistory(this.props.hash);
    }

    componentDidUpdate() {
        if (this.props.history.length > 0) {
            const playerPoints = [];
            const pingPoints = [];

            _.each(this.props.history, (value) => {
                const date = new Date(value.datetime);

                playerPoints.push({
                    date: date,
                    value: value.players
                });

                pingPoints.push({
                    date: date,
                    value: value.ping
                });
            });

            MG.data_graphic(_.extend(_.clone(constants.GRAPH_OPTIONS), {
                data: playerPoints,
                target: '#player-graph'
            }));

            MG.data_graphic(_.extend(_.clone(constants.GRAPH_OPTIONS), {
                data: pingPoints,
                target: '#ping-graph'
            }));
        }
    }

    render() {
        const { server, maps } = this.props;

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

                <ul className='players split'>
                    <li className='title'>Current players</li>
                    {server.players.map(player => <li key={player.name}>{player.name}</li>)}
                </ul>

                <ul className='maps split'>
                    <li className='title'>Maps seen on this server</li>
                    {maps.map(map => <li key={map}>
                        <Link to={`/map/${map}`}>{map}</Link>
                    </li>)}
                </ul>
            </div>

            <div className='history'>
                <h3>Player History</h3>
                <div id='player-graph' className='graph'></div>

                <h3>Ping History</h3>
                <div id='ping-graph' className='graph'></div>
            </div>
        </div>);
    }
}


@connect(state => ({
    server: state.server.server,
    maps: state.server.maps,
    history: state.server.history
}))
export class ServerContainer extends React.Component {
    render() {
        const { server, maps, history, dispatch, params } = this.props;

        return <Server
            server={server}
            maps={maps}
            history={history}
            hash={params.hash}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
