'use strict';

const express    = require('express'),
      superagent = require('superagent'),
      cheerio    = require('cheerio'),
      colors     = require('colors'),
      program    = require('commander'),
      moment     = require('moment'),
      co         = require('co'),
      thunkify   = require('thunkify'),
      access     = require('./lib/access.js');

program
    .option('-h, --help')
    .option('-V, --version')
    .option('-p, --port [value]', parseInt)
    .option('-v, --verbose')
    .parse(process.argv);

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
  -V, --version       print the version and exit.
  -v, --verbose       enable verbose log, by default only errors are logged.
  -p, --port [value]  specify a port to listen, process.env.PORT || 2333 by default.

Examples:
  $ npm start -- -p 43715               # listening to 43715
  $ forever start app.js                # deploy with forever as daemon (root access recommended)
  $ pm2 start -i 0 -n "csuapi" app.js   # deploy with pm2 as daemon  (root access recommended)`}`);
    process.exit(0);
}

superagent.Request.prototype.endThunk = thunkify(superagent.Request.prototype.end);

const port = program.port || process.env.PORT || 2333,
      app = express();

const logging = (log) => console.log(`${moment().format('[[]YY-MM-DD HH:mm:ss[]]')} ${log}`);

const verbose = (log) => program.verbose && logging(log);

// 根据系统时间计算当前学期
const getSem = () => {
    let now = new Date();
    let month = now.getMonth();
    let year = now.getFullYear();
    return month <= 6 ? `${year - 1}-${year}-${month > 0 ? 2 : 1}` : `${year}-${year + 1}-1`;
};

// 获取文档
app.get('/doc', (req, res) => res.sendFile(`${__dirname}/doc/API.html`));

// 查成绩API，通过GET传入用户名和密码
app.get(/^\/g(?:|rades)$/, co.wrap(function *(req, res) {
    // 检查参数
    if (!req.query.id || !req.query.pwd || (req.query.sem && !(/^20\d{2}-20\d{2}-[1-2]$/).test(req.query.sem))) {
        res.status(404).json({ error: "参数不正确" });
        return;
    }

    // 记录处理用时
    let start = new Date();
    verbose('Started to query the grades: '.cyan + req.query.id.yellow);

    // 登录，获取headers
    let headers;
    try {
        headers = yield access.login(req.query.id, req.query.pwd);
    } catch (errMsg) {
        logging(errMsg.inner.red);
        res.status(404).json({ error: errMsg.public });
        return;
    }
    verbose('Successfully logged in.'.green);

    // 进入成绩页面
    let ires;
    try {
        // 实际上xnxq01id为空的时候和GET这个URL的效果是一样的，都是查询所有学期
        ires = yield superagent
                         .post('http://csujwc.its.csu.edu.cn/jsxsd/kscj/yscjcx_list')
                         .set(headers)
                         .type('form')
                         .send({ xnxq01id: req.query.sem })
                         .endThunk();
    } catch (err) {
        logging(`Failed to get grades page\n${err.stack}`.red);
        res.status(404).json({ error: '无法进入成绩页面' });
        return;
    } finally {
        // 异步登出
        co(function *() {
            try {
                yield access.logout(headers);
            } catch (errMsg) {
                logging(errMsg.inner.red);
                return;
            }
            verbose('Successfully logged out: '.green + req.query.id.yellow);
        });
    }
    verbose('Successfully entered grades page.'.green);

    let $ = cheerio.load(ires.text);

    let top = $('#Top1_divLoginName').text();
    let result = {
        name: top.match(/\s.+\(/)[0].replace(/\s|\(/g, ''),
        id: top.match(/\(.+\)/)[0].replace(/\(|\)/g, ''),
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

        let title = element.eq(3).text().match(/].+$/)[0].substring(1);
        let item = {
            sem: element.eq(2).text(),
            reg: element.eq(4).text(),
            exam: element.eq(5).text(),
            overall: element.eq(6).text()
        };
        if (req.query.details) {
            item.id = element.eq(3).text().match(/\[.+\]/)[0].replace(/\[|\]/g, '');
            item.attr = element.eq(8).text();
            item.genre = element.eq(9).text();
            item.credit = element.eq(7).text();
        }

        // 如果有补考记录，则以最高分的为准(暂不考虑NaN)
        if (title in result.grades && item.overall < result.grades[title].overall) {
            return;
        }

        result.grades[title] = item;

        // 挂科判定
        if (element.eq(6).css('color')) {
            result.failed[title] = item;
        } else {
            delete result.failed[title];
        }
    });

    result['subject-count'] = Object.keys(result.grades).length;
    result['failed-count'] = Object.keys(result.failed).length;

    res.json(result);
    verbose(`Successfully responded. (req -> res processed in ${new Date() - start}ms)`.green);
}));

// 查考试API，通过GET传入用户名和密码
app.get(/^\/e(?:|xams)$/, co.wrap(function *(req, res) {
    if (!req.query.id || !req.query.pwd || (req.query.sem && !(/^20\d{2}-20\d{2}-[1-2]$/).test(req.query.sem))) {
        res.status(404).json({ error: "参数不正确" });
        return;
    }

    let start = new Date();
    verbose('Started to query the exams: '.cyan + req.query.id.yellow);

    let headers;
    try {
        headers = yield access.login(req.query.id, req.query.pwd);
    } catch (errMsg) {
        logging(errMsg.inner.red);
        res.status(404).json({ error: errMsg.public });
        return;
    }
    verbose('Successfully logged in.'.green);

    let ires;
    let _sem = req.query.sem || getSem();
    try {
        ires = yield superagent
                         .post('http://csujwc.its.csu.edu.cn/jsxsd/xsks/xsksap_list')
                         .set(headers)
                         .type('form')
                         .send({
                             xqlbmc: '',
                             xnxqid: _sem,
                             xqlb: ''
                         })
                         .endThunk();
    } catch (err) {
        logging(`Failed to reach exams page\n${err.stack}`.red);
        res.status(404).json({ error: '无法进入考试页面' });
        return;
    } finally {
        co(function *() {
            try {
                yield access.logout(headers);
                verbose('Successfully logged out: '.green + req.query.id.yellow);
            } catch (errMsg) {
                logging(errMsg.inner.red);
            }
        });
    }
    verbose('Successfully entered exams page.'.green);

    let $ = cheerio.load(ires.text);

    let top = $('#Top1_divLoginName').text();
    let result = {
        name: top.match(/\s.+\(/)[0].replace(/\s|\(/g, ''),
        id: top.match(/\(.+\)/)[0].replace(/\(|\)/g, ''),
        sem: _sem,
        exams: {},
        'exams-count': 0,
    };
    $('#dataList tr').each(function (index) {
        if (index === 0) {
            return;
        }

        let element = $(this).find('td');

        let title = element.eq(3).text();
        let item = {
            time: element.eq(4).text(),
            location: element.eq(5).text(),
            seat: element.eq(6).text()
        };

        result.exams[title] = item;
        result['exams-count']++;
    });

    res.json(result);
    verbose(`Successfully responded. (req -> res processed in ${new Date() - start}ms)`.green);
}));

app.listen(port, () => {
    logging(`The API is now running on port ${port}. Verbose logging is ${program.verbose ? 'enabled' : 'disabled'}`.green);
});
