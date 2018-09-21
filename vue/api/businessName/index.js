import instance from './instance'

/** 协辅警base64签字图片上传接口 */
function file_uploadSignBase64_post (opts) {
  return instance({
    method: 'post',
    url: '/file/uploadSignBase64',
    opts: opts
  })
}

/** 提交补充证据照片 */
function acci_doWriteOthterEvidence_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/doWriteOthterEvidence',
    opts: opts
  })
}

/** 文件上传接口 */
function file_uploadAndTrans_post (opts) {
  return instance({
    method: 'post',
    url: '/file/uploadAndTrans',
    opts: opts
  })
}

/** 获取事故主表简项信息 */
function acci_getSimpleAcciMessage_get (opts) {
  return instance({
    method: 'get',
    url: '/acci/getSimpleAcciMessage',
    opts: opts
  })
}

/** 事故正常或强制结束上传 */
function acci_doWriteAcciDisagreeResult_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/doWriteAcciDisagreeResult',
    opts: opts
  })
}

/** base64图片上传接口 */
function file_uploadBase64_post (opts) {
  return instance({
    method: 'post',
    url: '/file/uploadBase64',
    opts: opts
  })
}

/**  */
function sms_checkVerifyCode3_post (opts) {
  return instance({
    method: 'post',
    url: '/sms/checkVerifyCode3',
    opts: opts
  })
}

/**  */
function sms_sendVerifyCode3_post (opts) {
  return instance({
    method: 'post',
    url: '/sms/sendVerifyCode3',
    opts: opts
  })
}

/** 微信接入Core校验 */
function user_CoreCheck_get (opts) {
  return instance({
    method: 'get',
    url: '/user/CoreCheck',
    opts: opts
  })
}

/** 推送微信模版 */
function user_Push_post (opts) {
  return instance({
    method: 'post',
    url: '/user/Push',
    opts: opts
  })
}

/**  */
function sms_checkVerifyCode2_post (opts) {
  return instance({
    method: 'post',
    url: '/sms/checkVerifyCode2',
    opts: opts
  })
}

/** 文件上传接口 */
function file_upload_post (opts) {
  return instance({
    method: 'post',
    url: '/file/upload',
    opts: opts
  })
}

/**  */
function sms_sendVerifyCode2_post (opts) {
  return instance({
    method: 'post',
    url: '/sms/sendVerifyCode2',
    opts: opts
  })
}

/** 获取事故现场照片 */
function acci_getSgPic_get (opts) {
  return instance({
    method: 'get',
    url: '/acci/getSgPic',
    opts: opts
  })
}

/** 文件下载接口 */
function file_download_id_get (opts) {
  return instance({
    method: 'get',
    url: convertRESTAPI('/file/download/{id}', opts),
    opts: opts
  })
}

/**  */
function sms_sendVerifyCode_post (opts) {
  return instance({
    method: 'post',
    url: '/sms/sendVerifyCode',
    opts: opts
  })
}

/** 获取系统配置信息 */
function sys_getSysConfig_post (opts) {
  return instance({
    method: 'post',
    url: '/sys/getSysConfig',
    opts: opts
  })
}

/** 回调地址通过code获取openid */
function user_Login_get (opts) {
  return instance({
    method: 'get',
    url: '/user/Login',
    opts: opts
  })
}

/** 补充事故基本信息 */
function acci_doWriteAcciMessage_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/doWriteAcciMessage',
    opts: opts
  })
}

/** 补充事故基本信息 */
function acci_doWriteAcciMessage2_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/doWriteAcciMessage2',
    opts: opts
  })
}

/** 事故确认结果上传 */
function acci_doWriteAcciResult_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/doWriteAcciResult',
    opts: opts
  })
}

/** 获取事故主表信息 */
function acci_getAcciMessage_get (opts) {
  return instance({
    method: 'get',
    url: '/acci/getAcciMessage',
    opts: opts
  })
}

/** 获取任务详情 */
function acci_getAcciTask_get (opts) {
  return instance({
    method: 'get',
    url: '/acci/getAcciTask',
    opts: opts
  })
}

/** 根据调解员userid获取名下所有调度任务 */
function acci_getAllAcciTask_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/getAllAcciTask',
    opts: opts
  })
}

/** 获取当事人确认状态 */
function acci_getDsrQrzt_get (opts) {
  return instance({
    method: 'get',
    url: '/acci/getDsrQrzt',
    opts: opts
  })
}

/** 获取调解员当前签到签退状态 */
function acci_getSign_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/getSign',
    opts: opts
  })
}

/**  */
function sms_checkVerifyCode_post (opts) {
  return instance({
    method: 'post',
    url: '/sms/checkVerifyCode',
    opts: opts
  })
}

/** 任务单清空重新处理 */
function acci_doRollback_get (opts) {
  return instance({
    method: 'get',
    url: '/acci/doRollback',
    opts: opts
  })
}

/** 调解员userid签到签退 */
function acci_doSign_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/doSign',
    opts: opts
  })
}

/** 接受任务生成事故主表 */
function acci_doStart_get (opts) {
  return instance({
    method: 'get',
    url: '/acci/doStart',
    opts: opts
  })
}

/** 补充当事人照片证据信息 */
function acci_doWriteAcciDsrEvidence_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/doWriteAcciDsrEvidence',
    opts: opts
  })
}

/** 补充事故照片证据信息 */
function acci_doWriteAcciEvidence_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/doWriteAcciEvidence',
    opts: opts
  })
}

/** 当事人指纹图上传 */
function acci_doWriteAcciFinger_post (opts) {
  return instance({
    method: 'post',
    url: '/acci/doWriteAcciFinger',
    opts: opts
  })
}

/** 统计当事人近N年内事故数 */
function acci_doQueryCountAcci_get (opts) {
  return instance({
    method: 'get',
    url: '/acci/doQueryCountAcci',
    opts: opts
  })
}

export {
  file_uploadSignBase64_post,
  acci_doWriteOthterEvidence_post,
  file_uploadAndTrans_post,
  acci_getSimpleAcciMessage_get,
  acci_doWriteAcciDisagreeResult_post,
  file_uploadBase64_post,
  sms_checkVerifyCode3_post,
  sms_sendVerifyCode3_post,
  user_CoreCheck_get,
  user_Push_post,
  sms_checkVerifyCode2_post,
  file_upload_post,
  sms_sendVerifyCode2_post,
  acci_getSgPic_get,
  file_download_id_get,
  sms_sendVerifyCode_post,
  sys_getSysConfig_post,
  user_Login_get,
  acci_doWriteAcciMessage_post,
  acci_doWriteAcciMessage2_post,
  acci_doWriteAcciResult_post,
  acci_getAcciMessage_get,
  acci_getAcciTask_get,
  acci_getAllAcciTask_post,
  acci_getDsrQrzt_get,
  acci_getSign_post,
  sms_checkVerifyCode_post,
  acci_doRollback_get,
  acci_doSign_post,
  acci_doStart_get,
  acci_doWriteAcciDsrEvidence_post,
  acci_doWriteAcciEvidence_post,
  acci_doWriteAcciFinger_post,
  acci_doQueryCountAcci_get
}
