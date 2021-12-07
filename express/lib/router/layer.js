const pathToRegExp = require('path-to-regexp')

function Layer(path, handler) {
  this.path = path
  this.handler = handler
  // 所有的layer中都会存放路径 ， 我就将这个路径转成正则
  this.keys= []
  this.regExp = pathToRegExp(this.path, this.keys, true)
}

Layer.prototype.match = function (pathname) {
  // 中间件只要是 / 就都满足
  // 中间件 /a  可以访问 /a/b
  if (this.path === pathname) {
    return true
  }

  let matches = pathname.match(this.regExp); // 用请求的路径和正则进行匹配
  if (matches) {
    let params = this.keys.reduce((memo, key, index) => {
      memo[key.name] = matches[index + 1]
      return memo
    }, {})
    this.params = params
    return true
  }

  if (!this.route) {
    if (this.path === '/') {
      return true
    }
    return pathname.startsWith(this.path + '/')
  }

  return false
}

Layer.prototype.handle_error = function(err, req, res, next) {
  if (this.handler.length === 4) { // 如果有 4 个参数就是错误中间件
    this.handler(err, req, res, next)
  } else {
    next(err)
  }
}

Layer.prototype.handle_request = function(req, res, next) {
  return this.handler(req, res, next)
}

module.exports = Layer