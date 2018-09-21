/**
 * SCOOPER Alert JavaScript library
 * browser support: IE8+, Chrome, FireFox
 * 3rd-part library request: require.js, jquery
 * scooper library request: scooper.util.js
 *
 * @author jiangwj 2016-04
 */
(function (window, factory) {
    if (typeof define === 'function' && define.amd) {
        define('scooper.alert', ['jquery', 'scooper.util'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = window.document ?
            factory(jQuery) :
            factory(require('jquery'));
    } else {
        factory(jQuery);
    }
}(typeof window !== 'undefined' ? window : this, function ($) {
    "use strict";
    window.scooper = window.scooper || {};
    if (window.scooper.alert) return;

    //在多框架程序中，在顶层框架中弹出信息

    //判断当前页面是否引入过 scooper.util
    if (typeof(scooper.util) == "undefined") throw new Error('scooper.util.js is required!');

    /**
     * 统一的弹出消息处理
     */
    function SCAlert () {
        var self = this;

        /** 消息处理函数，可自定义（覆写该函数后可自己创建弹出消息） */
        this.messageHandler = defaultMessageHandler;
        /** 消息渲染器 */
        this.messageRenderer = new DefaultAlertRenderer();

        //
        function processMessage (type, title, content) {
            content = content || title;
            if (self.messageHandler) {
                self.messageHandler({
                    'type': type,
                    'title': title,
                    'content': content
                });
            }
            // TODO 判定是否处于顶层框架，是否跨域；下层框架向顶层框架传递消息，消息在顶层框架中显示出来。
        }

        function defaultMessageHandler (o) {
            // {type,title,content}
            self.messageRenderer.show(o);
        }

        //
        this.message = function (title, content) {
            processMessage('info', title, content);
        };
        this.error = function (title, content) {
            processMessage('error', title, content);
        };
        this.warn = function (title, content) {
            processMessage('warn', title, content);
        };
    }

    /**
     * 弹出消息渲染器
     */
    function DefaultAlertRenderer () {
        var self = this;
        //
        this.show = function (o) {
            // TODO 网页中的弹出层
            window.alert(o.content);
        };
        this.close = function (id) {
            //
        };
    }

    window.scooper.SCAlert = SCAlert;
    return window.scooper.alert = new SCAlert();
}));
