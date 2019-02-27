(function (window, $) {
    /**
     * 构造函数
     * @param opt
     */
    function locationUtil (opt) {
        this.key = null
        var key = opt.key || ''
        if (key) {
            this.key = key
        } else {
            console.error('请在实例化时，设置高德app key！ new locationUtil({key: "<Your Key>"})')
        }
    }
    // 原型变量
    var p = locationUtil.prototype
    /**
     * 将其他厂商坐标转化成高德坐标
     * @param opts
     */
    p.getGaodeLocation = function(opts) {
        var config = {
            key: this.key,
            locations: ''
        }
        $.extend(config, opts)
        return $.ajax({
            url: 'https://restapi.amap.com/v3/assistant/coordinate/convert',
            type: 'get',
            data: config
        })
    }
    /**
     * 将其他厂商坐标直接转化成中文地址
     * @param opt
     */
    p.getGaodeFormateAddress = function (opt) {
        var config = {
            locations: ''
        }
        var self = this
        $.extend(config, opt)
        if (!config.locations) {
            console.error('请传入locations参数')
            return
        }
        return this.getGaodeLocation({
            locations: config.locations,
            coordsys: config.coordsys
        }).then(function (result) {
            return self.getGaodeLocationFormateByCoord(result)
        }).then(function (result) {
            return result
        })
    }
    /**
     * 将其他厂商的坐标转化成高德坐标
     * @param result
     */
    p.getGaodeLocationFormateByCoord = function (result) {
        var key = this.key
        return $.ajax({
            url: 'https://restapi.amap.com/v3/geocode/regeo',
            type: 'get',
            data: {
                key: key,
                location: result.locations,
                radius: result.radius || '1000',
                extensions: result.extensions || 'all',
                output: result.output || 'json',
            }
        })
    }

    window.AmapLocationUtil = locationUtil
})(window, jQuery)
