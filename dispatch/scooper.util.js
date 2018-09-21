/**
 * SCOOPER JavaScript util library
 * browser support: IE8+, Chrome, FireFox
 * 3rd-part library request: none
 * scooper library request:  none
 * 
 * @author jiangwj 2016-04
 */
(function(factory, window){

	//Expose scooper.util as an AMD module
	if ( typeof define === "function" && define.amd ) {
		var requirelibs = [];
		// 确保 IE6/IE7中 JSON 能正常工作
		if (typeof(JSON)=="undefined") { requirelibs.push("lib/json2"); }
		//
		define( "scooper.util", requirelibs, factory );
	} else if (typeof module === 'object' && module.exports) {
		// 确保 IE6/IE7中 JSON 能正常工作
		if (typeof(JSON)=="undefined") { require("lib/json2"); }
		//
		module.exports = factory();
	} else {
		factory();
		// 确保 IE6/IE7中 JSON 能正常工作
		if (typeof(JSON)=="undefined") {
			var head = document.getElementsByTagName('head');
			head = head&&head.length?head[0]:head;
			var elm = document.createElement('script');
			var selfUrl = scooper.util.currentScriptUrl();
			elm.src = selfUrl.substring(0,selfUrl.lastIndexOf('/')+1) + 'lib/json2.js';
			head.appendChild(elm);
		}
	}

}(function() {
"use strict";
window.scooper = window.scooper || {};
if (window.scooper.util) return;
// initialize the paths of this site
var hostUrl = location.protocol + '//' + location.host;
var contextPath = location.pathname.indexOf('/', 1)>0?location.pathname.substring(0,location.pathname.indexOf('/',1)):location.pathname;
if (contextPath.lastIndexOf('/')!=(contextPath.length-1)) {
    contextPath = contextPath + '/';
}
var baseUrl = hostUrl + contextPath;

// safely to use console.log(...)
if (typeof(console) == "undefined") {
    window.console = {
        'dir': function(o){},
        'log': function(o){},
        'info': function(o){},
        'debug': function(o){},
        'warn': function(o){},
        'error': function(o){alert(o);}
    };
}

//console.log("util.js " + baseUrl);

var userAgent = navigator.userAgent.toLowerCase();
var browser = {
	'isIE': /msie/.test(userAgent) && !/opera/.test(userAgent),
	'version': (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1]
};

/** 为页面元素添加事件（兼容IE） */
function addEventListener(element, eventName, listener) {
    if (document.addEventListener) {
        element.addEventListener(eventName, listener);
    } else if (document.attachEvent) { // IE
        element.attachEvent('on'+eventName, listener);
    } else {
        // Ignore.
    }
}
/** 移除页面元素的事件（兼容IE） */
function removeEventListener(element, eventName, listener) {
    if (document.removeEventListener) {
        element.removeEventListener(eventName, listener);
    } else if (document.detachEvent) { // IE
        element.detachEvent('on'+eventName, listener);
    } else {
        // Ignore.
    }
}

/** 判断是否处于顶层框架 */
function isTopFrame() {
    return window.top == window;
}
/** 如果在下层框架，则找到顶层框架 */
function findTopFrame() {
    return window.top;
}

var _inTheElectron;
/**
 * 判断是否在壳程序 electron 中运行
 */
function inTheElectron() {
	if (typeof(_inTheElectron) == "undefined") {
		try {
			require('electron');
			_inTheElectron = true;
		} catch (e) {
			_inTheElectron = false;
		}
	}
	return _inTheElectron;
}


/**
 * 获取当前js文件路径（必须在脚本文件执行时立即调用）
 * （若延迟执行，将会得到错误的路径）
 */
function currentScriptUrl() {
	if (document.currentScript) { // 非IE
		return document.currentScript.src;
	}
	var script_tags = document.getElementsByTagName('script');
	var src = script_tags[script_tags.length-1].src;
	if (src.indexOf('://') < 0) { // IE6,7
		src = location.href.substring(0,location.href.lastIndexOf('/')+1) + src;
	}
	return src;
}


/**
 * 将字符串编码转换成HTML字符串；
 * 如：
 * '<div>hello&nbsp;world!</div>'
 *  =>
 * '&lt;div&gt;hello&amp;nbsp;world!&lt;/div&gt;'
 */
function htmlEncode(s) {
	var e = document.createElement('p');
	if (typeof(e.textContent) == 'undefined') {
		e.innerText = s;
	} else {
		e.textContent = s;
	}
	var result = e.innerHTML;
	e = null;
	return result;
}
/**
 * 将HTML字符串转换成字符串
 * 如：
 * '&lt;div&gt;hello&amp;nbsp;world!&lt;/div&gt;'
 *  =>
 * '<div>hello&nbsp;world!</div>'
 */
function htmlDecode(s) {
	var e = document.createElement('p');
	e.innerHTML = s;
	var result = (typeof(e.textContent) == 'undefined') ?
			e.innerText : e.textContent;
	e = null;
	return result;
}

/**
 * 为 url 添加/设置参数
 */
function urlParam(url,name,value) {
	if (url.indexOf('?') > 0) {
		var qs = url.substring(url.indexOf('?'));
		if (qs.indexOf(name + '=') > 0) {
			var i0 = qs.indexOf(name + '=')+(name+'=').length;
			var i1 = qs.indexOf('&',i0);
			if (i1<0) {
				qs = qs.substring(0,i0) + value;
			} else {
				qs = qs.substring(0,i0) + value + qs.substring(i1);
			}
			return url.substring(0,url.indexOf('?')) + qs;
		}
		return url + '&' + name + '=' + value;
	} else {
		return url + '?' + name + '=' + value;
	}
}

/**
 * 将URL分解为参数
 * @param url  需分解的URL
 * @return {baseUrl,anchor,params:{param1:value1,param2:value2,param3:value3,...}}
 */
function parseUrl(url) {
	if (!url) return {};
	// 获取 query-string
	var idx = url.indexOf('?');
	if (idx < 0) return {'baseUrl':url};
	var ret = {
		'baseUrl': url.substring(0,idx),
		'anchor': '',
		'params': {}
	};
	var qs = url.substring(idx+1);
	// 页内锚链接
	idx = qs.indexOf('#');
	if (idx >= 0) {
		ret.anchor = qs.substring(idx+1);
		qs = qs.substring(0,idx);
	}
	//
	var paramArr = qs.split('&');
	for (var i = 0; i < paramArr.length; i++) {
		var pair = paramArr[i].split('=');
		var name = pair[0];
		var value = pair.length > 1 ? pair[1] : '';
		if (ret.params.hasOwnProperty(name)) {
			var oldValue = ret.params[name];
			if ($.isArray(oldValue)) {
				oldValue.push(value);
			} else {
				ret.params[name] = [oldValue, value];
			}
		} else {
			ret.params[name] = value;
		}
	}
	//
	return ret;
}


/** 检查与顶层框架之间是否处于相同域名（均引入 scooper.util.js ） */
function XDomainChecker() {
	if (!(this instanceof XDomainChecker)) {
		return new XDomainChecker();
	}
	var self = this;
	//
	var _isTopmost = isTopFrame();
	// 来源窗口缓存；用于返回及传递
	var _sourceCache = {};
	
	/** 是否经过检查 */
	this.checked = false;
	/** 存在跨域 */
	this.xDomain = true;
	/** 顶层框架域名 */
	this.mainDomain;
	/** 当前框架域名 */
	this.currentDomain = location.hostname;
	
	// initialize
	if (_isTopmost) {
		this.checked = true;
		this.xDomain = false;
		this.mainDomain = this.currentDomain;
	} else {
		// send message to top frame
		postToParent(this.currentDomain);
	}
	// 构造消息链
	addEventListener(window, "message", onWindowMessage);
	// 消息处理及上下层传递
	function onWindowMessage(e) {
        e = e || event;
        if (!e || !e.data) return;
        var data = typeof(e.data) == "string" ? JSON.parse(e.data) : e.data;
        if (!data['_x_domain']) return;
		//
        if (data._x_domain == "check") {
        	//  向上
        	processUpward(data,e);
        } else if (data._x_domain == "return") {
        	//  向下
        	processDownward(data,e);
        }
	}
    // 推送给上层（一直到顶层）
    function postToParent(msg,path) {
    	path = path || '';
    	// 其中 path 字段，用来表示返回的路径，以及用于判断是否返回到目标框架；
    	//  每向上一层追加该框架 ID，每向下一层减去一层。（以“.”分隔） 
        parent.postMessage(JSON.stringify({'_x_domain':"check","msg":msg,"path":path}), '*');
    }
    // 向下返回消息
    function postResult(source,msg,path) {
    	if (source) source.postMessage(JSON.stringify({'_x_domain':"return","msg":msg,"path":path}), '*');
    }
    // 处理向上派发的消息
    function processUpward(data,e) {
    	if (_isTopmost) {
    		// 当前为顶层则向下返回当前域名
    		postResult(_getSource(e), self.currentDomain, data.path);
    	} else {
    		// 继续向上传递
    		var key = _pathKey();
    		var val = _getSource(e);
    		//
    		_sourceCache[key] = val;
    		data.path = data.path + '.' + key;
    		//
    		postToParent(data.msg, data.path);
    	}
    }
    // 处理向下派发的消息
    function processDownward(data,e) {
    	var path = data.path;
    	if (path.length > 0) {
    		// 继续向下传递
    		var idx = path.lastIndexOf('.');
    		var key = path.substring(idx+1);
    		path = path.substring(0,idx);
    		var source = _sourceCache[key];
    		delete _sourceCache[key];
    		//
    		postResult(source, data.msg, path);
    	} else {
    		// 已到达目标，进行处理
    		checkCurrent(data.msg);
    	}
    }
    // 收到从顶层框架过来的消息，更新状态
    function checkCurrent(mainDomain) {
    	self.checked = true;
    	self.mainDomain = mainDomain;
    	self.xDomain = (self.mainDomain != self.currentDomain);
    }
    //
    var _curPathKey = 0;
    function _pathKey() {
    	return 'pk_' + (_curPathKey++);
    }
    // 从 window.message 事件中获取来源窗口
    function _getSource(e) {
    	return e.source;
    }
}

/**
 * 跨 frame 调用（可以替代解决跨域无法调用 iframe 中js的问题）
 * 
 * TODO : 优化方案，判断如果在同域中则直接采用引用的方式来调用；只有在不同域名下时才使用 postMessage 。
 */
function XWindowCall() {
    var self = this;
    var initialized = false;
    // 根据方法名，在当前 Window 中查找对应函数
    function findMethod(method) {
        var obj = window;
        var fn = obj[method];
        var idx;
        // 如果是以 "abc.def.hij.klm" 这种方式来标识方法名，直接使用该字符串无法找到函数时，则利用“.”分割对象的方式来找。
        // 该规则支持 ['abc']['def']['hij']['klm']、['abc']['def']['hij.klm'] 或 ['abc']['def.hij.klm'] 的引用方式；
        // 不支持 ['abc.def']['hij']['klm']、['abc.def.hij']['klm'] 这种类型的引用方式。
        while (!fn && (idx=method.indexOf('.')) > 0) {
            obj = obj[method.substring(0, idx)];
            if (!obj) break;
            method = method.substring(idx+1);
            fn = obj[method];
        }
        // obj - 包含指定函数的对象引用
        // fn  - 指定函数
        return {'obj':obj,'fn':fn};
    }
    // 处理 post 到当前Window的消息
    function onmessage(e) {
        e = e || event;
        if (!e || !e.data) return;
        var data = typeof(e.data) == "string" ? JSON.parse(e.data) : e.data;
        if (!data._method) return;
        var method = data._method;
        var args = data.args;
        //
        var fm = findMethod(method);
        if (fm && fm.fn) fm.fn.apply(fm.obj, args);
    }
    /** 初始化 */
    this.initialize = function() {
        if (initialized) return;
        initialized = true;
        addEventListener(window, 'message', onmessage);
    };
    /** 销毁 */
    this.destroy = function() {
        removeEventListener(window, 'message', onmessage);
    };
    /**
     * 调用指定iframe中的方法
     * @param target Window对象，或者 iframe 的全局标识符，如：'main.disp_frame'
     * @param method iframe中定义的方法名
     * @param args 需要传递的参数（简单JSON对象，不能包含BOM/DOM元素）
     */
    this.callMethod = function(target, method, args) {
        if (!initialized) self.initialize();
        //
        if (typeof(target) == "string") {
            // 找到对应的Window对象
            // 如果是需要派发到下级或越级，则转换 method 及 args
        } else if (target instanceof HTMLIFrameElement) {
            target = target.contentWindow;
        } else if (target instanceof Window) {
            target = target;
        } else if (!parent.postMessage) {
            throw new Error("target is not support");
        }
        // （注：IE中的 postMessage 仅支持字符串参数）
        var msg = JSON.stringify({'_method': method, 'args': args});
        //
        target.postMessage(msg, '*');
    };
}

/**
 * window.postMessage 封装（跨页面事件通知）
 * 使用 scooper.util.windowMessage.post(key, data) 来派发消息，可将消息派发给所有 Frame。
 * 通过设置 scooper.util.windowMessage.handlerMessage = function(key, data){} 来监听并处理消息。
 * 
 * 注意：消息派发的通路frame中需要引入 scooper.util.js 并调用 scooper.util.windowMessage.initialize() 方法。
 * 
 * TODO : 优化方案，判断如果在同域中则直接采用引用的方式来调用；只有在不同域名下时才使用 postMessage 。
 */
function WindowMessage() {
    var self = this;
    var initialized = false;
    // use as (DOM Event System)
    var dom = document.createElement('div');
    
    // 用于越级转发消息（消息流转到顶层窗口，再逐级往下派发）
    function onmessage(e) {
        e = e || event;
        if (!e || !e.data) return;
        var data = typeof(e.data) == "string" ? JSON.parse(e.data) : e.data;
        if (!data._type) return;
        //
        if (data._type == "totop") {
            if (isTopFrame()) {
                handleMessage(data.data);
                postToFrames(data.data);
            } else {
                postToParent(data.data);
            }
        } else if (data._type == "message") {
            handleMessage(data.data);
            postToFrames(data.data);
        }
        // console.log(e.data);
        // console.log(baseUrl);
    }
    // 处理当前窗口的消息
    function handleMessage(msg) {
        if (self.messageHandler && msg) {
            var o = typeof(msg) == "string" ? JSON.parse(msg) : msg;
            try {
                self.messageHandler(o.key, o.data);
            } catch (error) {
                console.error("handleMessage failed: " + error);
            }
            try {
            	// fireMessageListeners
            	var evt = $.Event('_message', {'msg': o});
            	$(dom).trigger(evt);
            } catch (error) {
                console.error("fireMessageListeners failed: " + error);
            }
        }
    }
    // 推送给上层（一直到顶层）
    function postToParent(msg) {
        parent.postMessage(JSON.stringify({'_type':"totop","data":msg}), self.postPorts);
    }
    // 将消息发送给所有窗口（frame）（向下派发）
    function postToFrames(msg) {
        var windows = window.frames;
        //
        msg = JSON.stringify({'_type':"message","data":msg});
        for (var i = 0; i < windows.length; i++) {
            windows[i].postMessage(msg, self.postPorts);
        }
    }
    
    /** 判断当前浏览器是否支持 window.postMessage */
    this.supported = typeof(window.postMessage) != "undefined";
    /** 域名过滤，默认为不过滤 */
    this.postPorts = '*';
    /** 当前窗口的消息处理函数；在需要处理消息的页面设置该值 */
    this.messageHandler = function(key, data) {};
    this.addMessageListener = function(l) {
    	$(dom).on('_message', l);
    };
    this.removeMesssageListener = function(l) {
    	$(dom).unbind('_message', l);
    }
    /** 初始化 */
    this.initialize = function() {
        if (initialized) return;
        if (!self.supported) throw new Error('not supported WindowMessage');
        initialized = true;
        addEventListener(window, 'message', onmessage);
    }
    /** 销毁 */
    this.destroy = function() {
        removeEventListener(window, 'message', onmessage);
        initialized = false;
    }
    /** 发送消息给所有注册的窗口 */
    this.post = function(key, data) {
        if (!initialized) self.initialize();
        //
        var msg = '';
        try {
            msg = JSON.stringify({'key':key,'data':data});
        } catch (error) {
            throw new Error("only simple JSON object allowed. " + error);
        }
        //
        if (!isTopFrame()) {
            console.log("WindowMessageProxy.post");
            postToParent(msg);
            return;
        }
        //
        postToFrames(msg);
    };
    /** 发送消息给指定窗口 */
    // this.postTo = function(key, data, targetWindow) {
    //     if (!initialized) self.initialize();
    //     //
    //     var msg = '';
    //     try {
    //         msg = JSON.stringify({'key':key,'data':data});
    //     } catch (error) {
    //         throw new Error("only simple JSON object allowed. " + error);
    //     }
    //     //
    //     targetWindow.postMessage(msg, self.postPorts);
    // };
};

/**
 * 在网页上显示覆盖层（遮罩效果）
 */
function Overlay() {
	var self = this;
	var _initialized = false;
	var $;
	var $overlay;
	var overElms = [];
	//
	var _old_css_key = "-ovl-old-css";
	
	//
	function init() {
		if (!window.jQuery) {
			throw new Error('this need jQuery support!');
		}
		$ = window.jQuery;
		//
		createOverlay();
		//
		_initialized = true;
	}
	//
	function createOverlay() {
		$overlay = $('<div class="overlay">').hide().appendTo($('body'));
	}
	
	function hasLayer(elm) {
		for (var i = 0; i < overElms.length; i++) {
			var e = overElms[i];
			if (elm == e) {
				return true;
			}
			if (e.jquery && elm.jquery && e[0] == elm[0]) {
				return true;
			}
		}
		return false;
	}
	
	function putLayer(elm) {
		if (hasLayer(elm)) return;
		var $elm = $(elm);
		if ($elm.data(_old_css_key)==null) {
			var oldCss = $elm.attr('style')||"";
			//
			var offset = $elm.offset();
			var right = $('body').width() - $elm.width() - parseInt($elm.css('margin-left')) - parseInt($elm.css('margin-right')) - offset.left;
			var bottom = $('body').height() - $elm.height() - parseInt($elm.css('margin-top')) - parseInt($elm.css('margin-bottom')) - offset.top;
			var zIndex = $overlay.css('zIndex')||0;
			//
			$elm.css({
				'top': offset.top,
				'left': offset.left,
				'right': right,
				'bottom': bottom,
				'zIndex': (zIndex+1)
			});
			//
			$elm.addClass('overlay-up').data(_old_css_key,oldCss);
		}
		overElms.push(elm);
	}
	
	/**
	 * 显示遮罩
	 * @param elms 显示中覆盖层之上的一个或多个元素
	 */
	this.show = function(elms) {
		if (!_initialized) init();
		//
		$overlay.show();
		//
		if (elms) {
			if ($.isArray(elms)) {
				$.each(elms,function(i,e){
					putLayer(e);
				});
			} else {
				putLayer(elms);
			}
		}
	};
	this.hide = function() {
		if (!_initialized) init();
		//
		try {
			$.each(overElms,function(i,e){
				var $e = $(e);
				$e.removeClass('overlay-up').prop('style',$e.data(_old_css_key));
				$e.data(_old_css_key,null);
			});
		} catch (e) {
			console.error(e);
		}
		overElms.splice(0,overElms.length);
		//
		$overlay.hide();
	};
	
}// end Overlay

/**
 * 内容界面左侧菜单项
 */
function LeftNavi() {
	var self = this;
	//
	var urlKey = 'url';
	var pagePath;
	var baseUrl;
	var queryString;
	var token;
	// 目标 iframe 框架
	var target = null;
	//
	var $menuItems;
	
	/**
	 * @param cfg  { basePath,$elms,urlKey,target,token,defaultPage,defaultAnchor }
	 */
	this.initialize = function(cfg) {
		if (typeof(cfg.basePath) == "undefined" || cfg.basePath == null) {
			throw new Error("basePath is required!");
		}
		if (typeof(window.jQuery) == "undefined") {
			throw new Error("jQuery is required!");
		}
		if (!cfg.$elms) {
			throw new Error("need menu items!");
		}
		if (cfg.urlKey) urlKey = cfg.urlKey;
		if (cfg.token) token = cfg.token;
		//
		if (cfg.target) target = cfg.target;
		var defaultPage = null;
		if (cfg.defaultPage) defaultPage = cfg.defaultPage;
		//
		var defaultAnchor = null;
		if (cfg.defaultAnchor) defaultAnchor = cfg.defaultAnchor;
		//
		// http://host/basePath/pathPath?query-string
		var currentUrl = location.href;
		var hostUrl = location.protocol + '//' + location.host;
		if (cfg.basePath) {
			pagePath = currentUrl.substring(currentUrl.indexOf(cfg.basePath)+cfg.basePath.length);
			baseUrl = currentUrl.substring(0,currentUrl.indexOf(cfg.basePath)+cfg.basePath.length);
		} else {
			pagePath = currentUrl;
			baseUrl = hostUrl;
		}
		if (pagePath.indexOf('?') > 0) {
			pagePath = pagePath.substring(0,pagePath.indexOf('?'));
		}
		if (!defaultPage) defaultPage = pagePath;
		//
		var defaultSelect = null;
		//
		cfg.$elms.click(function(){
			var url = $(this).attr(urlKey);
			if (url[0] == '/') {
				url = hostUrl + url;
			} else {
				url = baseUrl + '/' + url;
			}
			if (token) {
				url = putToken(url);
			}
			//
			if (defaultAnchor) {
				url = url + '#' + defaultAnchor;
				defaultAnchor = null; // only execute once
			}
			//
			if (target) {
				$(target).prop('src', url);
			} else {
				window.location.href = url;
			}
			//
			cfg.$elms.removeClass("selected");
			$(this).addClass("selected");
			//
		}).each(function(i,e){
			if (defaultPage == $(e).attr(urlKey)) {
				defaultSelect = e;
			} else {
				$(e).removeClass("selected");
			}
		});
		//
		if (defaultSelect) $(defaultSelect).click();
	};
	//
	function putToken(url) {
		if (url.indexOf('?') > 0) {
			var qs = url.substring(url.indexOf('?'));
			if (qs.indexOf('token=') > 0) return url;
			return url + '&token=' + token;
		} else {
			return url + '?token=' + token;
		}
	}
	//
}// end LeftNavi

/**
 * Tab页
 * @param cfgs : [{$tab,$panel}]
 */
function TabPage(cfgs) {
	if (!(this instanceof TabPage)) {
		return new TabPage(cfgs);
	}
	//
	var self = this;
	var elms = initConfig(cfgs);
	//
	bindEvents();
	//
	this.select = function(tab) {
		selectTab(tab);
	};
	this.selectByIndex = function(idx) {
		if (idx<0) return;
		if (elms&&elms.length && idx < elms.length) {
			selectTab(elms[idx].tab);
		}
	};
	// {tab,panel} (HTMLElement)
	this.onSelectionChange = function(e){};
	//
	function initConfig(cfgs) {
		var ret = [];
		$.each(cfgs, function(i,e){
			ret.push({
				'tab': e.$tab.get(0),
				'panel': e.$panel.get(0)
			});
		});
		return ret;
	}
	//
	function bindEvents() {
		$.each(elms, function(i,e){
			$(e.tab).click(function(e) {
				selectTab(e.currentTarget);
			});
		});
	}
	//
	function selectTab(tab) {
		var selItem = null;
		$.each(elms, function(i,e){
			if (tab == e.tab) {
				$(e.tab).addClass('selected');
				$(e.panel).show();
				selItem = e;
			} else {
				$(e.tab).removeClass('selected');
				$(e.panel).css('display','none');
			}
		});
		//
		if (self.onSelectionChange) {
			self.onSelectionChange(selItem);
		}
	}
}
// end TagPage

/**
 * Tag页，动态绑定事件，按顺序对应Tab页标签及内容页
 * @param cfg : {
 *     tab: {$container,selector},
 *     panel: {$container,selector}
 * }
 */
function TabPage2(cfg) {
	if (!(this instanceof TabPage2)) {
		return new TabPage2(cfg);
	}
	// prepare arguments
	if (!cfg.tab.hasOwnProperty('$container') && cfg.tab.jquery) {
		cfg.tab = {
			'$container': cfg.tab,
			'selector': null
		};
	}
	if (!cfg.panel.hasOwnProperty('$container') && cfg.panel.jquery) {
		cfg.panel = {
			'$container': cfg.panel,
			'selector': null
		};
	}
	//
	var self = this;
	//
	// 为每个标签页标签绑定子项点击的事件
	cfg.tab.$container.on('click',cfg.tab.selector||'>*',function(e){
		self.select(e.currentTarget);
	});
	/**
	 * @param tab HTMLElement
	 */
	this.select = function(tab) {
		var $tabs = cfg.tab.selector
			? cfg.tab.$container.find(cfg.tab.selector)
			: cfg.tab.$container.children();
		var idx = $tabs.index(tab);
		self.selectByIndex(idx);
	};
	/**
	 * @param idx start with 0
	 */
	this.selectByIndex = function(idx) {
		selectTabByIndex(idx);
	};
	//
	this.getSelectedIndex = function() {
		var $tabs = cfg.tab.selector
			? cfg.tab.$container.find(cfg.tab.selector)
			: cfg.tab.$container.children();
		return $tabs.index(cfg.tab.$container.find('>.selected'));
	};
	// {tab,panel} (HTMLElement)
	this.onSelectionChange = function(e){};
	//
	function selectTabByIndex(idx) {
		//
		var selItem;
		//
		var $tabs = cfg.tab.selector
			? cfg.tab.$container.find(cfg.tab.selector)
			: cfg.tab.$container.children();
		$tabs.each(function(i,e){
			if (i == idx) {
				$(e).addClass('selected');
				selItem = {'tab':e,'panel':null};
			} else {
				$(e).removeClass('selected');
			}
		});
		var $panels = cfg.panel.selector
			? cfg.panel.$container.find(cfg.panel.selector)
			: cfg.panel.$container.children();
		$panels.each(function(i,e){
			if (i == idx) {
				$(e).show();
				if (selItem) selItem.panel = e;
			} else {
				$(e).hide();
			}
		});
		//
		if (self.onSelectionChange) {
			self.onSelectionChange(selItem);
		}
	}
}//end TabPage2

/**
 * 单选列表；允许传入多个列表，可确保多个列表中的项目仅有一个处于选中状态
 * @param cfgs : [{$list,selector}]
 */
function SingleSelection(cfgs) {
	if (!(this instanceof SingleSelection)) {
		return new SingleSelection(cfgs);
	}
	//
	var self = this;
	var lists = cfgs; // [{$list,selector}]
	var curSelectItem = null; // HTMLElement
	// 为每个列表绑定子项点击的事件
	$.each(lists, function(i,item){
		item.$list.on('click',item.selector,function(e){
			changeSelection(e.currentTarget);
		});
	});
	// 获取当前选中元素(HTMLElement)
	this.getSelection = function() {
		return curSelectItem;
	};
	this.setSelection = function(e) {
		changeSelection(e);
	};
	this.setSelectionByIndex = function(idx) {
		if (!lists || !lists.length) return;
		var cfg = lists[0];
		self.setSelection( cfg.$list.eq(0).children(cfg.selector).get(idx) );
	};
	// e - HTMLElement
	this.onSelectionChange = function(e){};
	//
	function changeSelection(elm) {
		curSelectItem = null;
		$.each(lists, function(i,item){
			$(item.selector, item.$list).each(function(i,e){
				if (e == elm) {
					curSelectItem = e;
					$(e).addClass('selected');
				} else {
					$(e).removeClass('selected');
				}
			});
		});
		//
		if (self.onSelectionChange) {
			self.onSelectionChange(curSelectItem);
		}
	}
}
// end SingleSelection

/**
 * 缓存处理，若存在则从缓存中加载，若不存在则从指定地址加载后台数据
 */
function Cache() {
	var self = this;
	// cache data: {key:{data,loading,retFns:[]}}
	var _cache = {};
	//
	// check jQuery
	function checkJQ() {
		if (typeof(window.jQuery) == "undefined") {
			throw new Error("jQuery is requred!");
		}
	}
	//
	function requestCache(key,retFn) {
		// {data,loading,retFns:[]}
		var o = _cache[key];
		if (typeof(o) == "undefined") {
			return false;
		}
		if (o.loading) {
			o.retFns.push(retFn);
		} else if (o.data) {
			if (retFn) retFn(o.data);
		} else {
			return false;
		}
		return true;
	}
	//
	function putCache(key,data) {
		// {data,loading,retFns:[]}
		var o = _cache[key];
		//
		o.data = data;
		o.loading = false;
	}
	//
	function fireCacheRetFns(key) {
		var o = _cache[key];
		//
		for (var i = 0; i < o.retFns.length; i++) {
			var fn = o.retFns[i];
			if (fn) fn(o.data);
		}
		o.retFns = [];
	}
	//
	function prepareCache(key,retFn) {
		var o = _cache[key];
		if (o) {
			o.retFns.push(retFn);
		} else {
			_cache[key] = {
				'data': null,
				'loading': true,
				'retFns': [retFn]
			};
		}
	}
	//
	/**
	 * clear all cache objects
	 */
	this.clear = function() {
		_cache = {};
	};
	/**
	 * remove cache object by key
	 */
	this.remove = function(key) {
		var o = _cache[key];
		delete _cache[key];
		return o;
	};
	/**
	 * 预处理参数
	 * 以下为默认处理方式，若自定义可设置该函数为自定义函数
	 */
	this.prepareParam = function(param) {
		if (param && typeof(param['token']) == 'undefined') {
			param['token'] = token;
		} else {
			param = {'token':token};
		}
		return param;
	};
	/**
	 * 数据加载返回结果解析
	 * 以下为默认处理方式，若自定义可设置该函数为自定义函数
	 */
	this.parseResult = function(ret) {
		var data = null;
		if (ret && ret.data) {
			data = ret.data;
		}
		return data;
	};
	/**
	 * 从缓存中获取数据或者从后台加载数据
	 */
	this.load = function(key,url,param,retFn,parseFn) {
		checkJQ();
		// cache object
		if (requestCache(key, retFn)) {
			return;
		}
		//
		prepareCache(key, retFn);
		//
		param = self.prepareParam(param);
		//
		jQuery.ajax({
			'method': 'POST',
			'url': url,
			'data': param,
			'dataType': 'json'
		}).fail(function(jqXHR,sts){
			console.error('加载数据失败：' + sts + ", " + url);
			fireCacheRetFns(key);
			self.remove(key);
		}).done(function(ret){
			if (!ret || ret.code != 0) {
				console.error('加载数据失败：' + JSON.stringify(ret) + ", " + url);
			}
			var data = null;
			if (parseFn) {
				data = parseFn(ret);
			} else {
				data = self.parseResult(ret);
			}
			//
			if (data != null) {
				putCache(key, data);
			}
			//
			fireCacheRetFns(key);
			//
			if (data == null) {
				self.remove(key);
			}
		});
	};
}// end Cache

function SCMap() {
    var elements = {};
    var length = 0;
    
    function Entry(key,val) {
        this.key = key;
        this.value = val;
    };
    
    this.get = function(key) {
        return elements[key];
    };
    this.getKeysOrValue = function(isKey) {
    	var keys = new Array();
        for (var k in elements) {
        	if(isKey) {
        		keys.push(elements[k].key);
        	} else {
        		keys.push(elements[k].value);
        	}
        }
        return keys;
    };
    this.getKey = function(val) {
        for (var k in elements) {
            if (val == elements[k].value) {
                return k;
            }
        }
        return null;
    };
    this.put = function(key,val) {
        if (elements.hasOwnProperty(key)) {
            elements[key].value = val;
        } else {
            elements[key] = new Entry(key,val);
            length++;
        }
    };
    this.remove = function(key) {
        if (elements.hasOwnProperty(key)) {
            delete elements[key];
            length--;
        }
    };
    this.removeAll = function(key) {
    	elements = {};
        length = 0;
    };
    this.size = function() {
        return length;
    };
    this.isEmpty = function() {
        return length <= 0;
    }
}

// Expose scooper.util to the global object
window.scooper.util = {
    'browser': browser,
    'hostUrl': hostUrl, // et: http://192.168.103.172:8080
    'contextPath': contextPath, // et: /njgw-web
    'baseUrl': baseUrl, // et: http://192.168.103.172:8080/njgw-web/
    'isTopFrame': isTopFrame,
    'findTopFrame': findTopFrame,
    'inTheElectron': inTheElectron, // 判断是否在壳程序 electron 中运行
    'currentScriptUrl': currentScriptUrl, // 获取当前js文件路径（必须在脚本文件执行时立即调用）（若延迟执行，将会得到错误的路径）
    'htmlEncode': htmlEncode, // 将字符串编码转换成HTML字符串。如：'<div>hello&nbsp;world!</div>' => '&lt;div&gt;hello&amp;nbsp;world!&lt;/div&gt;'
    'htmlDecode': htmlDecode, // 将HTML字符串转换成字符串。如：'&lt;div&gt;hello&amp;nbsp;world!&lt;/div&gt;' => '<div>hello&nbsp;world!</div>'
    'urlParam': urlParam, // 为URL添加参数
    'parseUrl': parseUrl, // 解析URL，输出：{baseUrl,anchor,params:{}}
    'addEventListener': addEventListener,
    'removeEventListener': removeEventListener,
    'xWindowCall': new XWindowCall(),
    'windowMessage': new WindowMessage(),
    'xDomainChecker': new XDomainChecker(),
    'overlay': new Overlay(),
    'LeftNavi': LeftNavi,
    'TabPage': TabPage,
    'TabPage2': TabPage2,
    'SingleSelection': SingleSelection,
    'Cache': Cache,
    'SCMap': window.SCMap = SCMap
};

return window.scooper.util;

},typeof window !== 'undefined' ? window : this));