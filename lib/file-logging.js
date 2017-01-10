
"use strict";

var fs = require('fs');

var exports = module.exports = { };

var destfile = exports.destfile = './logs.txt';

const clearlogfile = exports.clearlogfile = function () {
    try {
        fs.unlinkSync('./logs.txt');
    } catch (e) {

    }
};

const logtofile = exports.logtofile = function (message) {
    try {
        fs.appendFileSync(destfile, message); 
    } catch (e) {
        console.log(e);
    }
};