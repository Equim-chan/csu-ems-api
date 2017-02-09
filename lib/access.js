'use strict';

const superagent = require('superagent'),
      co         = require('co'),
      thunkify   = require('thunkify');

superagent.Request.prototype.endThunk = thunkify(superagent.Request.prototype.end);

// 直接从主页上扒下来的，加密算法
const encodeInp = (input) => {
    const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let chr1, chr2, chr3 = '';
    let enc1, enc2, enc3, enc4 = '';
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
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
    } while (i < input.length);
    return output;
};

exports = module.exports = {
    // 登入模块
    login: co.wrap(function *(id, pwd) {
        let ires, iires;

        // 通过GET首页，来获取cookie
        try {
            ires = yield superagent
                             .get('http://csujwc.its.csu.edu.cn/jsxsd')
                             .endThunk();
        } catch (err) {
            let message = {
                inner: `Failed to get the Cookie for login.\n${err.stack}`,
                public: '获取Cookie失败'
            };
            throw message;
        }

        const headers = {
            Host: 'csujwc.its.csu.edu.cn',
            Connection: 'keep-alive',
            'Cache-Control': 'max-age=0',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            Origin: 'http://csujwc.its.csu.edu.cn',
            'Upgrade-Insecure-Requests': 1,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: 'http://csujwc.its.csu.edu.cn/jsxsd/',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'zh-CN,zh;q=0.8',
            Cookie: ires.headers['set-cookie']
        };

        try {
            iires = yield superagent
                              .post('http://csujwc.its.csu.edu.cn/jsxsd/xk/LoginToXk')
                              .set(headers)
                              .type('form')
                              .send({ encoded: `${encodeInp(id)}%%%${encodeInp(pwd)}` })
                              .endThunk();
        } catch (err) {
            let message = {
                inner: `Failed to login\n${err.stack}`,
                public: '登录失败'
            };
            throw message;
        }

        if (/POST/i.test(iires.req.method)) {
            let err = new Error('The request method to the logged-in page is POST instead of GET');
            let message = {
                inner: `Failed to login (possibily id or password provided were wrong)\n${err.stack}`,
                public: '登录失败，可能是用户名或密码错误，请确认参数已URL转义'
            };
            throw message;
        }

        return headers;
    }),
    // 登出模块
    logout: co.wrap(function *(headers) {
        try {
            yield superagent
                      .get(`http://csujwc.its.csu.edu.cn/jsxsd/xk/LoginToXk?method=exit&tktime=${new Date().getTime()}`)
                      .set(headers)
                      .endThunk();
        } catch (err) {
            // res已经sent了，所以没有public的message
            let message = {
                inner: `Failed to logout\n${err.stack}`
            };
            throw message;
        }
    })
};
