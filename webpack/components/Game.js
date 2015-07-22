// Source Server Stats
// File: webpack/components/Game.js
// Desc: the single game view

import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'redux/react';
import MG from 'metrics-graphics';

import * as constants from '../constants';
import * as actions from '../actions/game';


class Game extends React.Component {
    static PropTypes = {
        fetchGame: PropTypes.func.isRequired,
        fetchGameHistory: PropTypes.func.isRequired
    }

    componentDidMount() {
        this.props.fetchGame(this.props.gameId);
        this.props.fetchGameHistory(this.props.gameId);
    }

    componentDidUpdate() {
        if (this.props.history.length > 0) {
            const playerPoints = [];

            _.each(this.props.history, (value) => {
                playerPoints.push({
                    date: new Date(value.datetime),
                    value: value.players
                });
            });

            MG.data_graphic(_.extend(_.clone(constants.GRAPH_OPTIONS), {
                data: playerPoints,
                target: '#player-graph'
            }));
        }
    }

    render() {
        const { game } = this.props;

        return (<div id='game' className='content page'>
            <h2>{game.name}</h2>

            <div className='info'>
                About this game?
            </div>

            <div className='history'>
                <h3>Player History</h3>
                <div id='player-graph' className='graph'></div>
            </div>
        </div>);
    }
}


@connect(state => ({
    game: state.game.game,
    history: state.game.history
}))
export class GameContainer extends React.Component {
    render() {
        const { game, history, dispatch, params } = this.props;

        return <Game
            game={game}
            history={history}
            gameId={params.game_id}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
