// Source Server Stats
// File: sourcestats/webpack/components/Game.js
// Desc: the single game view

import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import * as actions from '../actions/games';

import Graph from './shared/Graph';


class Game extends React.Component {
    static PropTypes = {
        fetchGame: PropTypes.func.isRequired,
        fetchGameMaps: PropTypes.func.isRequired,
        fetchGamePlayerHistory: PropTypes.func.isRequired
    }

    state = {
        all: false
    }

    componentDidMount() {
        this.props.fetchGame(this.props.gameId);
        this.props.fetchGameMaps(this.props.gameId);
    }

    getAllMaps() {
        this.setState({
            all: true
        });

        this.props.fetchGameMaps(this.props.gameId, {size: 0});
    }

    render() {
        const { game, maps, totalMaps, playerHistory } = this.props.data;

        const showAll = this.state.all ? '' :
            <a className='all' onClick={() => { this.getAllMaps(); }}>
                Show all &darr;
            </a>;

        return (<div id='game' className='content page'>
            <h2>{game.name}</h2>

            <div className='info'>
                <ul className='split'>
                    <li className='title'>{totalMaps.toLocaleString()} maps used with this game</li>

                    {maps.map(name => <li key={name}>
                        <Link to={`/map/${name}`}>
                            {name}
                        </Link>
                    </li>)}
                </ul>

                {showAll}
            </div>

            <div className='history'>
                <Graph
                    title='Player count / time'
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
