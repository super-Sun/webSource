/**
 * SCOOPER SSE(Server-Send Event) JavaScript library
 * browser support: IE8+, Chrome, FireFox
 * 3rd-part library request: require.js, cometd.js, jquery
 * scooper library request: scooper.util.js
 * 
 * @author jiangwj 2016-04
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('scooper.sse',
		['jquery', 'org/cometd', 'jquery.cometd', 'jquery.cometd-reload', 'scooper.util'],
		factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = root.document ?
				factory(jQuery) :
				factory(require('jquery'));
	} else {
		factory(jQuery);
	}
}(typeof window !== 'undefined' ? window : this, function($/*,cometd*/) {
"use strict";
window.scooper = window.scooper || {};
if (window.scooper.sse) return;


// 在多框架程序中，请确保所有框架内仅使用一路SSE通道；（置于顶层框架中）

// 判断当前页面是否引入过 scooper.util
if (typeof(scooper.util) == "undefined") throw new Error('scooper.util.js is required!');

// 判断是否处于顶层框架
if (!scooper.util.isTopFrame()) {
	// // 如果在下层框架，则找到顶层框架
	// var topFrame = scooper.util.findTopFrame();
	// // 如果顶层框架中存在 scooper.sse 则直接使用该对象
	// if (typeof(topFrame.window.scooper) != "undefined" && topFrame.window.scooper.sse) {
	// 	return window.scooper.sse = topFrame.window.scooper.sse;
	// }
}

// 预配置
//cometd.getExtension('reload').configure({cookieMaxAge:10});
//cometd.websocketEnabled = true;

function SSE(name) {
    var _initialized = false;
    var self = this;
    //
    var _connected = false;
    //
    var cometd = new $.CometD(name);
    // [{channel,callback}]
    var _preSubscribs = [];
    // [{channel,callback,subscription}]
    var _subscribs = [];
    //
    var _connCallback = function(){};
    //
    // 如果与 CometD 网页后台处于不同域名，则需要设置该值
    var remoteBaseUrl = null;
    //
    function getBaseUrl() {
    	if (!remoteBaseUrl) {
    		return scooper.util.baseUrl;
    	}
    	if (remoteBaseUrl.indexOf('http') < 0) {
    		var hostUrl = window.location.protocol + '//' + window.location.host;
    		if (remoteBaseUrl[0] == '/') {
    			remoteBaseUrl = hostUrl + remoteBaseUrl;
    		} else {
    			remoteBaseUrl = hostUrl + '/' + remoteBaseUrl;
    		}
    	}
    	return remoteBaseUrl;
    }
    //
    function getCometdPath() {
        if (remoteBaseUrl) {
            return getBaseUrl() + 'cometd';
        }
        return scooper.config && scooper.config.cometd && scooper.config.cometd.path
                ? scooper.config.cometd.path : getBaseUrl() + 'cometd';
    }

    /** 设置基准地址 （contextPath） */
    this.setRemoteBaseUrl = function(val) {
        remoteBaseUrl = val;
    };
    
	this.path = getCometdPath();
    /** 初始化 */
    this.initialize = function(cometd_path) {
        if (cometd_path) {
            self.path = getBaseUrl() + cometd_path;
        } else {
        	self.path = getCometdPath();
        }
        cometd.websocketEnabled = true;
        cometd.init({
            'url': self.path,
            'logLevel': 'info'
        })
        _initialized = true;
        //
        cometd.addListener('/meta/connect', function(message) {
        	//console.log(message);
            if (message) {
            	// {channel:"/meta/connect",advice:{},id:"10",successful:true}
                if (message.advice && message.successful) {
                	// advice:{interval:0,reconnect:"retry",timeout:30000}
                	if (!_connected) {
                		reSubscribes();
                	}
                	//
                	_connected = true;
                	//
                	prepareSubscribes();
                	//
                	if (_connCallback) _connCallback(_connected);
                }
                // {channel:"/meta/connect",advice:{interval:0,reconnect:"handshake"},id:"10",successful:false,error:"402::Unknown client"}
                // {channel:"/meta/connect",failure:{},id:"13",successful:false}
                if (message.failure) {
                	// failure:{connectionType:"websocket",websocketCode:1006,reason:"",message:{channel,clientId,...},transport:{instanceOf WebSocket}}
                	// failure:{connectionType:"long-polling",httpCode:408,reason:"error",exception:"Request Timeout",message:{channel,clientId,...},transport:{instanceOf LongPollingTransport}}
                	// ... RequestTransport, LongPollingTransport, CallbackPollingTransport, WebSocketTransport
                	_connected = false;
                	if (_connCallback) _connCallback(_connected);
                }
            }
        });
    }
    //
    this.isConnected = function() {
    	return _connected;
    };
    /**
     * 与服务端建立连接成功回调(重连也会触发)（注：如果不是 WebSocket 方式的连接，每次轮询都会触发）
     * @param callback function(connected){}
     */
    this.setConnectionCallback = function(callback) {
        _connCallback = callback;
    }
    /**
     * 订阅
     * @param channel
     * @param callback function(message){}; message:{channel:"",data:{...}}
     */
    this.subscribe = function(channel, callback) {
        if (_initialized) {
        	_subscribe(channel, callback);
        } else {
        	_preSubscribs.push({"channel":channel,"callback":callback});
        	self.initialize();
        }
    }
    //
    function _subscribe(channel, callback) {
    	var o = {
    		'channel': channel,
    		'callback': callback,
    		'subscription': cometd.subscribe(channel, callback)	
    	};
    	//
    	_subscribs.push(o);
    	//
    	return o;
    }
    //
    function prepareSubscribes() {
    	if (_preSubscribs.length) {
    		for (var i = 0; i < _preSubscribs.length; i++) {
    			var sub = _preSubscribs[i];
    			_subscribe(sub.channel, sub.callback);
    		}
    		//
    		_preSubscribs.splice(0,_preSubscribs.length);
    	}
    }
    //
    function reSubscribes() {
    	if (_subscribs.length) {
    		console.log("reSubscribes");
    		for (var i = 0; i < _subscribs.length; i++) {
    			var sub = _subscribs[i];
    			sub.subscription = cometd.resubscribe(sub.subscription);
    		}
    	}
    }
}

// export Server-Send Event class
window.scooper.SSE = SSE;
// the default instance
window.scooper.sse = new SSE();

return window.scooper.sse;
}));