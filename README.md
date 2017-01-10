# CSU-EMS-API #
[![Build Status](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/badges/build.png?b=master)](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/build-status/master) [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/Equim-chan/csu-ems-api/?branch=master) [![GPLv3](https://img.shields.io/badge/Lisence-GPLv3-blue.svg)](https://github.com/Equim-chan/csu-ems-api/blob/master/LICENSE)

中南大学教务管理系统API，基于Node.js  
__尚未完成，不管是代码还是这篇文档__

## TODO ##
_(Section WIP)_
* 完成新成绩Email提醒
* ...

## APIs ##
_(Section WIP)_

### 获取所有有效成绩和挂科列表 ###
* 路径: `/grades/`
* 方法: `GET`
* 必要参数:

  ```JSON
  {
    "id": "用户名，一般是学号",
    "pwd": "密码"
  }
  ```
* 成功返回:

  ```JavaScript
  {
    "name": "该学生的名字",
    "id": "用户名",
    "grades": {
      // 所有有成绩的科目与相应成绩
      "课程名称": "分数",
      // ...
    },
    "subject-count": "有成绩科目的数量",
    "failed": {
      // 所有挂科的科目与相应成绩
      "课程名称": "分数",
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
* 路径: `/exams/`
* 方法: `GET`
* 必要参数:

  ```JSON
  {
    "id": "用户名，一般是学号",
    "pwd": "密码"
  }
  ```
* 成功返回:

  ```JavaScript
  {
    "name": "该学生的名字",
    "id": "用户名",
    "exams": [{
      "subject": "科目名称"
      "time": "考试时间",
      "location": "考试地点",
      "seat": "座位号"
    }, {
      // ...
    }]
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
$ sudo pm2 start -i 0 --name "csuapi" --watch true app.js
```

### 获取帮助 ###
```shell
$ node app.js -h
```

## Dependencies ##
* 详见[package.json](https://github.com/Equim-chan/csu-ems-api/blob/master/package.json#L17)

## Lisence ##
* 本项目使用[GPL-3.0](https://github.com/Equim-chan/csu-ems-api/blob/master/LICENSE)授权。

## Initiators ##
[![Donny](https://avatars3.githubusercontent.com/u/22200374?v=3&s=100 "Donny")](https://github.com/Donny-Hikari)
[![Equim](https://avatars3.githubusercontent.com/u/17795845?v=3&s=100 "Equim")](https://github.com/Equim-chan)