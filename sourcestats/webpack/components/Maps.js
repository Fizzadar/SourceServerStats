// Source Server Stats
// File: sourcestats/webpack/components/Maps.js
// Desc: the map list view

import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Select from 'react-select';

import * as actions from '../actions/maps';

import { fetchGames } from '../actions/games';
actions.fetchGames = fetchGames;


class Maps extends React.Component {
    static PropTypes = {
        fetchMaps: PropTypes.func.isRequired,
        fetchGames: PropTypes.func.isRequired
    }

    static contextTypes = {
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
    }

    state = {
        nameFilter: ''
    }

    componentDidMount() {
        let { query } = this.context.location;
        query = query || {};

        this.props.fetchGames();
        this.props.fetchMaps(query.game_id);

        if (query.query)
            this.setState({
                nameFilter: query.query
            });
    }

    componentDidUpdate() {
        const { query } = this.context.location;

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
        let { query, pathname } = this.context.location;
        query = query || {};

        if (value)
            query[key] = value;
        else if (query[key])
            delete query[key];

        this.context.history.pushState(null, pathname, query);
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
        let { query } = this.context.location;
        query = query || {};

        // Filter the maps
        const { maps, totalMaps, games } = this.props.data;
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
                    options={games.map((game) => {
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
                    Tracking <strong>{totalMaps.toLocaleString()}</strong> maps
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
    data: state.maps.data,
    update: state.maps.update
}))
export class MapsContainer extends React.Component {
    render() {
        const { data, update, dispatch } = this.props;

        return <Maps
            data={data}
            update={update}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
