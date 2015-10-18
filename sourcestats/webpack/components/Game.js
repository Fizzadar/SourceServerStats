// Source Server Stats
// File: sourcestats/webpack/components/Game.js
// Desc: the single game view

import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as actions from '../actions/games';

import Graph from './shared/Graph';


class Game extends React.Component {
    static PropTypes = {
        fetchGame: PropTypes.func.isRequired,
        fetchGamePlayerHistory: PropTypes.func.isRequired
    }

    componentDidMount() {
        this.props.fetchGame(this.props.gameId);
    }

    render() {
        const { game, playerHistory } = this.props.data;

        return (<div id='game' className='content page'>
            <h2>{game.name}</h2>

            <div className='info'>
                About this game?
            </div>

            <div className='history'>
                <Graph
                    title='Player history'
                    data={playerHistory}
                    fetch={filters => {
                        this.props.fetchGamePlayerHistory(this.props.gameId, filters);
                    }}
                />
            </div>
        </div>);
    }
}


@connect(state => ({
    data: state.game.data,
    update: state.game.update
}))
export class GameContainer extends React.Component {
    render() {
        const { data, update, dispatch, params } = this.props;

        return <Game
            data={data}
            update={update}
            gameId={params.game_id}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
