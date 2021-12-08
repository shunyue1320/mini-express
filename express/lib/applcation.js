const fs = require('fs')
const http = require('http')
const mime = require('mime') // 基于MIME db模块的综合MIME类型映射API 用于设置文件相应头
const methods = require('methods') // 就是一个存放请求类型的数组 [ 'get', 'post', 'put', 'head', 'delete', 'options', ... ]
const statuses = require('statuses') // 状态码

const Router = require('./router')
function Application() {

}

// 懒加载 router 用到 Router 时才创建
Application.prototype.lazy_route = function() {
  if (!this.router) {
    this.router = new Router() // 路由创建懒加载 
    
    // 自身初始化一个中间件扩展
    this.use((req, res, next) => {
      res.send = function (data) {
        if (typeof data == 'object') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } else if (Buffer.isBuffer(data) || typeof data === 'string') {
          res.end(data)
        } else if (typeof data === 'number') {
          res.statusCode = data
          res.end(statuses[data])
        }
      }

      res.sendFile = function(filepath) {
        // mime 设置返回类型
        res.setHeader('Content-Type', mime.getType(filepath) + ';cherset=utf-8')
        fs.createReadStream(filepath).pipe(res)
      }

      next(); // 所有请求都先经过此中间件后，在执行用户注册的中间件与路由
    })
  }
}


Application.prototype.use = function() {
  this.lazy_route()
  this.router.use(...arguments) // 用户注册的中间件
}

// 遍历创建所有请求监听方法放在 express 上  有：app.get, app.post ...
methods.forEach((method) => {
  Application.prototype[method] = function(pathname, ...handlers) {
    this.lazy_route()
    this.router[method](pathname, handlers) // 内部其实就是调用 router.get, router.post ...
  }
})

Application.prototype.listen = function () {
  console.log("========||======", this.router.stack)
  console.log("========||======", this.router.stack[this.router.stack.length - 1].handler)
  console.log("========||======", JSON.stringify(this.router.stack))
  const server = http.createServer((req, res) => {
    function done() {
      res.end(`Canont ${req.method} ${req.url}`)
    }
    this.lazy_route()
    this.router.handle(req, res, done) // 开启服务前注册所有用户写的路由监听
  })

  // 通过 http 开启端口服务
  server.listen(...arguments)
}

module.exports = Application