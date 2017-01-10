/* TODO
 * 完善异常处理
 */

"use strict";

var express = require('express'),
    superagent = require('superagent'),
    cheerio = require('cheerio'),
    escaper = require('true-html-escape'),
    colors = require('colors'),
    program = require('commander'),
    Date = require('./lib/Date.js'),
    access = require('./lib/access.js');

program
    .option('-h, --help')
    .option('-v, --version')
    .option('-p, --port [n]', parseInt)
    .option('-f, --fullLog')
    .parse(process.argv);

// 别问我为什么这里逻辑这么奇怪……测试的结果确实是这样的啊hhh
if (!program.help || !program.version) {
    console.log(('CSUEMS API v1.0.0').rainbow);
    console.log(('by The Liberators').rainbow);
    if (!program.help) {
        console.log('Preparation:');
        console.log('  \\\\This section is WIP\\\\');
        console.log('\nUsage:');
        console.log('  npm start [-- <options...>]');
        console.log('\nOptions:');
        console.log('  -h, --help          print this message and exit.');
        console.log('  -v, --version       print the version and exit.');
        console.log('  -f, --fullLog       enable full log, by default only errors are logged.');
        console.log('  -p, --port [value]  specify a port to listen, 2333 by default.');
        console.log('\nExamples:');
        console.log('  $ npm start -p 43715                           # listening to 43715');
        console.log('  $ sudo forever start app.js                    # deploy with forever as daemon (root access recommended)');
        console.log('  $ sudo pm2 start -i 0 --name "csuapi" app.js   # deploy with pm2 as daemon  (root access recommended)');
    }
    process.exit(0);
}

const timeStamp = () => new Date().format('[MM-dd hh:mm:ss] '),
      port = program.port || 2333,
      base = 'http://csujwc.its.csu.edu.cn';

var app = express();

// 查成绩API，通过GET传入用户名和密码
app.get('/grades/', function (req, res, next) {
    if (program.fulllog) {
        var start = new Date();
        console.log((timeStamp() + 'Started to query the grades: ').cyan + req.query.id.yellow);
    }
    access.login(req.query.id, req.query.pwd, res, function (headers, ires) {
        program.fulllog && console.log((timeStamp() + 'Successfully logged in.').green);
        var ret = {};
        var $ = cheerio.load(ires.text);
        ret.name = escaper.unescape($('.block1text').html()).match(/姓名：.+</)[0].replace('<', '').substring(3);
        ret.id = req.query.id;

        // 进入成绩页面
        superagent.get(base + $('li[title="我的成绩"] a').attr('href'))
            .set(headers)
            .end(function (err, iires) {
                if (err) {
                    console.log((timeStamp() + 'Failed to get grades page\n' + err.stack).red);
                    res.send({ error: '无法进入成绩页面' });
                    return next(err);
                }
                program.fulllog && console.log((timeStamp() + 'Successfully entered grades page.').green);

                $ = cheerio.load(iires.text);

                // 获取成绩列表
                let grades = {};
                let failed = {};
                $('#dataList').each(function (index) {
                    // cheerio没有实现jQuery的lt
                    if (index >= 2)
                        return;
                    $(this).find('tr[class!="theadCss"]').each(function() {
                        // 这段写得真是要吐血了
                        let subject = escaper.unescape($(this).find('td[align="left"]').eq(1).text());
                        if (subject) {
                            let score = $(this).find('font');
                            if (score.text())
                                grades[subject] = score.text();
                            if (score.css('color'))
                                failed[subject] = score.text();
                        }
                    });
                });
                ret.grades = grades;
                ret['subject-count'] = Object.getOwnPropertyNames(grades).length;
                ret.failed = failed;
                ret['failed-count'] = Object.getOwnPropertyNames(failed).length;

                // 完成所有工作后，登出
                access.logout(headers, res, function() {
                    // 第五步：返回JSON
                    res.send(JSON.stringify(ret));
                    program.fulllog && console.log((timeStamp() + 'Successfully logged out: ').green + req.query.id.yellow + (' (processed in ' + (new Date() - start) + 'ms)').green);
                });
            });
    });
});

// TODO: 对参数的正确性进行检查

// 查考试API，通过GET传入用户名和密码
app.get('/exams/', function (req, res, next) {
    if (program.fulllog) {
        var start = new Date();
        console.log((timeStamp() + 'Started to query the exams: ').cyan + req.query.id.yellow);
    }
    access.login(req.query.id, req.query.pwd, res, function (headers, ires) {
        var ret = {};
        var $ = cheerio.load(ires.text);
        ret.name = escaper.unescape($('.block1text').html()).match(/姓名：.+</)[0].replace('<', '').substring(3);
        ret.id = req.query.id;
        
        superagent.post('http://csujwc.its.csu.edu.cn/jsxsd/xsks/xsksap_list')
            .set(headers)
            .type('form')
            .send({
                xqlbmc: '',
                xnxqid: '2016-2017-1',      //TODO: 添加别的选项，或者通过参数传入
                xqlb: ''
            })
            .end(function (err, iires) {
                if (err) {
                    console.log((timeStamp() + 'Failed to reach exams page\n' + err.stack).red);
                    res.send({ error: '获取成绩失败' });
                    return next(err);
                }
                program.fulllog && console.log((timeStamp() + 'Successfully entered exams page.').green);

                $ = cheerio.load(iires.text);

                let exams = [];

                $('#dataList tr').each(function (index) {
                    if (index === 0)
                        return;
                    let item = $(this).find('td');
                    let subject = {};
                    subject.subject = escaper.unescape(item.eq(3).text());
                    subject.time = escaper.unescape(item.eq(4).text());
                    subject.location = escaper.unescape(item.eq(5).text());
                    subject.seat = escaper.unescape(item.eq(6).text());
                    exams.push(subject);
                });

                ret.exams = exams;

                access.logout(headers, res, function() {
                    res.send(JSON.stringify(ret));
                    program.fulllog && console.log((timeStamp() + 'Successfully logged out: ').green + req.query.id.yellow + (' (processed in ' + (new Date() - start) + 'ms)').green);
                });
            });
    });
});

app.listen(port);
console.log((timeStamp() + 'The server is now running on port ' + port + '.').green);