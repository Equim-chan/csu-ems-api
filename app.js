/* TODO
 * 完善异常处理
 */

var http = require('http'),
    express = require('express'),
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
    .option('-f, --fulllog')
    .parse(process.argv);

// 别问我为什么这里逻辑这么奇怪……测试的结果确实是这样的啊hhh
if (!program.help || !program.version) {
    console.log(('CSUEMS API v1.0.0').rainbow);
    console.log(('by The Liberators').rainbow);
    if (!program.help) {
        console.log('Preparation:')
        console.log('  \\\\This section is WIP\\\\');
        console.log('\nUsage:');
        console.log('  npm start [-- <options...>]');
        console.log('\nOptions:');
        console.log('  -h, --help          print this message and exit.');
        console.log('  -v, --version       print the version and exit.');
        console.log('  -f, --fulllog       enable full log, by default only errors are logged.');
        console.log('  -p, --port [value]  specify a port to listen, 2333 by default.');
        console.log('\nExamples:');
        console.log('  $ npm start -p 43715                      # listening to 43715');
        console.log('  # forever start app.js                    # deploy with forever as daemon (root access recommended)');
        console.log('  # pm2 start -i 0 --name "csuapi" app.js   # deploy with pm2 as daemon  (root access recommended)');
    }
    process.exit(0);
}

const timeStamp = () => new Date().format('[MM-dd hh:mm:ss] '),
      port = program.port || 2333;
      base = 'http://csujwc.its.csu.edu.cn';

var app = express();

// 查成绩API，通过GET传入用户名和密码
app.get('/grades/', function (req, res, next) {
    if (program.fulllog) {
        var start = new Date();
        console.log((timeStamp() + 'Started to query the grades: ').cyan + req.query.id.yellow);
    }
    access.login(req.query.id, req.query.pwd, res, function (headers, iires) {
        program.fulllog && console.log((timeStamp() + 'Successfully logged in.').green);
        var ret = {};
        var $ = cheerio.load(iires.text);
        ret.name = escaper.unescape($('.block1text').html()).match(/姓名：.+</)[0].replace('<', '').substring(3);
        ret.id = req.query.id;

        // 进入成绩页面
        superagent.get(base + $('li[title="我的成绩"] a').attr('href'))
            .set(headers)
            .end(function (err, iiires) {
                if (err) {
                    console.log((timeStamp() + 'Failed to fetch grades\n' + err.stack).red);
                    ret.error = '获取成绩失败';
                    return next(err);
                }
                program.fulllog && console.log((timeStamp() + 'Successfully entered grades page.').green);

                $ = cheerio.load(iiires.text);

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

// 查考试API，通过GET传入用户名和密码
/*
app.get('/exams/', function (req, res, next) {
    if (program.fulllog) {
        var start = new Date();
        console.log((timeStamp() + 'Started to query the exams: ').cyan + req.query.id.yellow);
    }
    login(req.query.id, req.query.pwd, res, function (headers, iires) {
        var ret = {};
        var $ = cheerio.load(iires.text);
        ret.name = escaper.unescape($('.block1text').html()).match(/姓名：.+</)[0].replace('<', '').substring(3);
        ret.id = req.query.id;

        // TODO: POST，注意headers
});
*/

app.listen(port);
console.log((timeStamp() + 'The server is now running on port ' + port + '.').green);