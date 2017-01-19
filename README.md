# 中南教务API #
[![Build Status](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/badges/build.png?b=master)](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/build-status/master) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/e0e581dce60642f59d3019e760eaba7e)](https://www.codacy.com/app/Equim-chan/csu-ems-api?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Equim-chan/csu-ems-api&amp;utm_campaign=Badge_Grade) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/?branch=master) [![GPLv3](https://img.shields.io/badge/Lisence-GPLv3-blue.svg)](https://github.com/Equim-chan/csu-ems-api/blob/master/LICENSE)

中南大学本科教务管理系统的第三方API，基于Node.js  
__尚未完成，不管是代码还是这篇文档__

- [API](#api)
- [Setup](#setup)
  - [快速部署](#快速部署)
  - [稳定部署(以pm2作为daemon)](#稳定部署以pm2作为daemon)
  - [获取帮助](#获取帮助)
- [FAQ](#faq)
- [Dependencies](#dependencies)
- [License](#license)
- [Initiators](#initiators)

## API ##

* 详见[API文档](https://github.com/Equim-chan/csu-ems-api/blob/master/doc/API.md)

## Setup ##

### 快速部署 ###
```shell
$ git clone https://github.com/Equim-chan/csu-ems-api.git
$ cd csu-ems-api
$ npm install
$ npm start
```
* 默认会部署在localhost:2333上，如要修改端口，请使用参数`-p|--port [value]`
* 默认情况下只有错误会被打印，如果要打印全部的log，请使用参数`-f|--fullLog`

### 稳定部署(以pm2作为daemon) ###
```shell
  ...
$ pm2 start -i 0 -n "csuapi" --watch true app.js
```
查看日志：
```shell
$ pm2 logs csuapi
```
撤销部署：
```shell
$ pm2 stop csuapi
$ pm2 delete csuapi
```

### 获取帮助 ###
```shell
$ node app.js -h
```

## FAQ ##
* 为什么选择了Node.js？
  * 因为方便。
* 为什么要做成绑定端口的形式，而不是一个Node包？
  * 出于几点考虑。首先要把Node.js程序打包成一个无依赖的库目前还是件比较麻烦的事，如果以Node.js包的形式写的话，上面的应用可能就也只能用Node.js写。为了方便其他语言能更容易地调用，这里采用了以GET/POST传参数，以JSON作为返回的方式。

## Dependencies ##
* 详见[package.json](https://github.com/Equim-chan/csu-ems-api/blob/master/package.json#L17)

## Related ##
* [csu-ems-notify](https://github.com/Equim-chan/csu-ems-notify) - 基于此项目的一个邮件提醒服务

## License ##
* 本项目使用[GPL-3.0](https://github.com/Equim-chan/csu-ems-api/blob/master/LICENSE)授权。

## Initiators ##
[![Donny](https://avatars3.githubusercontent.com/u/22200374?v=3&s=100 "Donny")](https://github.com/Donny-Hikari)
[![Equim](https://avatars3.githubusercontent.com/u/17795845?v=3&s=100 "Equim")](https://github.com/Equim-chan)