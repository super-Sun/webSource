;(function (global, factory) {
    factory();
})(this, function () {
    // 1.定义构造函数
    var jQuery = function () {
        return new jQuery.prototype.init(arguments);
    };
    // 2.定义原型对象
    jQuery.fn = jQuery.prototype = {
        constructor: jQuery,
        // 创建实例执行的构造方法
        init: function (arg) {
            //
            var selector = arguments[0];
            // 1. selector === $('') / $(null) / $(undefined) / $(false)
            // 2. selector === $(documentElements)
            // 3. selector === $('string') ==> $('#id') / $('.className') / $('htmlString')
            // 4. selector === $(function)
            // 5. selector === $( $(dom) )

        },
        selector:  '',
        version: '',
        length: '',
        // 其他属性和方法
        // .
        // .
        // .
    };
    // 3.定义原型对象方法init.prototype指向jQuery.prototype
    jQuery.fn.init.prototype = jQuery.prototype;
    // 4.定义extend方法
    jQuery.prototype.extend = jQuery.extend = function () {
        var length = arguments.length;
        var target = arguments[0] || {};
        var i = 1;
        // 只含有一个对象
        if (length == 1) {
            target = this;
            i = 0
        }
        if (typeof target === 'object' &&  Object.prototype.toString.call(target) !== '[object Function]') {
            // 遍历为target赋值
            var key = '';
            var obj = null;
            for (; i < arguments.length; i++) {
                obj = arguments[i];
                for(key in obj) {
                    target[key] = obj[key];
                }
            }
        }
        return target;
    };
    // TODO:
    // 1.基本上都是通过使用extend方法对
    // jquery原型方法的扩充和jQuery本身的扩充
    // ...
    // .
    // .
    // .
    // ...
    // 出口
    this.jQuery = this.$ = jQuery;
});