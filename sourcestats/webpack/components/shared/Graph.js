// Source Server Stats
// File: sourcestats/webpack/components/Graph.js
// Desc: displays the graphs around the site

import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import MG from 'metrics-graphics';

export const GRAPH_OPTIONS = {
    x_accessor: 'date',
    y_accessor: 'value',
    height: 200,
    full_width: true,
    right: 0,
    show_secondary_x_label: false
};


export default class Graph extends React.Component {
    static PropTypes = {
        fetch: PropTypes.func.isRequired,
        data: PropTypes.object.isRequired
    }

    filters = {
        since: '1d'
    }

    componentDidMount() {
        this.fetchData();
    }

    componentDidUpdate() {
        if (this.props.data.length > 0) {
            MG.data_graphic(_.extend(_.clone(GRAPH_OPTIONS), {
                data: this.props.data,
                target: ReactDOM.findDOMNode(this).querySelector('.graph')
            }));
        }
    }

    fetchData() {
        this.props.fetch(this.filters);
    }

    setTimePeriod(period) {
        this.filters.since = period;
        this.fetchData();
    }

    render() {
        return (<div>
            <h3>
                {this.props.title}

                <select
                    className='right'
                    onChange={(e) => this.setTimePeriod(e.target.value)}
                >
                    <option value='1d' default>1 day</option>
                    <option value='7d'>7 days</option>
                    <option value='30d'>30 days</option>
                </select>
            </h3>

            <div className='graph'></div>
        </div>);
    }
}
