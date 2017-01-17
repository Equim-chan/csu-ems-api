# 中南教务API #
[![Build Status](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/badges/build.png?b=master)](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/build-status/master) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/?branch=master) [![GPLv3](https://img.shields.io/badge/Lisence-GPLv3-blue.svg)](https://github.com/Equim-chan/csu-ems-api/blob/master/LICENSE)

中南大学教务管理系统API，基于Node.js  
__尚未完成，不管是代码还是这篇文档__

- [APIs](#apis)
  - [获取所有成绩和挂科列表](#获取所有成绩和挂科列表)
  - [获取考试安排表](#获取考试安排表)
- [Setup](#Setup)
  - [快速部署](#快速部署)
  - [稳定部署(以pm2作为daemon)](#稳定部署以pm2作为daemon)
  - [获取帮助](#获取帮助)
- [FAQ](#faq)
- [Dependencies](#dependencies)
- [License](#license)
- [Initiators](#initiators)

## APIs ##

版本：2.0.1

### 获取所有成绩和挂科列表 ###
* 路径: `/grades`
* 方法: `GET`
* 必要参数:

  ```JSON
  {
    "id": "用户名，一般是学号",
    "pwd": "密码"
  }
  ```
* 可选参数:

  ```JavaScript
    // ...
    "sem": "学期，格式为形如'2016-2017-1'的满足正则表达式/^20\d{2}-20\d{2}-[1-2]$/的字符串。如未指定，则会获取所有学期的成绩"
  }
  ```
* 成功返回:

  ```JavaScript
  {
    "name": "该学生的名字",
    "id": "用户名",
    "grades": {
      "课程名称": {
        "sem": "获取该成绩的学期，注意，如果有补考记录，则只会记录成绩最高的那个",
        "regular": "平时成绩",
        "exam": "期末成绩",
        "overall": "最终成绩"
      },
      // ...
    },
    "subject-count": "有成绩科目的数量",
    "failed": {
      "课程名称": {
        "sem": "学期，同上",
        "regular": "平时成绩",
        "exam": "期末成绩",
        "overall": "最终成绩"
      },
      // ...
    },
    "failed-count": "挂科科目的数量"
  }
  ```
* 失败返回:

  ```JavaScript
  {
    "error": "错误原因"
  }
  ```
  
### 获取考试安排表 ###
* 路径: `/exams`
* 方法: `GET`
* 必要参数:

  ```JSON
  {
    "id": "用户名，一般是学号",
    "pwd": "密码"
  }
  ```
* 可选参数:

  ```JavaScript
    // ...
    "sem": "学期。如未指定，则会自动获取当前学期"
  }
  ```
* 成功返回:

  ```JavaScript
  {
    "name": "该学生的名字",
    "id": "用户名",
    "sem": "学期"
    "exams": {
      "科目名称": {
        "time": "考试时间",
        "location": "考试地点",
        "seat": "座位号"
      },
      // ...
    },
    "exams-count": "该学期的考试个数"
  }
  ```
* 失败返回:

  ```JavaScript
  {
    "error": "错误原因"
  }
  ```
  
  
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
  * 因为方便。比如cheerio这个包可以很方便地通过jQuery来查询DOM元素。
* 为什么要做成绑定端口的形式，而不是一个Node包？
  * 出于几点考虑。首先要把Node.js程序打包成一个无依赖的库目前还是件比较麻烦的事，如果以Node.js包的形式写的话，上面的应用可能就也只能用Node.js写。为了方便其他语言能更容易地调用，这里采用了以GET/POST传参数，以JSON作为返回的方式。

## Dependencies ##
* 详见[package.json](https://github.com/Equim-chan/csu-ems-api/blob/master/package.json#L17)

## License ##
* 本项目使用[GPL-3.0](https://github.com/Equim-chan/csu-ems-api/blob/master/LICENSE)授权。

## Initiators ##
[![Donny](https://avatars3.githubusercontent.com/u/22200374?v=3&s=100 "Donny")](https://github.com/Donny-Hikari)
[![Equim](https://avatars3.githubusercontent.com/u/17795845?v=3&s=100 "Equim")](https://github.com/Equim-chan)