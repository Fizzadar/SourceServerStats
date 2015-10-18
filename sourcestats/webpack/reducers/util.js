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
