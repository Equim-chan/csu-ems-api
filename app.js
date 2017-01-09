var http = require('http'),
    express = require('express'),
    superagent = require('superagent'),
    cheerio = require('cheerio'),
    escaper = require('true-html-escape'),
    colors = require('colors'),
    program = require('commander'),
    Date = require('./lib/Date.js');

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
        console.log('  npm start [-- <options>]');
        console.log('\nOptions:');
        console.log('  -h, --help          print this message and exit.');
        console.log('  -v, --version       print the version and exit.');
        console.log('  -f, --fulllog       enable full log, by default only errors are logged.');
        console.log('  -p, --port [value]  specify a port to listen, 2333 by default.');
        console.log('\nExamples:');
        console.log('  $ npm start -p 43715                      # listening to 43715');
        console.log('  # forever start app.js                    # deploy with forever as daemon (root access recommended)');
        console.log('  # pm2 start app.js -i 0 --name "CSUEMSR"  # deploy with pm2 as daemon  (root access recommended)');
    }
    process.exit(0);
}

const timeStamp = () => new Date().format('[MM-dd hh:mm:ss] '),
      port = program.port || 2333;
      base = 'http://csujwc.its.csu.edu.cn';

// 直接从主页上扒下来的，哈希算法
const encodeInp = (input) => {
    let keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let chr1, chr2, chr3 = "";
    let enc1, enc2, enc3, enc4 = "";
    let i = 0;
    do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
            enc3 = enc4 = 64
        } else if (isNaN(chr3)) {
            enc4 = 64
        }
        output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = ""
    } while (i < input.length);
    return output;
};

// 登出时用到的函数，一样是从原网页扒下来的
const getRandomUrl = (htmlurl) => {
    let count = htmlurl.indexOf("?");
    let date = new Date();
    let t = Date.parse(date);    
    if (count < 0) {
        htmlurl = htmlurl + "?tktime=" + t;
    } else {
        htmlurl = htmlurl + "&tktime=" + t;
    }
    return htmlurl;
}

// 登录模块
const login = (id, pwd, res, callback) => {
    // 通过GET首页，来获取cookie
    superagent.get('http://csujwc.its.csu.edu.cn/jsxsd')
        .end(function (err, ires) {
            if (err) {
                console.log((timeStamp() + 'Failed to get the Cookie.\n' + err.stack).red);
                res.send({ error: '获取Cookie失败' });
                return;
            }
            program.fulllog && console.log((timeStamp() + 'Successfully got the Cookie.').green);

            // 登录POST请求的headers，是我抓包来的
            let headers = {
                Host: 'csujwc.its.csu.edu.cn',
                Connection: 'keep-alive',
                'Cache-Control': 'max-age=0',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                Origin: 'http://csujwc.its.csu.edu.cn',
                'Upgrade-Insecure-Requests': 1,
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                Referer: 'http://csujwc.its.csu.edu.cn/jsxsd/',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'zh-CN,zh;q=0.8',
                Cookie: ires.headers['set-cookie']     // 猜测：感觉这个cookie也是不变的，不过出于稳定性，还是动态获取了
            }

            let account = encodeInp(id);
            let passwd = encodeInp(pwd);
            let encoded = escaper.escape(account + "%%%" + passwd);

            // POST登录
            superagent.post('http://csujwc.its.csu.edu.cn/jsxsd/xk/LoginToXk')
                .set(headers)
                .type('form')
                .send({ encoded: encoded })
                .end(function (err, iires) {
                    // 如果登录信息正确，这里是对http://csujwc.its.csu.edu.cn/jsxsd/framework/xsMain.jsp的GET请求
                    // 如果错误，会变成对http://csujwc.its.csu.edu.cn/jsxsd/xk/LoginToXk的POST请求
                    if (err || /POST/i.test(iires.req.method)) {
                        console.log((timeStamp() + 'Fail to login\n' + (err ? err.stack : 'Possibily id or password provided were wrong')).red);
                        res.send({ error: '登录失败，可能是用户名或密码错误' });
                        return;
                    }
                    program.fulllog && console.log((timeStamp() + 'Successfully logged in.').green);
                    // 将相应的headers和返回的response（刚进去的首页）传入callback
                    callback(headers, iires);
                });
        });
};

var app = express();

// 查成绩API，通过GET传入用户名和密码
app.get('/query/', function (req, res, next) {
    if (program.fulllog) {
        var start = new Date();
        console.log((timeStamp() + 'Started to proceed: ').cyan + req.query.id.yellow);
    }
    login(req.query.id, req.query.pwd, res, function (headers, iires) {
        var ret = {};
        var $ = cheerio.load(iires.text);

        // 进入成绩页面
        superagent.get(base + $('li[title="我的成绩"] a').attr('href'))
            .set(headers)
            .end(function (err, iiires) {
                if (err) {
                    console.log((timeStamp() + 'Fail to obtain grades\n' + err.stack).red);
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
                superagent.get(getRandomUrl(base + '/jsxsd/xk/LoginToXk?method=exit'))
                    .set(headers)
                    .end(function (err, iiiires) {
                        if (err) {
                            console.log((timeStamp() + 'Fail to logout\n' + err.stack).red);
                            res.send({ error: '操作失败' });
                            return next(err);
                        }

                        // 第五步：返回JSON
                        res.send(JSON.stringify(ret));
                        program.fulllog && console.log((timeStamp() + 'Successfully logged out: ').green + req.query.id.yellow + (' (total time: ' + (new Date() - start) + 'ms)').green);
                    });
            });
    });
});

app.listen(port);
console.log((timeStamp() + 'The server is now running on port ' + port + '.').green);