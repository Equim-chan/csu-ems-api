/* TODO
 * 完善异常处理
 * 建立用户名-Cookie数据库
 */

'use strict';

const
    express    = require('express'),
    superagent = require('superagent'),
    cheerio    = require('cheerio'),
    escaper    = require('true-html-escape'),
    colors     = require('colors'),
    program    = require('commander'),
    moment     = require('moment'),
    access     = require('./lib/access.js');

program
    .option('-h, --help')
    .option('-v, --version')
    .option('-p, --port [value]', parseInt)
    .option('-f, --fullLog')
    .parse(process.argv);

// 别问我为什么这里逻辑这么奇怪……测试的结果确实是这样的啊hhh
if (!program.help || !program.version) {
    console.log(
`${`CSUEMS API v${require('./package').version}
by The Liberators`.rainbow}${program.help ? '' :
`

Preparation:
  ${'(This section is WIP)'.grey}

Usage:
  npm start [-- <options...>]

Options:
  -h, --help          print this message and exit.
  -v, --version       print the version and exit.
  -f, --fullLog       enable full log, by default only errors are logged.
  -p, --port [value]  specify a port to listen, process.env.PORT || 2333 by default.

Examples:
  $ npm start -- -p 43715               # listening to 43715
  $ forever start app.js                # deploy with forever as daemon (root access recommended)
  $ pm2 start -i 0 -n "csuapi" app.js   # deploy with pm2 as daemon  (root access recommended)`}`);
    process.exit(0);
}

const
    timeStamp = () => moment().format('[[]YY-MM-DD HH:mm:ss[]]'),
    // 以系统时间获取当前学期
    getSem = () => {
        let now = new Date();
        let month = now.getMonth();
        let year = now.getFullYear();
        if (month === 0) {
            return (year - 1) + '-' + year + '-1';
        } else if (month <= 6) {
            return (year - 1) + '-' + year + '-2';
        } else {
            return year + '-' + (year + 1) + '-1';
        }
    },
    port = program.port || process.env.PORT || 2333,
    fullLog = program.fullLog,
    app = express();

// 获取文档
app.get('/doc', function (req, res, next) {
    res.sendFile(__dirname + '/doc/API.html');
});

// 查成绩API，通过GET传入用户名和密码
app.get(/^\/g(?:|rades)$/, function (req, res, next) {
    if (!req.query.id || !req.query.pwd || (req.query.sem && !(/^20\d{2}-20\d{2}-[1-2]$/).test(req.query.sem))) {
        res.status(404).send({ error: "参数不正确" });
        return;
    }
    if (fullLog) {
        var start = new Date();
        console.log(`${timeStamp()} Started to query the grades: `.cyan + req.query.id.yellow);
    }
    access.login(req.query.id, req.query.pwd, res, function (headers) {
        if (fullLog) {
            console.log(`${timeStamp()} Successfully logged in.`.green);
        }

        // 实际上xnxq01id为空的时候和GET这个URL的效果是一样的，都是查询所有学期
        superagent
            .post('http://csujwc.its.csu.edu.cn/jsxsd/kscj/yscjcx_list')
            .set(headers)
            .type('form')
            .send({
                xnxq01id: req.query.sem
            })
            .end(function (err, iires) {
                if (err) {
                    console.log(`${timeStamp()} Failed to get grades page\n${err.stack}`.red);
                    res.status(404).send({ error: '无法进入成绩页面' });
                    return next(err);
                }
                if (fullLog) {
                    console.log(`${timeStamp()} Successfully entered grades page.`.green);
                }

                let $ = cheerio.load(iires.text);

                let result = {
                    name: escaper.unescape($('#Top1_divLoginName').text().match(/\s.+\(/)[0].replace(/\s|\(/g, '')),
                    id: escaper.unescape($('#Top1_divLoginName').text().match(/\(.+\)/)[0].replace(/\(|\)/g, '')),
                    grades: {},
                    'subject-count': 0,
                    failed: {},
                    'failed-count': 0,
                };

                // 获取成绩列表
                $('#dataList tr').each(function (index) {
                    if (index === 0) {
                        return;
                    }
                    let element = $(this).find('td');

                    let title = escaper.unescape(element.eq(3).text().match(/].+$/)[0].substring(1));

                    let item = {
                        sem: escaper.unescape(element.eq(2).text()),
                        reg: escaper.unescape(element.eq(4).text()),
                        exam: escaper.unescape(element.eq(5).text()),
                        overall: escaper.unescape(element.eq(6).text())
                    };
                    if (req.query.details) {
                        item.id = escaper.unescape(element.eq(3).text().match(/\[.+\]/)[0].replace(/\[|\]/g, ''));
                        item.attr = escaper.unescape(element.eq(8).text());
                        item.genre = escaper.unescape(element.eq(9).text());
                        item.credit = escaper.unescape(element.eq(7).text());
                    }

                    // 如果有补考记录，则以最高分的为准
                    // 这段代码是拿可读性换了时间复杂度……
                    if (title in result.grades) {
                        // 暂不考虑NaN
                        if (item.overall < result.grades[title].overall) {
                            return;
                        }
                        if (!element.eq(6).css('color')) {
                            delete result.failed[title];
                        }
                    } else if (element.eq(6).css('color')) {
                        result.failed[title] = item;
                    }

                    result.grades[title] = item;
                });

                result['subject-count'] = Object.keys(result.grades).length;
                result['failed-count'] = Object.keys(result.failed).length;

                access.logout(headers, res, function() {
                    // 返回JSON
                    res.send(JSON.stringify(result));
                    if (fullLog) {
                        console.log(`${timeStamp()} Successfully logged out: `.green +
                            req.query.id.yellow +
                            ` (processed in ${new Date() - start} ms)`.green);
                    }
                });
            });
    });
});

// 查考试API，通过GET传入用户名和密码
app.get(/^\/e(?:|xams)$/, function (req, res, next) {
    if (!req.query.id || !req.query.pwd || (req.query.sem && !(/^20\d{2}-20\d{2}-[1-2]$/).test(req.query.sem))) {
        res.status(404).send({ error: "参数不正确" });
        return;
    }
    if (fullLog) {
        var start = new Date();
        console.log(`${timeStamp()} Started to query the exams: `.cyan + req.query.id.yellow);
    }
    access.login(req.query.id, req.query.pwd, res, function (headers) {
        if (fullLog) {
            console.log(`${timeStamp()} Successfully logged in.`.green);
        }
        superagent
            .post('http://csujwc.its.csu.edu.cn/jsxsd/xsks/xsksap_list')
            .set(headers)
            .type('form')
            .send({
                xqlbmc: '',
                xnxqid: req.query.sem || getSem(),
                xqlb: ''
            })
            .end(function (err, iires) {
                if (err) {
                    console.log(`${timeStamp()} Failed to reach exams page\n${err.stack}`.red);
                    res.status(404).send({ error: '获取成绩失败' });
                    return next(err);
                }
                if (fullLog) {
                    console.log(`${timeStamp()} Successfully entered exams page.`.green);
                }

                let $ = cheerio.load(iires.text);

                let result = {
                    name: escaper.unescape($('#Top1_divLoginName').text().match(/\s.+\(/)[0].replace(/\s|\(/g, '')),
                    id: escaper.unescape($('#Top1_divLoginName').text().match(/\(.+\)/)[0].replace(/\(|\)/g, '')),
                    sem: req.query.sem || getSem(),
                    exams: {},
                    'exams-count': 0,
                };

                $('#dataList tr').each(function (index) {
                    if (index === 0) {
                        return;
                    }
                    let element = $(this).find('td');
                    let title = escaper.unescape(element.eq(3).text());

                    let item = {
                        time: escaper.unescape(element.eq(4).text()),
                        location: escaper.unescape(element.eq(5).text()),
                        seat: escaper.unescape(element.eq(6).text())
                    };

                    result.exams[title] = item;
                    result['exams-count']++;
                });

                access.logout(headers, res, function() {
                    res.send(JSON.stringify(result));
                    if (fullLog) {
                        console.log(`${timeStamp()} Successfully logged out: `.green +
                            req.query.id.yellow +
                            ` (processed in ${new Date() - start} ms)`.green);
                    }
                });
            });
    });
});

app.listen(port, () => {
    console.log(`${timeStamp()} The API is now running on port ${port}. Full logging is ${fullLog ? 'enabled' : 'disabled'}`.green);
});