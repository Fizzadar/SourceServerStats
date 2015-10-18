// Source Server Stats
// File: sourcestats/webpack/components/Map.js
// Desc: the single map view

import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import * as actions from '../actions/maps';

import Graph from './shared/Graph';


class Map extends React.Component {
    static PropTypes = {
        fetchMap: PropTypes.func.isRequired,
        fetchMapPlayerHistory: PropTypes.func.isRequired
    }

    componentDidMount() {
        this.props.fetchMap(this.props.name);
    }

    render() {
        const { map, playerHistory } = this.props.data;

        return (<div id='map' className='content page'>
            <h2>{map.name}</h2>

            <div className='info'>
                <ul className='split'>
                    <li className='title'>{map.games.length.toLocaleString()} games this map has appeared in</li>
                    {map.games.map(game => <li key={game}>
                        <Link to={`/game/${game[0][0]}`}>
                            {game[0][1]}
                        </Link>
                    </li>)}
                </ul>
            </div>

            <div className='history'>
                <Graph
                    title='Player count / time'
                    data={playerHistory}
                    fetch={filters => {
                        this.props.fetchMapPlayerHistory(this.props.name, filters);
                    }}
                />
            </div>
        </div>);
    }
}


@connect(state => ({
    data: state.map.data,
    update: state.map.update
}))
export class MapContainer extends React.Component {
    render() {
        const { data, update, dispatch, params } = this.props;

        return <Map
            data={data}
            update={update}
            name={params.map}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
