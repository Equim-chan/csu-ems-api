/* TODO:
 * 用参数自定义端口
 */
"use strict";

var http = require('http'),
    express = require('express'),
    superagent = require('superagent'),
    cheerio = require('cheerio'),
    escaper = require('true-html-escape'),
    colors = require('colors'),
    fs = require('fs'),

    FileLogging = require('./lib/file-logging.js'),
    Date = require('./lib/date.js'),

    UserItf = require('./user.js'),
    GradesItf = require('./grades.js');

const clearlogfile = FileLogging.clearlogfile;
const logtofile = FileLogging.logtofile;
FileLogging.destfile = './logs.txt';

const timeStamp = () => new Date().format('[yy-MM-dd hh:mm:ss] ');
const base = 'http://csujwc.its.csu.edu.cn';

var mainFunction = function (req, res, next) {

    const grabCoursesType1 = (linkaddr, req, next) => {
        superagent.get(base + linkaddr)
            .set(options)
            .end(function (err, ceresi) {
                if (err) {
                    console.log((timeStamp() + 'Fail to enter inner courses-electing page\n' + err.stack).red);
                    return next(err);
                }
                console.log((timeStamp() + 'Enter inner courses-electing page successfully').green);
                
                let $ = cheerio.load(ceresi.text);
                let tabshost = $('ul[id="topmenu"]').find('a');
                superagent.get(base + $(tabshost[1]).attr('href'))
                    .set(options)
                    .end(function (err, ceresii) {
                        if (err) {
                            console.log((timeStamp() + 'Fail to open tab[1]\n' + err.stack).red);
                            return next(err);
                        }
                        console.log((timeStamp() + 'Enter tab[1] successfully').green);

                        //logtofile(ceresii.text);

                        let sSources = "/jsxsd/xsxkkc/xsxkKnjxk?kcxx=&skls=&skxq=&skjc=&sfym=false&sfct=true";
                        let aoData = {
                            sEcho: 1,
                            iColumns: 13,
                            sColumns: undefined,
                            iDisplayStart: 0,
                            iDisplayLength: 15,
                            mDataProp_0: 'kch',
                            mDataProp_1: 'kcmc',
                            mDataProp_2: 'ktmc',
                            mDataProp_3: 'xf',
                            mDataProp_4: 'skls',
                            mDataProp_5: 'sksj',
                            mDataProp_6: 'skdd',
                            mDataProp_7: 'xkrs',
                            mDataProp_8: 'syrs',
                            mDataProp_9: 'xxrs',
                            mDataProp_10: 'ctsm',
                            mDataProp_11: 'xkbtf',
                            mDataProp_12: 'czOper',
                        }

                        superagent.post(base + sSources)
                            .set(options)
                            .type('form')
                            .send(aoData)
                            .end(function (err, rescourses) {
                                    if (err) {
                                        console.log((timeStamp() + 'Fail to query courses\n' + err.stack).red);
                                        return next(err);
                                    }
                                    console.log((timeStamp() + 'Query courses successfully').green);

                                    let coursesAvaliable = JSON.parse(rescourses.text);
                                    let aimCourses = coursesAvaliable["aaData"][0];
                                    console.log(aimCourses);
                                    superagent.post(base + '/jsxsd/xsxkkc/knjxkOper')
                                        .set(options)
                                        .type('form')
                                        .send({
                                            jx0404id: aimCourses["jx0404id"],
                                            xkzy: "",
                                            trjf: ""
                                        })
                                        .end(function (err, rescourses) {
                                            if (err) {
                                                console.log((timeStamp() + 'Fail to grab courses\n' + aimCourses["fzmc"]
                                                     + err.stack).red);
                                                return next(err);
                                            }
                                            console.log((timeStamp() + 'Course' + aimCourses["fzmc"] + '  grabbed').green);

                                            console.log((timeStamp() + 'Done!').green);

                                        });
                                    //logtofile(rescourses.text);

                                }); // End of query courses

                        }); // End of tab[1]

                }); // End of inner courses-electing page
    }

    // Begin grabbing courses!
    const grabCourse = (pages1, req, next) => {
        superagent.get(base + pages1('li[title="我的选课"] a').attr('href'))
            .set(options)
            .end(function (err, iiires) {
                if (err) {
                    console.log((timeStamp() + 'Fail to open courses-electing page\n' + err.stack).red);
                    return next(err);
                }
                console.log((timeStamp() + 'Enter courses-electing page successfully').green);

                let $ = cheerio.load(iiires.text);
                let aimlinks = $('table[id="tbKxkc"]').find('a').filter(function (index) { return $(this).text() == '进入选课'; });
                console.log(('Find ' + aimlinks.length + ' links.').green);
                console.log(('Automatically choose the first link').green);

                //aimlinks.each(function () {
                grabCoursesType1($(aimlinks[0]).attr('href'), req, next);
                //});
                //console.log($('a'));

            });
    }

    clearlogfile();

    UserItf.login(req.query.id, req.query.pwd, (err, res, exdata) => {
                    var $ = cheerio.load(res.text);
                    GradesItf.queryGrades($, UserItf.options, (ierr, ires, iexdata) => {
                        UserItf.logout(req.query.id);
                    });
                });

    // Not logout until we find a way to sync
    //doLogout(req, next);
}

var app = express();
app.get('/', mainFunction);
app.listen(2333);
console.log((timeStamp() + 'Server is now running on port 2333').green);