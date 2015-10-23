// Source Server Stats
// File: sourcestats/webpack/util.js
// Desc: utility functions for the frontend

import _ from 'lodash';


export function parseDates(list, accessor) {
    const dates = [];

    _.each(list, value => {
        dates.push({
            date: new Date(value.datetime),
            value: value[accessor]
        });
    });

    return dates;
}


export function timeAgo(dateString) {
    // In UTC time
    const then = new Date(dateString).getTime();

    // In user local time
    let now = new Date();

    // Add the offset (JavaScript date handling is a joke)
    now = now.getTime() + (now.getTimezoneOffset() * 60000);
    const seconds = Math.floor((now - then) / 1000);

    let interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + 'y';
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + 'm';
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + 'd';
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + 'h';
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + 'm';
    }

    return Math.floor(seconds) + 's';
}
