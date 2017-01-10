
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

/* Begin grabbing courses! *
coursesData: {
    "name",
    "type", // i.e. "15级高级英语选课", "15级选课"
}
*/
const grabCourse = (mainPages, options, coursesData, callback, exdata) => {
    superagent.get(baseurl + mainPages('li[title="我的选课"] a').attr('href'))
        .set(options)
        .end(function (err, res) {
            if (err) {
                console.log((timeStamp() + 'Fail to open courses-electing page\n' + err.stack).red);
                return safeCallback3(callback, err, res, exdata);
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

            return safeCallback3(callback, err, res, exdata);

        });
}