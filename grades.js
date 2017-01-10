
"use strict";

var superagent = require('superagent'),
    cheerio = require('cheerio'),
    Date = require('./lib/date.js');

var exports = module.exports = { };

const timeStamp = () => new Date().format('[yy-MM-dd hh:mm:ss] ');
const safeCallback3 = (callback, a1, a2, a3) => {
    if (callback) return callback(a1, a2, a3);
    else return;
};

const baseurl = 'http://csujwc.its.csu.edu.cn';

/* Query grades *
callback: function (err, res, exdata)
*/
const queryGrades = exports.queryGrades = function (mainPages, options, callback, exdata) {

    superagent.get(baseurl + mainPages('li[title="我的成绩"] a').attr('href'))
        .set(options)
        .end(function (err, res) {
            if (err) {
                console.log((timeStamp() + 'Fail to obtain grades\n' + err.stack).red);
                return safeCallback3(callback, err, res, exdata);
            }
            console.log((timeStamp() + 'Enter grades page successfully').green);

            //res.send(iiires.text);
            let $ = cheerio.load(res.text);

            console.log('\nSubjects failed:'.yellow);
            let pure = true;
            $('font[style="color:red"]').parent().parent().each(function () {
                console.log(escaper.unescape($(this).find('td').eq(2).html() + ': ' + $(this).find('td').eq(5).text()).red);
                if (pure) pure = false;
            });
            if (pure)
                console.log(('No subjects failed. Nice!').cyan);

            return safeCallback3(callback, err, res, exdata);
        });

};