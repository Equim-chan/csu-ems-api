<!-- 用Markdown Preview渲染时注意：
    * 将title改为"(っ'ヮ'c)"
    * 可以加上ico，如<link rel="icon" href="http://equimcute.com/res/icon/head.ico" type="image/x-ico">
    * body的width改为55em
    * 将所有的"user-content-"字符串替换为空
-->

# CSU-EMS API文档 #

| Key | Value |
|:---:| --- |
| 远程仓库 | https://github.com/Equim-chan/csu-ems-api.git |
| 当前版本 | 2.2.1 (170121) |
| 维护者 | [Equim](https://github.com/Equim-chan) |
| 许可协议 | [GPLv3](https://github.com/Equim-chan/csu-ems-api/blob/master/LICENSE) |

## 目录 ##
- [获取成绩和挂科列表](#获取成绩和挂科列表)
- [获取考试安排表](#获取考试安排表)
- [选某一节课](#选某一节课)
- [获取API文档](#获取api文档)

---

### 获取成绩和挂科列表 ###
* 路径: `/g` 或 `/grades`
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
    "sem": "学期，格式为形如'2016-2017-1'的满足正则表达式/^20\d{2}-20\d{2}-[1-2]$/的字符串。如未指定，则会获取所有学期的成绩",
    "details": "如指定，则返回值中会包含各课程的编号、学分、属性、性质等详情"
  }
  ```
* 成功返回:

  ```JavaScript
  {
    "name": "该学生的名字", //string
    "id":   "用户名", //string
    "grades": { //object
      "课程名称": { //object
        "sem":     "获取该成绩的学期，注意，如果有补考记录，则只会记录成绩最高的那个", //string
        "reg":     "平时成绩", //string
        "exam":    "期末成绩", //string
        "overall": "最终成绩", //string
        "id":      "只在指定了details时包含。课程编号", //string
        "attr":    "只在指定了details时包含。课程属性", //string
        "genre":   "只在指定了details时包含。课程性质", //string
        "credit":  "只在指定了details时包含。学分" //string
      },
      // ...
    },
    "subject-count": "有成绩科目的数量", //number
    "failed": { //object
      "课程名称": { //object
        "sem":     "学期，同上", //string
        "reg":     "平时成绩", //string
        "exam":    "期末成绩", //string
        "overall": "最终成绩", //string
        "id":      "只在指定了details时包含。课程编号", //string
        "attr":    "只在指定了details时包含。课程属性", //string
        "genre":   "只在指定了details时包含。课程性质", //string
        "credit":  "只在指定了details时包含。学分" //string
      },
      // ...
    },
    "failed-count": "挂科科目的数量" //number
  }
  ```
* 失败返回:

  ```JavaScript
  {
    "error": "错误原因" //string
  }
  ```

[↑返回顶端](#csu-ems-api文档)

---

### 获取考试安排表 ###
* 路径: `/e` 或 `/exams`
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
    "name": "该学生的名字", //string
    "id":   "用户名", //string
    "sem":  "学期" //string
    "exams": { //object
      "科目名称": { //object
        "time":     "考试时间", //string
        "location": "考试地点", //string
        "seat":     "座位号" //string
      },
      // ...
    },
    "exams-count": "该学期的考试个数" //number
  }
  ```

* 失败返回:

  ```JavaScript
  {
    "error": "错误原因" //string
  }
  ```

[↑返回顶端](#csu-ems-api文档)

---

### 选某一节课 ###
__尚未实现__

[↑返回顶端](#csu-ems-api文档)

---

### 获取API文档 ###
* 路径：`/doc`
* 方法：`GET`

[↑返回顶端](#csu-ems-api文档)

---
