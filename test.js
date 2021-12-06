const express = require('express')
// const express = require('./express') // 自己实现的 express

const app = express()

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
  console.log(2)
  res.end('end')
})


app.listen(3000, () => {
  console.log('开启服务成功 端口：3000')
})