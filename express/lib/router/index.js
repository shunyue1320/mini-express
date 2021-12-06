const url = require('url')
const Layer = require('./layer')
const Route = require('./route')
const methods = require('methods')

let proto = {}

function Router() {
  let router = (req, res, next) => {

  }
  router.stack = []
  router.__proto__ = proto // 原型链继承：外部可以 router.get, router.post ... 访问 
  return router
}

// 中间件率先存到 stack 中， 每次请求过来就会遍历 stack 执行
proto.use = function(handler) {
  let offset = 0;
  let path = '/'   // path 默认为 /
  if (typeof handler !== 'function') {
    offset = 1
  }

  // 拿到所有中间件方法 遍历存到 stack 中
  let handlers = Array.from(arguments).slice(offset)
  if (handlers.length === 0) {
    handlers = [handler]
  }
  handlers.forEach(handler => {
    let layer = new Layer(path, handler)
    layer.route = undefined
    this.stack.push(layer)
  })
}


// 遍历创建所有请求监听方法放在 router 上  有：router.get, router.post ...
methods.forEach((method) => {
  proto[method] = function(pathname, handlers) {
    if (!Array.isArray[handlers]) {
      handlers = Array.from(arguments).slice(1) // 是函数变成数组
    }

    const route = new Route() // 每个请求类型一个 new Route()
    const layer = new Layer(pathname, route.dispatch.bind(route)) // 每个请求类型一个 new Layer
    layer.route = route
    this.stack.push(layer)
    route[method](handlers) // route 存放用户的路由监听方法
  }
})

// 开启端口服务时，执行此方法： 注册所有用户写的路由监听
proto.handle = function(req, res, out) {
  let { pathname } = url.parse(req.url)
  let method = req.method.toLowerCase()

  let idx = 0
  let removed = ''
  const next = (err) => {
    if (idx >= this.stack.length) {
      return out() // 执行结束还没相应说明没有该接口 返回 404：Cannot GET /xxx
    }
    let layer = this.stack[idx++]
    if (removed.length > 0) {
      req.url = removed + req.url
      removed = ''
    }

    if (err) {
      if (!layer.route) { // 没有 layer.route 的 layer 是中间件
        layer.handle_error(err, req, res, next) // 内部会看一下是不是错误处理中间
      } else {
        next(err)         // 如果不是中间件 就继续找下面的 
      }
    } else {
      // 路由和中间件的区别在于 中间件 不需要匹配方法，只要路径匹配即可
      // 无论路由还是中间件路径要先匹配成功, 如果是路由还要匹配方法
      
    }
  }

  next()
}

module.exports = Router