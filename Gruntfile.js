// Source Server Stats
// File: Gruntfile.js
// Desc: webpack config for grunt!

'use strict';

var webpack = require('webpack');


var webpackConfig = {
    entry: {
        main: './sourcestats/webpack/main.js'
    },
    output: {
        path: './sourcestats/static/dist/'
    },
    resolve: {
        extensions: ['', '.js'],
        modulesDirectories: ['node_modules']
    },
    externals: [{
        // This is here to stop jQuery being bundled with Metrics-Graphics - which itself
        // contains ~1000 lines of jQuery to patch if it's not present (is optional, but
        // requires this "hack" in webpack).
        jquery: 'var undefined'
    }],
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel-loader'
        }, {
            test: /\.(less|css)$/,
            loader: 'style-loader!css-loader!less-loader'
        }]
    }
};

module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        webpack: {
            options: webpackConfig,
            dev: {
                output: {
                    filename: 'app.js'
                },
                cache: true,
                debug: true,
                failOnError: false,
                watch: true,
                keepalive: true
            },
            production: {
                output: {
                    filename: 'app.[chunkhash].js'
                },
                plugins: [
                    new webpack.optimize.UglifyJsPlugin(),
                    new webpack.optimize.DedupePlugin(),
                    new webpack.optimize.OccurenceOrderPlugin()
                ]
            }
        }
    });

    grunt.registerTask('dev', ['webpack:dev']);
    grunt.registerTask('build', ['webpack:production']);
};
