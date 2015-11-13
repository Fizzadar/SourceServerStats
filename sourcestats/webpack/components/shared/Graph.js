// Source Server Stats
// File: sourcestats/webpack/components/Graph.js
// Desc: displays the graphs around the site

import _ from 'lodash';
import moment from 'moment';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import MG from 'metrics-graphics';

export const GRAPH_OPTIONS = {
    x_accessor: 'date',
    y_accessor: 'value',
    height: 200,
    full_width: true,
    right: 0,
    show_secondary_x_label: false,
    missing_is_hidden: true
};


export default class Graph extends React.Component {
    static PropTypes = {
        fetch: PropTypes.func.isRequired,
        data: PropTypes.object.isRequired
    }

    filters = {
        since: moment().utc().subtract(1, 'days').toISOString().split('.')[0]
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
        let since = moment().utc();

        if (period === '7-day') {
            since = since.subtract(7, 'days');
        } else if (period === '30-day') {
            since = since.subtract(30, 'days');
        } else {
            since = since.subtract(1, 'days');
        }

        const iso = since.toISOString();
        this.filters.since = iso.split('.')[0];
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
                    <option value='1-day' default>1 day</option>
                    <option value='7-day'>7 days</option>
                    <option value='30-day'>30 days</option>
                </select>
            </h3>

            <div className='graph'></div>
        </div>);
    }
}
