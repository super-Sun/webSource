import { createAPI } from '../util'
import { env } from '../config'

const baseUrl = {
  mock: 'http://192.168.0.151:7300/mock/5b63c4652df4ee546794357f/bjkskc', // mock环境
  dev: 'http://www.ljkj.com/api', // 开发环境
  pre: 'http://bjjj-test.lujingkeji.cn/api', // 预发布环境
  prod: 'http://bjjj.lujingkeji.cn/api', // 生产环境
  test: 'http://bjjj-test.lujingkeji.cn/api' // 测试环境
}[env]

export default createAPI(baseUrl)
