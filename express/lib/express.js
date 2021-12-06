const Application = require('./applcation')
const Router = require('./router')

function createApplication() {
  return new Application()
}
createApplication.Router = Router

module.exports = createApplication