define(function () {
    requirejs.config({
        baseUrl: '',
        map: { //map告诉RequireJS在任何模块之前，都先载入这个css模块
            '*': {
                css: './css'
            }
        },
        paths: {
            'jquery': './jquery-easyui-1.6.6/jquery.min',
            'easyui': './jquery-easyui-1.6.6/jquery.easyui.min'
        },
        shim: {
            'easyui': {
                deps: [
                    "jquery",
                    "css!./jquery-easyui-1.6.6/themes/default/easyui.css"
                ],
            }
        }
    });
});
