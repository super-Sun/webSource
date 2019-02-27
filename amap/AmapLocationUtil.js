(function (window, $) {
    /**
     * 构造函数
     * @param opt
     */
    function AmapLocationUtil (opt) {
        this.key = null
        var key = opt.key || ''
        if (key) {
            this.key = key
        } else {
            console.error('请在实例化时，设置高德app key！ new locationUtil({key: "<Your Key>"})')
        }
    }

    // 原型变量
    var p = AmapLocationUtil.prototype
    /**
     * 将其他厂商坐标转化成高德坐标
     * @param opts
     */
    p.getAmapLocation = function (opts) {
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
    p.getAmapFormateAddress = function (opt) {
        var config = {
            location: ''
        }
        var self = this
        var amapLocations = null
        $.extend(config, opt)
        if (!config.location) {
            console.error('请传入location参数')
            return {}
        }
        return this.getAmapLocation({
            locations: config.location,
            coordsys: config.coordsys
        }).then(function (result) {
            if (result.status == '1') {
                amapLocations = {
                    lng: result.locations.split('|')[0] && result.locations.split('|')[0].split(',')[0],
                    lat: result.locations.split('|')[0] && result.locations.split('|')[0].split(',')[1]
                }
                return self.getAmapLocationFormateByCoord(Object.assign({}, config, result))
            } else {
                amapLocations = null
                return result
            }
        }).then(function (result) {
            if (result && result.regeocode && amapLocations) {
                result.regeocode.amapLocations = amapLocations
            }
            return result
        })
    }
    /**
     * 将高德坐标直接转化成中文地址
     * @param result
     */
    p.getAmapLocationFormateByCoord = function (result) {
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
    window.AmapLocationUtil = AmapLocationUtil
})(window, jQuery)
