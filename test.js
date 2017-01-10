/* TODO:
 * 用参数自定义端口
 */
"use strict"

var http = require('http'),
    express = require('express'),
    superagent = require('superagent'),
    cheerio = require('cheerio'),
    escaper = require('true-html-escape'),
    colors = require('colors'),
    fs = require('fs'),
    Date = require('./lib/Date.js');

var options = {
  host: '127.0.0.1',
  port: '2333',
  path: '/?id=0918150203&pwd=Dbb%2B961206'
};

http
    .request(options, function(response) {})
    .end();