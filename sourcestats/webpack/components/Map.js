// Source Server Stats
// File: webpack/components/Map.js
// Desc: the single map view

import _ from 'lodash';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'redux/react';
import { Link } from 'react-router';
import MG from 'metrics-graphics';

import * as constants from '../constants';
import * as actions from '../actions/map';


class Map extends React.Component {
    static PropTypes = {
        fetchMap: PropTypes.func.isRequired,
        fetchMapHistory: PropTypes.func.isRequired
    }

    componentDidMount() {
        this.props.fetchMap(this.props.name);
        this.props.fetchMapHistory(this.props.name);
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
        const { map } = this.props;

        return (<div id='map' className='content page'>
            <h2>{map.name}</h2>

            <div className='info'>
                <ul className='split'>
                    <li className='title'>Games this map has appeared in</li>
                    {map.games.map(game => <li key={game}>
                        <Link to={`/game/${game[0][0]}`}>
                            {game[0][1]}
                        </Link>
                    </li>)}
                </ul>
            </div>

            <div className='history'>
                <h3>Player History</h3>
                <div id="player-graph" className='graph'></div>
            </div>
        </div>);
    }
}


@connect(state => ({
    map: state.map.map,
    history: state.map.history
}))
export class MapContainer extends React.Component {
    render() {
        const { map, history, dispatch, params } = this.props;

        return <Map
            map={map}
            history={history}
            name={params.map}
            {...bindActionCreators(actions, dispatch)}
        />;
    }
}
