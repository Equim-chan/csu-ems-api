'use strict';

Date.prototype.format = function (format) {
    var week = ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    var season = ["春", "夏", "秋", "冬"];
    var date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": season[Math.floor(this.getMonth() / 3)],
        "w+": week[this.getDay()]
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    if (/(S+)/.test(format)) {
        format = format.replace(RegExp.$1, (this.getMilliseconds() + '').substr(0, RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ?
                     date[k] :
                     ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
};

module.exports = Date;
