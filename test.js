// const express = require('express')
const express = require('./express2') // 自己实现的 express

const app = express()

const router = express.Router();

app.use((eq, res, next) => {
  console.log('中间件1')
  next()
},(eq, res, next) => {
  console.log('中间件2')
  next()
})
app.get('/', function(req, res, next) {
  console.log(1)
  next()
}, function(req, res, next) {
  console.log(11)
  next()
}, function(req, res, next) {
  console.log(111)
  next()
}, function(req, res, next) {
  console.log(111)
  next()
})

app.get('/', function(req, res, next) {
  console.log(1.1)
  next()
})

app.get('/', function(req, res, next) {
  console.log(2)
  res.end('end')
})

// 路由
router.get('/add',function(req,res,next){
  res.end('添加');
})
router.post('/remove',function(req,res,next){
  res.end('删除')
})
app.use('/user',router);


app.listen(3000, () => {
  console.log('开启服务成功 端口：3000')
})