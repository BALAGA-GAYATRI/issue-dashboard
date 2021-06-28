"use strict";
exports.__esModule = true;
exports.datetime = exports.time = exports.date = void 0;
var dayjs_1 = require("dayjs");
var utc_1 = require("dayjs/plugin/utc");
var customParseFormat_1 = require("dayjs/plugin/customParseFormat");
function parse(input) {
    if (input === void 0) { input = ''; }
    dayjs_1["default"].extend(utc_1["default"]);
    dayjs_1["default"].extend(customParseFormat_1["default"]);
    var value;
    var match;
    var currentDate = false;
    input = input.toString().replace(/^\s+/, '');
    if (match = input.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})Z/)) {
        value = dayjs_1["default"](match[0]);
        input = input.substring(match[0].length);
    }
    else if (match = input.match(/^(\d{4}-\d{2}-\d{2})/)) {
        value = dayjs_1["default"](match[0] + " -0000", 'YYYY-MM-DD Z');
        input = input.substring(match[0].length);
    }
    else if (match = input.match(/^(\d{2}):(\d{2}):(\d{2})/)) {
        value = dayjs_1["default"]();
        value = value.utc().hour(+match[1]);
        value = value.utc().minute(+match[2]);
        value = value.utc().second(+match[3]);
        input = input.substring(match[0].length);
    }
    else {
        value = dayjs_1["default"]();
        currentDate = true;
    }
    while (input.length > 0) {
        var operator = void 0;
        input = input.replace(/^\s+/, '');
        if (match = input.match(/^([+-])\s*/)) {
            operator = match[1];
            input = input.substring(match[0].length);
        }
        else if (currentDate != null) {
            // if no date was specified, users don't need a starting operator
            operator = '+';
            currentDate = false;
        }
        else {
            throw new Error("operator expected, got '" + input + "'");
        }
        var operation = (operator == '-') ?
            function (d, v, u) { return d.utc().subtract(v, u); } :
            function (d, v, u) { return d.utc().add(v, u); };
        if (match = input.match(/^([\d]+)\s*(year|month|day|hour|minute|second)(s?)\s*/)) {
            input = input.substring(match[0].length);
            value = operation(value, +match[1], match[2]);
        }
        else if (match = input.match(/^(\d{2}):(\d{2}):(\d{2})\s*/)) {
            input = input.substring(match[0].length);
            value = operation(value, +match[1], 'hours');
            value = operation(value, +match[2], 'minutes');
            value = operation(value, +match[3], 'seconds');
        }
        else {
            throw new Error("date adjustment expected, got '" + input + "'");
        }
    }
    return value.utc();
}
function date(input) {
    if (input === void 0) { input = undefined; }
    return parse(input).format('YYYY-MM-DD');
}
exports.date = date;
function time(input) {
    if (input === void 0) { input = undefined; }
    return parse(input).format('HH:mm:ss');
}
exports.time = time;
function datetime(input) {
    if (input === void 0) { input = undefined; }
    return parse(input).format();
}
exports.datetime = datetime;
