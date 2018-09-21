import axios from 'axios'
const AUTH_FAIL = 90005
const instance = axios.create()
// 为实例添加“请求”拦截
instance.interceptors.request.use(function (config) {
  // Do something before request is sent
  if (localStorage.getItem('token')) {
    config.headers.common['X-TOKEN'] = localStorage.getItem('token')
  }
  return config
}, function (error) {
  // Do something with request error
  return Promise.reject(error)
})
// 为实例添加“响应”拦截
instance.interceptors.response.use(function (response) {
  console.log('interceptors.response: ' + response)
  // 拦截：权限校验
  // 1.判断token是否失效
  if (response.data && response.data.code === AUTH_FAIL) {
    // 执行重新授权操作
    localStorage.removeItem('token')
    // wechatAuth_2_0({
    //   redirect_uri: window.location.href
    // })
  }
  return response
}, function (error) {
  return Promise.reject(error)
})

function createAPI (baseURL) {
  return function (conf) {
    conf = conf || {}
    // conf.url = (process.env.NODE_ENV === 'production') ? conf.url : conf.url + DEBUG_AUTH
    return instance(Object.assign({}, {
      // TODO: 删除debugUserId
      // url: conf.url + '?debugUserId=oAIed0b7-BiDzrX9cAJqNO2vafHg',
      url: conf.url,
      baseURL: baseURL,
      method: conf.method
    }, conf.opts))
  }
}

export {
  createAPI
}
