require(['./config'], function () {
    require(['jquery', 'easyui'], function ($, easyui) {
        $(document).ready(function () {
            // 重新强制渲染一下
            /**
             但仅仅这样加载，有时候打开页面时候easyui的一些组件没有渲染完成，
             就是该有的css效果没有出现．根本原因是easyui不支持异步加载，
             它的渲染代码在前，各种定义在后，导致还没定义就先渲染，所以不会有效果，
             因为渲染部分是在easyui中的解析器$.parser.parse()中完成的．
             所以为保证打开页面后组件全部被正常渲染，应该在$(document).ready(）后加上$.parser.parse(),即：
             $(document).ready(function() {
                $.parser.parse();
                //add your custom code here
                })
             */
            // 参考：https://blog.csdn.net/monkey_four/article/details/52954067
            $.parser.parse()
        })
    });
});
