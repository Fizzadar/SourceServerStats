// Source Server Stats
// File: sourcestats/webpack/components/app.js
// Desc: app container

import React from 'react';
import { Link } from 'react-router';


export class AppContainer extends React.Component {
    render() {
        return (<div>
            <div id="header">
                <h1><a href="/">
                    <i className="icon icon-steam"></i>
                </a></h1>

                <ul className="nav">
                    <li><Link to={'/servers'} activeClassName='active'>Servers</Link></li>
                    <li><Link to={'/maps'} activeClassName='active'>Maps</Link></li>
                    <li><Link to={'/games'} activeClassName='active'>Games</Link></li>
                    <li><Link to={'/global'} activeClassName='active'>Global</Link></li>
                </ul>

                <ul className="nav right">
                    <li>
                        An experiment by <a href="http://pointlessramblings.com">Fizzadar</a> - <a href="https://github.com/Fizzadar/SourceServerStats">GitHub</a>
                    </li>
                </ul>
            </div>

            <div>{this.props.children}</div>
        </div>);
    }
}
