const url = require('url')
const Layer = require('./layer')
const Route = require('./route')
const methods = require('methods')

let proto = {}

function Router() {
  let router = (req, res, next) => {
    router.handle(req, res, next)
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
    path = handler
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
    if (!Array.isArray(handlers)) {
      handlers = Array.from(arguments).slice(1) // 是函数变成数组
    }

    const route = new Route() // 每个请求类型一个 new Route()
    const layer = new Layer(pathname, route.dispatch.bind(route)) // 每个请求类型一个 new Layer
    layer.route = route

    // 第一层 layer 内的 handler 方法是 route.dispatch
    this.stack.push(layer)
    route[method](handlers) // route 存放用户的路由监听方法
  }
})

// 开启端口服务时，执行此方法： 拦截响应 洋葱模型触发路由监听
proto.handle = function(req, res, out) {
  let { pathname } = url.parse(req.url)

  let idx = 0
  let removed = ''


  // 外层-洋葱模型核心逻辑
  const next = (err) => {
    // 执行结束还没相应说明没有该接口 返回 404：Cannot GET /xxx
    if (idx >= this.stack.length) {
      return out()
    }

    // 获取下一个 layer， 并处理 url
    let layer = this.stack[idx++]
    if (removed.length > 0) {
      req.url = removed + req.url
      removed = ''
    }


    // 走请求错误逻辑
    if (err) {
      if (!layer.route) { // 没有 layer.route 的 layer 是中间件
        layer.handle_error(err, req, res, next) // 内部会看一下是不是错误处理中间
      } else {
        next(err)         // 如果不是中间件 就继续找下面的 
      }

      // 走请求正确逻辑
    } else {
      // console.log("pathname => 11111", pathname,  layer)
      if (layer.match(pathname)) {
        if (!layer.route) { // 是中间件 4个参数

          // 走中间件逻辑
          if (layer.handler.length !== 4) {
            // 进入到中间件后我们将中间件路径删除掉
            removed = layer.path !== '/' ? layer.path : ''; // 要删除的部分
            req.url = req.url.slice(removed.length) // 进入中间件后的路径

            layer.handle_request(req, res, next); // 调用中间件绑定的方法 如：app.use(express.static('public')); 中的 express.static('public') 返回的方法
          } else {
            next()  // 不是4个参数跳过 继续向下找
          }

        } else {

          // 走用户路由逻辑
          if (layer.route.match_method(req.method.toLowerCase())) { // 判断请求类型是否相同
            req.params = layer.params || {}
            layer.handle_request(req, res, next) // 调用 route.dispatch 方法
          } else {
            next() // 请求类型不同继续向下找
          }
        }

      } else {
        next()
      }
    }
  }

  next()
}

module.exports = Router