
"use strict";

var superagent = require('superagent'),
    escaper = require('true-html-escape'),
    Date = require('./lib/date.js');

var exports = module.exports = { };

const timeStamp = () => new Date().format('[yy-MM-dd hh:mm:ss] ');
const safeCallback3 = (callback, a1, a2, a3) => {
    if (callback) return callback(a1, a2, a3);
    else return;
};

const baseurl = 'http://csujwc.its.csu.edu.cn';

// 直接从主页上扒下来的，加密算法
const encodeInp = exports.encodeInp = function (input) {
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
const getRandomUrl = exports.getRandomUrl = function (htmlurl) {
    let count = htmlurl.indexOf("?");
    let date = new Date();
    let t = Date.parse(date);
    if (count < 0) {
        htmlurl = htmlurl + "?tktime=" + t;
    } else {
        htmlurl = htmlurl + "&tktime=" + t;
    }
    return htmlurl;
};

// 登录POST请求的headers，抓包来的
var options = exports.options = {
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
    // Cookie后面再获取
};

/* Login *
callback: function (err, res, exdata)
*/
const login = exports.login = function (userid, userpwd, callback, exdata) {

    console.log((timeStamp() + 'Proceed: ').cyan + userid.yellow);
    let account = encodeInp(userid);
    let password = encodeInp(userpwd);
    let encoded = escaper.escape(account + "%%%" + password);

    superagent.get(baseurl + '/jsxsd')
        .end(function (err, ires) {
            if (err) {
                console.log((timeStamp() + 'Fail to get Cookie\n' + err.stack).red);
                return callback(err, ires, exdata);
            }
            console.log((timeStamp() + 'Got Cookie successfully').green);

            options.Cookie = ires.headers['set-cookie'];
            // 猜测：感觉这个cookie也是不变的，不过出于稳定性，还是动态获取了

            // 第二步：POST登录
            superagent.post(baseurl + '/jsxsd/xk/LoginToXk')
                .set(options)
                .type('form')
                .send({ encoded: encoded })
                .end(function (err, iires) {
                    // 如果登录信息正确，这里是对http://csujwc.its.csu.edu.cn/jsxsd/framework/xsMain.jsp的GET请求
                    // 如果错误，会变成对http://csujwc.its.csu.edu.cn/jsxsd/xk/LoginToXk的POST请求
                    if (err || /POST/i.test(iires.req.method)) {
                        console.log((timeStamp() + 'Fail to login\n' + (err ? err.stack : 'Probablily id or password error')).red);
                        return safeCallback3(callback, err, iires, exdata);
                    }
                    console.log((timeStamp() + 'Login successfully').green);

                    return safeCallback3(callback, err, iires, exdata);
                }); // End of post login request
        });// End of login request

};

/* Logout *
callback: function (err, res, exdata)
*/
const logout = exports.logout = function (userid, callback, exdata) {
    // 最后一步：完成所有工作后，登出
    superagent.get(getRandomUrl(baseurl + '/jsxsd/xk/LoginToXk?method=exit'))
        .set(options)
        .end(function (err, res) {
            if (err) {
                console.log((timeStamp() + 'Fail to login\n' + err.stack).red);
                return safeCallback3(callback, err, res, exdata);
            }
            console.log(('\n' + timeStamp() + 'Logout successfully: ').green  + userid.yellow);

            return safeCallback3(callback, err, res, exdata);
        });
}