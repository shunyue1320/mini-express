const methods = require('methods')
const Layer = require('./layer')

function Route() {
  this.stack = []
  this.methods = {}
}

// 作用： 依次执行 route 
Route.prototype.dispatch = function (req, res, out) {
  let idx = 0

  // 内层-洋葱模型核心逻辑
  const next = (err) => {
    if (idx >= this.stack.length) {
      return out(err) // out 是外出的 next 方法， 内层执行完毕就回到外层继续执行
    }
    let layer = this.stack[idx++]
    if (layer.method === req.method.toLowerCase()) {
      layer.handle_request(req, res, next)
    } else {
      next()
    }
  }
  next()
}

// 判断当前 Route 是否某个请求类型 比如: get, post ...
Route.prototype.match_method = function(method) {
  return this.methods[method]
}


methods.forEach(method => {
  Route.prototype[method] = function (handlers) {
    handlers.forEach(handler => {
      let layer = new Layer('/', handler) // 路径默认 ‘/’
      layer.method = method
      this.stack.push(layer) // 里层的route存放的是用户的真实回调， 并且每个layer上有标记对应的方法
    })
    console.log("=====this.stack===", this.stack)
    this.methods[method] = true // 增加存储的方法标识 { get: true }
  }
})

module.exports = Route