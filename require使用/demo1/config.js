define(function () {
    requirejs.config({
        baseUrl: '',
        paths: {
            'jquery': '../../lib/jquery-1.8.3',
            'underscore': '../../lib/underscore-1.5.2'
        },
        shim: {
            'underscore': {
                exports: 'underscore'
            }
        }
    });
});