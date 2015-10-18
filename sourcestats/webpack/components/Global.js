// Source Server Stats
// File: sourcestats/webpack/components/Global.js
// Desc: global stats

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as actions from '../actions/history';

import Graph from './shared/Graph';


class Global extends React.Component {
    static PropTypes = {
        fetchServerHistory: PropTypes.func.isRequired,
        fetchPlayerHistory: PropTypes.func.isRequired
    }

    render() {
        const { playerHistory, serverHistory } = this.props.data;

        return (<div id='global' className='content page'>
            <h2>Global Stats</h2>

            <div className='info'>
                <p>
                    Hello
                </p>
            </div>

            <div className='history'>
                <Graph
                    title='Server history'
                    data={serverHistory}
                    fetch={this.props.fetchServerHistory}
                />

                <Graph
                    title='Player history'
                    data={playerHistory}
                    fetch={this.props.fetchPlayerHistory}
                />
            </div>
        </div>);
    }
}


@connect(state => ({
    data: state.history.data,
    update: state.history.update
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
