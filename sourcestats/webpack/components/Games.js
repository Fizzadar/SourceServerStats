// Source Server Stats
// File: webpack/components/Games.js
// Desc: the game list view

import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import * as actions from '../actions/games';


class Games extends React.Component {
    static PropTypes = {
        fetchGames: PropTypes.func.isRequired
    }

    static contextTypes = {
        router: PropTypes.object
    }

    state = {
        nameFilter: ''
    }

    componentDidMount() {
        let { query } = this.context.router.state.location;
        query = query || {};

        this.props.fetchGames();

        if (query.query)
            this.setState({
                nameFilter: query.query
            });
    }

    componentDidUpdate() {
        const { query } = this.context.router.state.location;

        if (query === null)
            if (this.state.nameFilter.length > 0)
                this.setState({
                    nameFilter: ''
                });
    }

    updateQuery(key, value) {
        let { query } = this.context.router.state.location;
        query = query || {};

        if (value)
            query[key] = value;
        else if (query[key])
            delete query[key];

        this.context.router.transitionTo('/games', query);
    }

    handleSearch(value) {
        this.setState({
            nameFilter: value
        });
        this.updateQuery('query', value);
    }

    render() {
        // Work out the query
        let { query } = this.context.router.state.location;
        query = query || {};

        // Filter the games
        const { games } = this.props;
        const searchRegex = new RegExp(this.state.nameFilter, 'i');
        let filteredGames = _.filter(games, (game) => {
            return game[0][1].match(searchRegex);
        });

        // 500 games maximum to avoid sluggish render
        if (filteredGames.length > 500)
            filteredGames = _.slice(filteredGames, 0, 500);

        return (<div id='games'>
            <form className='top-filters' onSubmit={null}>
                <input
                    type='text'
                    placeholder='Search games'
                    value={this.state.nameFilter}
                    onChange={(e) => this.handleSearch(e.target.value)}
                />

                <span className='right'>
                    Tracking <strong>{this.props.totalGames.toLocaleString()}</strong> games
                </span>
            </form>

            <div className='content'>
                <ul className='games'>
                    {filteredGames.map((game) => <li key={game[0]}>
                        <Link to={`/game/${game[0][0]}`}>{game[0][1]}</Link> (<Link className='servers-link' to={`/servers?game_id=${game[0][0]}`}>{game[1].toLocaleString()} servers</Link>)
                    </li>)}
                </ul>
            </div>
        </div>);
    }
}


@connect(state => ({
    games: state.games.games,
    totalGames: state.games.totalGames
}))
export class GamesContainer extends React.Component {
    render() {
        const { games, totalGames, dispatch } = this.props;

        return <Games
            games={games}
            totalGames={totalGames}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
