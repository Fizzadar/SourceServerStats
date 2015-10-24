// Source Server Stats
// File: sourcestats/webpack/components/Global.js
// Desc: global stats

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as actions from '../actions/history';

import { fetchGames } from '../actions/games';
actions.fetchGames = fetchGames;

import { fetchMaps } from '../actions/maps';
actions.fetchMaps = fetchMaps;

import { fetchServers } from '../actions/servers';
actions.fetchServers = fetchServers;

import Graph from './shared/Graph';


class Global extends React.Component {
    static PropTypes = {
        fetchServerHistory: PropTypes.func.isRequired,
        fetchPlayerHistory: PropTypes.func.isRequired,
        fetchGames: PropTypes.func.isRequired,
        fetchMaps: PropTypes.func.isRequired,
        fetchServers: PropTypes.func.isRequired
    }

    componentDidMount() {
        this.props.fetchGames({size: 1});
        this.props.fetchMaps({size: 1});
        this.props.fetchServers({size: 0});
    }

    render() {
        const {
            playerHistory, serverHistory,
            totalMaps, totalGames, totalServers, totalPlayers
        } = this.props.data;

        return (<div id='global' className='content page'>
            <h2>Global Stats</h2>

            <div className='info'>
                <ul>
                    <li><strong>{totalServers.toLocaleString()}</strong> servers</li>
                    <li><strong>{totalPlayers.toLocaleString()}</strong> players</li>
                    <li><strong>{totalMaps.toLocaleString()}</strong> maps</li>
                    <li><strong>{totalGames.toLocaleString()}</strong> games</li>
                </ul>
            </div>

            <div className='history'>
                <Graph
                    title='Player count / time'
                    data={playerHistory}
                    fetch={this.props.fetchPlayerHistory}
                />

                <Graph
                    title='Server count / time'
                    data={serverHistory}
                    fetch={this.props.fetchServerHistory}
                />
            </div>
        </div>);
    }
}


@connect(state => ({
    data: state.global.data,
    update: state.global.update
}))
export class GlobalContainer extends React.Component {
    render() {
        const { data, update, dispatch } = this.props;

        return <Global
            data={data}
            update={update}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
