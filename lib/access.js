"use strict";

var superagent = require('superagent'),
    escaper = require('true-html-escape'),
    colors = require('colors'),
    Date = require('./Date.js');

const timeStamp = () => new Date().format('[MM-dd hh:mm:ss] ');

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
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
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
};

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
            };

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
                    
                    // 将相应的headers和返回的response（刚进去的首页）传入callback
                    callback(headers, iires);
                });
        });
};

// 登出模块
const logout = (headers, res, callback) => {
    superagent.get(getRandomUrl('http://csujwc.its.csu.edu.cn/jsxsd/xk/LoginToXk?method=exit'))
        .set(headers)
        .end(function (err, ires) {
            if (err) {
                console.log((timeStamp() + 'Fail to logout\n' + err.stack).red);
                res.send({ error: '操作失败' });
                return;
            }
            callback();
        });
};

module.exports.login = login;
module.exports.logout = logout;