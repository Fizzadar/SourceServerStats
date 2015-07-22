// Source Server Stats
// File: webpack/components/Maps.js
// Desc: the map list view

import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'redux/react';
import { Link } from 'react-router';
import Select from 'react-select';

import * as actions from '../actions/maps';


class Maps extends React.Component {
    static PropTypes = {
        fetchMaps: PropTypes.func.isRequired,
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
        this.props.fetchMaps(query.game_id);

        if (query.query)
            this.setState({
                nameFilter: query.query
            });
    }

    componentDidUpdate() {
        const { query } = this.context.router.state.location;

        if (query === null) {
            if (this.state.nameFilter.length > 0)
                this.setState({
                    nameFilter: ''
                });

            if (this.props.gameId)
                this.props.fetchMaps();
        }
    }

    updateQuery(key, value) {
        let { query } = this.context.router.state.location;
        query = query || {};

        if (value)
            query[key] = value;
        else if (query[key])
            delete query[key];

        this.context.router.transitionTo('/maps', query);
    }

    handleSearch(value) {
        this.setState({
            nameFilter: value
        });
        this.updateQuery('query', value);
    }

    handleGameFilter(value) {
        this.props.fetchMaps(value);
        this.updateQuery('game_id', value);
    }

    render() {
        // Work out the query
        let { query } = this.context.router.state.location;
        query = query || {};

        // Filter the maps
        const { maps } = this.props;
        const searchRegex = new RegExp(this.state.nameFilter, 'i');
        let filteredMaps = _.filter(maps, (map) => {
            return map[0].match(searchRegex);
        });

        // 500 maps maximum to avoid sluggish render
        if (filteredMaps.length > 500)
            filteredMaps = _.slice(filteredMaps, 0, 500);

        return (<div id='maps'>
            <form className='top-filters' onSubmit={null}>
                <Select
                    value={query.game_id}
                    placeholder='Filter by game...'
                    options={this.props.games.map((game) => {
                        return {
                            value: game[0][0].toString(),
                            label: game[0][1] + ' (' + game[1].toLocaleString() + ' servers)'
                        };
                    })}
                    onChange={(e) => this.handleGameFilter(e)}
                />

                <input
                    type='text'
                    placeholder='Search maps'
                    value={this.state.nameFilter}
                    onChange={(e) => this.handleSearch(e.target.value)}
                />

                <span className='right'>
                    Tracking <strong>{this.props.totalMaps.toLocaleString()}</strong> maps
                </span>
            </form>

            <div className='content'>
                <ul className='maps'>
                    {filteredMaps.map((map) => <li key={map[0]}>
                        <Link to={`/map/${map[0]}`}>{map[0]}</Link> (<Link className='servers-link' to={`/servers?map=${map[0]}`}>{map[1].toLocaleString()} servers</Link>)
                    </li>)}
                </ul>
            </div>
        </div>);
    }
}


@connect(state => ({
    maps: state.maps.maps,
    totalMaps: state.maps.totalMaps,
    games: state.maps.games,
    gameId: state.maps.gameId
}))
export class MapsContainer extends React.Component {
    render() {
        const { maps, totalMaps, games, gameId, dispatch } = this.props;

        return <Maps
            maps={maps}
            totalMaps={totalMaps}
            games={games}
            gameId={gameId}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
