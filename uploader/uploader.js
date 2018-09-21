(function (window, $) {
    /**
     * 私有方法-getError
     * @param action
     * @param option
     * @param xhr
     * @returns {Error}
     */
    function getError (action, option, xhr) {
        var msg
        if (xhr.response) {
            msg = xhr.status + ': ' + (xhr.response.error || xhr.response)
        } else if (xhr.responseText) {
            msg = xhr.status + ': ' + xhr.responseText
        } else {
            msg = 'fail to post ' + action + xhr.status
        }

        const err = new Error(msg)
        err.status = xhr.status
        err.method = 'post'
        err.url = action
        return err
    }

    /**
     * 私有方法-getBody
     * @param xhr
     * @returns {*}
     */
    function getBody (xhr) {
        const text = xhr.responseText || xhr.response
        if (!text) {
            return text
        }

        try {
            return JSON.parse(text)
        } catch (e) {
            return text
        }
    }

    /**
     * 私有方法-upload
     * @param option
     * @returns {*}
     */
    function upload (option) {
        if (typeof XMLHttpRequest === 'undefined') {
            return
        }

        var xhr = new XMLHttpRequest()
        var action = option.action

        if (xhr.upload) {
            xhr.upload.onprogress = function progress (e) {
                if (e.total > 0) {
                    e.percent = e.loaded / e.total * 100
                }
                option.onProgress(e)
            }
        }

        var formData = new FormData()

        if (option.data) {
            Object.keys(option.data).map(function (key) {
                formData.append(key, option.data[key])
            })
        }

        formData.append(option.filename, option.file)

        xhr.onerror = function error (e) {
            option.onError(e, xhr)
        }

        xhr.onload = function onload () {
            if (xhr.status < 200 || xhr.status >= 300) {
                return option.onError(getError(action, option, xhr), xhr)
            }

            option.onSuccess(getBody(xhr))
        }

        xhr.open('post', action, true)

        if (option.withCredentials && 'withCredentials' in xhr) {
            xhr.withCredentials = true
        }

        const headers = option.headers || {}

        for (var item in headers) {
            if (headers.hasOwnProperty(item) && headers[item] !== null) {
                xhr.setRequestHeader(item, headers[item])
            }
        }
        xhr.send(formData)
        return xhr
    }

    /**
     * 构造函数主体
     * @param ops
     */
    function uploader (ops) {
        var options = {
            id: '', // *目标元素id
            action: '', // *上传服务器地址
            multiple: false, //
            accept: '*/*', // 接收的文件类型
            // capture: '', // 拍照（camera） 摄像（camcorder） 录音（microphone）
            maxSize: 500 * 1024 * 1024, // 文件大小上限，单位：MB
            withCredentials: false, // http ..
            headers: {}, // http headers
            data: {}, // http data
            name: 'file',
            onStart: function () {
            },
            onProgress: function () {
            },
            onSuccess: function () {
            },
            onError: function () {
            },
            formatUrlFromResponse: function (res) {
                return res
            }
        }
        $.extend(options, ops)
        this.options = options
        this.init()
    }

    /**
     * 原型方法-初始化
     */
    uploader.prototype.init = function () {
        var self = this
        var options = this.options
        var $uploadSelect = $('<div class="upload-select"></div>')
        var $fileInput = $('<input style="display: none;" type="file" />')
        $uploadSelect.click(function (e) {
            console.log(e)
            if (e.target === $fileInput[0]) return
            $(this).find('input').click()
        })

        $fileInput.attr('multiple', options.multiple)
        $fileInput.attr('accept', options.accept)
        // if (options.capture) {
        //     $fileInput.attr('capture', options.capture)
        // }
        $fileInput.change(function (evt) {
            var files = evt.target.files
            if (!files) return
            files = Array.from(files)
            if (!self.options.multiple) files = [files[0]]
            if (files.length <= 0) return
            if (files[0].size > this.maxSize) {
                this.onError('文件过大，请选择较小的文件！')
                return
            }
            files.forEach((function (file) {
                file.state = 'progress'
            }))
            files.forEach(function (file, index) {
                $fileInput.value = null
                self.upload(file, index)
            })
        })

        $("#" + this.options.id).wrap($uploadSelect)
        $("#" + this.options.id).before($fileInput)
    }
    /**
     * 原型方法-上传功能主要逻辑
     * @param file
     * @param index
     */
    uploader.prototype.upload = function (file, index) {
        this.post(file, index)
    }
    /**
     * 原型方法-上传数据
     * @param file
     * @param index
     */
    uploader.prototype.post = function (file, index) {
        var self = this
        self.options.onStart(file)
        var req_options = {
            headers: self.options.headers,
            file: file,
            data: self.options.data,
            filename: self.options.name,
            action: self.options.action,
            onProgress: function (e) {
                self.options.onProgress(e, file)
            },
            onSuccess: function (res) {
                file.state = 'done'
                file.url = self.options.formatUrlFromResponse(res)
                self.options.onSuccess(res, file)
            },
            onError: function (err, res) {
                file.state = 'error'
                self.options.onError(err, res, file)
            }
        }
        upload(req_options)
    }
    // 全局赋值
    window.Uploader = uploader
})(window, jQuery)
