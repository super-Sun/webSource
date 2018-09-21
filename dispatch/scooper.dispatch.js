/**
 * SCOOPER Dispatch JavaScript library
 * browser support: IE8+, Chrome, FireFox
 * 3rd-part library request: require.js, cometd.js, jquery
 * scooper library request: scooper.sse.js, scooper.util.js
 * 
 * @author jiangwj 2016-04
 */
(function (window, factory) {
	if (typeof define === 'function' && define.amd) {
		define('scooper.dispatch', ['jquery', 'scooper.sse'], factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = window.document ?
				factory(jQuery, scooper.sse) :
				factory(require('jquery'), require('scooper.sse'));
	} else {
		factory(jQuery, scooper.sse);
	}
}(typeof window !== 'undefined' ? window : this, function($, scooper_sse) {
'use strict';

// 使用方法一：（所有框架同域名）
//
// 初始化
// 在顶层框架中调用：
// scooper.dispatch.initialize("main");
// 在下层框架中调用：
// scooper.dispatch.initialize("sub");
//
// 设置服务端连接
// 在顶层框架中调用：
// scooper.dispatch.login(user,pass);
// 或（如果在后台已经建立连接，并返回token，则直接设置token，无需调用login）
// scooper.dispatch.setToken(token);

// 在多框架(frame)程序中，确保所有框架内仅使用一路调度API；（置于顶层框架中）
// 如果顶层框架中不存在 scooper.dispatch 的注册，并且与当前框架不在同一个域名中；则直接在本页面中使用。
// （考虑到第三方公司项目使用 iframe 内嵌我司调度网页）
// 各框架之间应该使用 window.postMessage 来进行通信。

// 判断是否处于顶层框架
if (!scooper.util.isTopFrame()) {
	// 如果在下层框架，则找到顶层框架
    // TODO 使用 DispatchProxy 来向顶层框架转发消息来调用调度相关功能；顶层框架中对这些消息进行处理
	// var topFrame = scooper.util.findTopFrame();
	// // 如果顶层框架中存在 scooper.sse 则直接使用该对象
	// if (typeof(topFrame.window.scooper) != "undefined" && topFrame.window.scooper.dispatch) {
	// 	return window.scooper.dispatch = topFrame.window.scooper.dispatch;
	// }
}
// 判断当前页面是否引入过 scooper.util
if (typeof(scooper.util) == "undefined") throw new Error('scooper.util.js is required!');
// 判断是否成功导入 scooper.sse
if (!scooper_sse) throw new Error('scooper.sse.js is required!');

// 如果与调度网页后台处于不同域名，则需要设置该值
var remoteBaseUrl = null;
function getBaseUrl() {
    return remoteBaseUrl ? remoteBaseUrl : scooper.util.baseUrl;
}

function apiUrl(path) {
    return getBaseUrl() + 'api' + path;
}

// 查找顶层窗口（注：相同域名下使用）
// 查找调度主连接所在窗口
function findMainFrame(w) {
    w = w||window;
    //
    while (w != w.parent) {
        if (w.scooper && w.scooper.dispatch
            && w.scooper.dispatch.getType() == "main") {
            return w;
        }
        w = w.parent;
    }
    return w;
}

// constants
var event_const = {
    CONN_CNG  : "connectionChanged",
    CHANGE_CFG: "changeConfigNotify",
    CALL_IN   : "callInChanged",
    CALL_STS  : "telStatusChanged",
    MEET_STS  : "meetStatusChanged",
    MEET_MEM  : "meetMemberChanged",
    MEET_LST  : "meetListChanged",
    DATA_INIT : "dataInitailized",
    METHOD_RT : "methodResponse",
    DATE_STATE: "dateStateChanged"
};
var status_const = {
	OFFLINE          : "callst_offline",			//离线
	IDLE             : "callst_idle",				//空闲
	WAITRING         : "callst_waitring",			//预振铃
	CALLRING         : "callst_ring",				//振铃中
	CALLANSWER       : "callst_answer",				//应答
	CALLHOLD         : "callst_hold",				//保持中
	CALLTRANSFING    : "callst_transfering",		//转接中
	CALLTRANSFER     : "callst_transfer",			//转接
	DOUBLETALK       : "callst_doubletalk",			//双方通话
	MEET             : "callst_meet",				//在会场中
	BREAKIN          : "callst_breakin",			//强插
	MONITOR          : "callst_monitor",			//监听通话
	CALLINWAITANSWER : "callst_callinwaitanswer",	//呼入未应答
	MONITORRING      : "callst_monitorring",		//双方直接通话响铃
	MONITORANSWER    : "callst_monitoranswer",		//双方直接通话
	MONITOROFFHOOK   : "callst_monitoroffhook",		//监听债基
	POC              : "callst_poc",				//对讲
	POC_GROUP        : "callst_poc_group",			//对讲组
	POC_BROADCAST    : "callst_poc_broadcast"		//对讲广播
};

/**
 * 调度相关操作
 * 
 * 事件：
 * connectionChanged
 * callInChanged
 * telStatusChanged
 * meetStatusChanged
 * meetMemberChanged
 */
function Dispatch() {
    var self = this;
    var dispatch = this;
    var initialized = false;
    var subscribed = false; //消息订阅注册
    var connected = false; // 与调度后台的连接状态
    var webConnected = false; // 与Web后台的连接状态
    var firstWebConnected = true;
    var token = '';
    var accountToken = '';
    var account = '';
    
    // Server-Send Event instance
    var sse = new scooper.SSE("dispatch");
    
    // use as Event Dispatcher
    var dom = document.createElement('div');
    
    // SSE 连接状态变化通知
    function onSSEConnectionCallback(sseConnected) {
    	var tryReload = (!firstWebConnected && webConnected != sseConnected && sseConnected);
    	webConnected = sseConnected;
    	if (sseConnected) firstWebConnected = false;
    	//
    	if (tryReload) {
    		pullDispatchToken();
    	}
        // fire events
        fireListens(event_const.CONN_CNG, (sseConnected && connected));
    }
    // 服务端过来的连接通知
    function onConnected(msg) {
        // {"data":true,"channel":"/conn"}
        var data = msg.data;
        if (!data || account != data.account) return;
        //
        connected = data.connected;
        // fire events
        fireListens(event_const.CONN_CNG, connected);
    }
    // 调度后台派发的 change_cfg 通知
    function onConfigChanged(msg) {
    	// {type,value}
    	var data = msg.data;
    	fireListens(event_const.CHANGE_CFG, data);
    }
    //调度后台派发的data_state_change
    function onDataStateChange(msg) {
    	var data = msg.data;
    	fireListens(event_const.DATE_STATE, data);
    }
    
    this.setRemoteBaseUrl = function(val) {
    	sse.setRemoteBaseUrl(val);
    };
    
    /** 连接标识，如果是Web服务端调用接口连接；需要先使用代码设置该值，再进行后续操作（呼叫等） */
    this.getToken = function() { return token; };
    
    this.setToken = function(val) {
    	var needLoad = (token != val);
    	//
    	token = val;
    	//
    	if (needLoad) {
    		// 当设置新的token时重新订阅
    		initialized = false;
    		self.initialize();
    		//
    		loadConnection();
    		loadAllDatas();
    	}
    };
    
    /**	登录账号的 token；当采用js方式内嵌到其它共用 DB_SC_CORE.T_ACCOUNT 的程序可实现后台自动登录； */
    this.getAccountToken = function() { return accountToken; };
    this.setAccountToken = function(val) {
    	var changed = (accountToken != val);
    	//
    	accountToken = val;
    	//
    	if (changed) {
    		pullDispatchToken();
    	}
	};
	
	/** 根据账号的token 获取账号信息 **/
	this.getAccountByToken = function(accountToken, callBack) {
		var param = {
			'accountToken': accountToken
		};
		$.getJSON(getBaseUrl()+'view/dispatch/getAccountByAccToken',param,function(ret){
			callBack(ret);
		});
	}
	//
	function pullDispatchToken() {
		var param = {
			'accountToken': accountToken
		};
		$.getJSON(getBaseUrl()+'view/dispatch/getDispatchToken',param,function(ret){
			if (ret && ret.code == 0) {
				account = ret.data.account;
				self.setToken(ret.data.token);
			}
		});
	}
	
    /** 呼叫相关操作 */
    this.calls = new Call();
    /** 会议相关操作 */
    this.meets = new Meet();
    /** 是否连接调度后台 */
    this.isConnected = function() {
        return !!token && connected && webConnected;
    };
    /** 初始化 */
    this.initialize = function() {
        if (initialized) return;
        initialized = true;
        //
        sse.setConnectionCallback(onSSEConnectionCallback);
        if(!subscribed) {
            sse.subscribe('/conn', onConnected);
            sse.subscribe('/server/config', onConfigChanged);
            //客户端数据节点变化 for 柯桥警情
            sse.subscribe('/server/dataState', onDataStateChange);
            self.calls.initialize();
            self.meets.initialize();
            subscribed = true;
        }
    };
    /** 销毁 */
    this.destroy = function() {
        self.calls.destroy();
        self.meets.destroy();
        initialized = false;
        subscribed = false;
    };
    /** 与调度服务器建立连接 */
    this.login = function(user,pass) {
        $.getJSON(apiUrl('/conn'), {'user':user,'pass':pass}, function(ret) {
            // {code,data{token,reuse}}
        	account = ret.data.account;
            token = ret.data.token;
            // 如果是已经登录，则将后台数据加载过来
            if (ret.data.reuse) {
            	loadAllDatas();
            }
        });
    };
    // 获取登录连接状态
    function loadConnection() {
    	var param = {'token': token};
    	//
    	$.getJSON(apiUrl("/conn/connected"),param,function(ret){
    		// {code,data}
    		if (ret) {
    			connected = ret.data.connected;
    			if (connected) {
    				account = ret.data.account;
    			} else {
    				account = '';
    			}
    			//
    			fireListens(event_const.CONN_CNG, connected);
    		}
    	});
    }
    // 如果是已经登录，加载所有数据
    function loadAllDatas() {
        // 检查数据是否都加载完成，加载完成则派发事件
    	var chk_complete = (function(){
        	var _count = 0;
        	var _max = 0;// 总共需加载的次数
        	return function() {
        		_max++;
        		return function(o){
            		_count++;
            		if (_count >= _max) {
            			fireListens(event_const.DATA_INIT, true);
            		}
            	};
        	};
    	})();
    	//
        self.calls.listStatus(chk_complete());
        self.calls.listCallIn(chk_complete());
        self.meets.listMeets(chk_complete());
    }
    /** 断开与调度服务器的连接 */
    this.logout = function() {
        if (!token) return;
        $.getJSON(apiUrl('/conn/logout'), {'token':token}, function() {
            token = '';
        });
    };
    /**
     * 向后台发送 change_cfg 消息
     */
    this.sendChangeCfg = function(type,value) {
        checkLogin();
        var param = {
    		'token': token,
    		'type' : type ,
    		'value': value
        };
        $.getJSON(apiUrl('/conn/changeCfg'), param, function(data){
        	fireMethodResponse(data);
        });
    };
    //
    this.listen = function(evtType,fn) {
        $(dom).on(evtType, fn);
    };
    this.unlisten = function(evtType,fn) {
        $(dom).unbind(evtType, fn);
    };
    //
    function fireListens(evtType, data) {
        var e = $.Event(evtType, {'msg':data});
        $(dom).trigger(e);
    }
    //
    function fireMethodResponse(data) {
        fireListens(event_const.METHOD_RT, data);
    }
    //
    // 验证是否登录，或者 token 是否被设置
    function checkLogin() {
        if (!token) throw new Error('token is empty! (you need login or set token first)');
    }
    // 呼叫相关操作
    function Call() {
        var self = this;
        // 当前的号码状态集合 tel:{tel,status,recording}
        var telStatus = {};
        this.requestCallStatus = function(fn) {
            if(fn) { fn(telStatus); }
        };
        this.requestTelStatus = function(tel,fn) {
            if(fn) { fn(telStatus[tel]); }
        };
        // 当前的呼入号码集合 {tel,time}
        var callIns = [];
        this.requestCallIns = function(fn) { if(fn) fn(callIns); }
        //
        function callUrl(path) { return apiUrl('/call' + path); }
        //
        function onCallStatusNotify(msg) {
            // {"data":{"status":"callst_idle","recording":false,"tel":"5010"},"channel":"/call/status"}
            var data = msg.data;
            //
            var sts = updateTelStatus(data);
            // fire events
            fireListens(event_const.CALL_STS, sts);
        }
        //
        function updateTelStatus(data) {
            var sts = telStatus[data.tel];
            if (sts) {
                sts.status = data.status;
                sts.recording = data.recording;
            } else {
                telStatus[data.tel] = sts = {
                    'tel': data.tel,
                    'status': data.status,
                    'recording': data.recording
                };
            }
            return sts;
        }
        //
        function onCallInNotify(msg) {
            // {"data":{"tel":"5010","add":true,"time":14001010111},"channel":"/call/in"}
            var data = msg.data;
            //
            var type;
            var c = null;
            if (data.add) {
                c = addCallIn(data);
                type = 'add'
            } else {
                c = removeCallInByTel(data.tel);
                type = 'del';
            }
            // fire events
            if (c != null) {
                fireListens(event_const.CALL_IN, {'type':type,'data':c});
            }
        }
        // 按号码在呼入队列中查找
        function findCallInByTel(tel) {
            for (var i = 0; i < callIns.length; i++) {
                var c = callIns[i];
                if (c && c.tel == tel) {
                    return c;
                }
            }
            return null;
        }
        // 添加到呼入队列中
        function addCallIn(data) {
            var c = findCallInByTel(data.tel);
            if (c != null) {
                c.time = data.time;
                return c;
            }
            c = {
                'tel': data.tel,
                'time': data.time
            };
            callIns.push(c);
            return c;
        }
        // 从呼入队列中移除
        function removeCallInByTel(tel) {
            var c = null;
            for (var i = callIns.length - 1; i >= 0; i--) {
                c = callIns[i];
                if (c && c.tel == tel) {
                    callIns.splice(i, 1);
                }
            }
            return c;
        }
        //
        this.initialize = function() {
            sse.subscribe('/call/status', onCallStatusNotify);
            sse.subscribe('/call/in', onCallInNotify);
        }
        this.destroy = function() {
            //sse.unsubscribe('/call/status');
        }
        //
        this.listStatus = function(resultCallback) {
            checkLogin();
            $.getJSON(callUrl('/listStatus'), {'token':token}, function(data) {
            	// {code,total,list:[{tel,status,recording}]}
                if (data && data.list && data.list.length) {
                    for (var i = 0; i < data.list.length; i++) {
                        updateTelStatus(data.list[i]);
                    }
                }
                //
                if (resultCallback) resultCallback(data);
            });
        };
        this.listCallIn = function(resultCallback) {
            checkLogin();
            $.getJSON(callUrl('/listCallIn'), {'token':token}, function(data) {
                // {code,total,list:[{tel,time}]}
                if (data && data.list && data.list.length) {
                    for (var i = 0; i < data.list.length; i++) {
                        addCallIn(data.list[i]);
                    }
                }
                //
                if (resultCallback) resultCallback(data);
            });
        };
        //
        function requestNoParam(path) {
            checkLogin();
            $.getJSON(callUrl(path), {'token':token}, function(data){
            	fireMethodResponse(data);
            });
        }
        function requestWithTel(path,tel) {
            checkLogin();
            $.getJSON(callUrl(path), {'token':token,'tel':tel}, function(data){
            	fireMethodResponse(data);
            });
        }
        function requestWithGroupId(path,groupId) {
            checkLogin();
            $.getJSON(callUrl(path), {'token':token,'groupId':groupId}, function(data){
            	fireMethodResponse(data);
            });
        }
        //
        this.makeCall = function(tel) {
            requestWithTel('/makeCall',tel);
        };
        this.hungUp = function(tel) {
            requestWithTel('/hungup',tel);
        };
        this.answer = function(tel) {
            requestWithTel('/answer',tel);
        };
        this.answerAll = function() {
            requestNoParam('/answerAll');
        };
        this.hold = function(tel) {
            requestWithTel('/hold',tel);
        };
        this.unhold = function(tel) {
            requestWithTel('/unhold',tel);
        };
        this.transfer = function(from,to) {
            checkLogin();
            $.getJSON(callUrl('/transfer'),{'token':token,'from':from,'to':to}, function(data){
            	fireMethodResponse(data);
            });
        };
        this.retrieve = function(tel) {
            requestWithTel('/retrieve',tel);
        };
        this.tripleMonitor = function(tel) {
            requestWithTel('/tripleMonitor',tel);
        };
        this.tripleBreakin = function(tel) {
            requestWithTel('/tripleBreakin',tel);
        };
        this.tripleHungup = function(tel) {
            requestWithTel('/tripleHungup',tel);
        };
        this.callRecord = function(tel) {
            requestWithTel('/callRecord',tel);
        };
        this.callRecordEnd = function(tel) {
            requestWithTel('/callRecordEnd',tel);
        };
        this.groupCall = function(groupId) {
            requestWithGroupId('/groupCall',groupId);
        };
        this.groupCancel = function(groupId) {
            requestWithGroupId('/groupCancel',groupId);
        };
        this.selectCall = function(tels) {
            if (!tels || tels.length == 0) throw new Error("tels can't be empty!");
            checkLogin();
            $.getJSON(callUrl('/selectCall'),{'token':token,'tels':tels.join()}, function(data){
            	fireMethodResponse(data);
            });
        };
        this.selectCancel = function() {
            requestNoParam('/selectCancel');
        };
        this.groupSame = function(memIds) {
            if (!memIds || memIds.length == 0) throw new Error("memIds can't be empty!");
            checkLogin();
            $.getJSON(callUrl('/groupSame'),{'token':token,'memberIds':memIds.join()}, function(data){
            	fireMethodResponse(data);
            });
        };
        //
        function requestGroupNotify(param,type,times,notifyId) {
        	checkLogin();
        	//
        	param['token'] = token;
        	if (type) param["type"] = type;
        	if (times && !isNaN(times)) param["times"] = times;
        	if (notifyId) param["notifyId"] = notifyId;
        	//
        	$.ajax({
        		type: 'post',
        		traditional: true,
        		url: callUrl('/groupNotify'),
        		data: param,
        		success: function(ret){
        			fireMethodResponse(ret);
    			}
        	});
        }
        /**
         * @param type  notify : 通知音录音，call_record : 通话录音，text : TTS（playfile携带文字）。
         */
        this.groupNotify = function(groupId,files,type,times,notifyId) {
        	if (!groupId) throw new Error("groupId can't be empty!");
        	if (!files) throw new Error("files can't be empty!");
        	//
        	var param = {
    			"groupId": groupId,
    			"files": files.join()
        	};
        	//
        	requestGroupNotify(param, type, times, notifyId);
        };
        /**
         * @param type  notify : 通知音录音，call_record : 通话录音，text : TTS（playfile携带文字）。
         */
        this.selectNotify = function(tels,files,type,times,notifyId) {
        	if (!tels) throw new Error("tels can't be empty!");
        	if (!files) throw new Error("files can't be empty!");
        	//
        	var param = {
    			"tels": tels.join(),
    			"files": files.join()
        	};
        	//
        	requestGroupNotify(param, type, times, notifyId);
        };
        // 同振
        this.makeCallSame = function(tels, meetId) {
        	if (!tels) throw new Error("tels can't be empty!");
        	//
        	var param = {
    			"token": token,
    			"tels": tels.join()
        	};
        	if(meetId) param.meetId = meetId;
        	//
            checkLogin();
            $.getJSON(callUrl('/makeCallSame'), param, function(data){
            	fireMethodResponse(data);
            });
        };
    }
    // 会议相关操作
    function Meet() {
        var self = this;
        // 当前存在的会场集合 {id,name,locked,playVoice,recording,members}
        // members:[{meetId,tel,level}]
        var meets = [];
        // function(meets)
        this.requestMeets = function(fn) { if(fn) fn(meets); }
        // function(members)
        this.requestMeetMembers = function(id,fn) {
        	var meet = findMeetById(id);
        	if (fn) fn(meet?meet.members:null);
        };
        // function(member)
        this.requestMeetMember = function(meetId,tel,fn) {
        	if (fn) {
        		fn(findMeetMember(meetId, tel));
        	}
        };
        //
        function findMeetMember(meetId,tel) {
        	var meet = findMeetById(meetId);
        	if (!meet) return null;
    		for (var i = 0; i < meet.members.length; i++) {
    			var mem = meet.members[i];
    			if (mem && mem.tel == tel) {
    				return mem;
    			}
    		}
    		return null;
        }
        //
        function meetUrl(path) { return apiUrl('/meet' + path); }
        //
        function onMeetStatusNotify(msg) {
            // {"data":{"playVoice":false,"meetId":"1008","destroy":false,"recording":false,"meetName":"默认","locked":false},"channel":"/meet/status"}
            var data = msg.data;
            if (!data || !data.meetId) return;
            //
            var meet = findMeetById(data.meetId);
            if (meet == null) {
                // add
                meet = addMeetByData(data);
            } else {
                // update
            	if (data.meetCreateId != null) meet.createId = data.meetCreateId;
                if (data.meetName != null) meet.name = data.meetName;
                if (data.hasOwnProperty('locked')) meet.locked = data.locked;
                if (data.hasOwnProperty('playVoice')) meet.playVoice = data.playVoice;
                if (data.hasOwnProperty('recording')) meet.recording = data.recording;
                // meet destory.update by yeb
                if (data.hasOwnProperty('destroy')) meet.destroy = data.destroy;
                meet.chairman = data.chairman?data.chairman:'';
            }
            // fire events
            fireListens(event_const.MEET_STS, meet);
        }
        function onMeetJoinNotify(msg) {
            // {"data":{"meetId":"1008","tel":"5012","level":"speak"},"channel":"/meet/status"}
            var data = msg.data;
            //
            var meet = findMeetById(data.meetId) || addMeetByData(data);
            //
            for (var i = 0; i < meet.members.length; i++) {
                var mem = meet.members[i];
                if (mem && mem.tel == data.tel) return;
            }
            meet.members.push({
                'meetId': data.meetId,
                'tel': data.tel,
                'level': data.level // speak|audience|chairman
            });
            // fire events
            fireListens(event_const.MEET_MEM, {'type':'join','meetId':data.meetId,'tel':data.tel,'level': data.level});
        }
        function onMeetLeaveNotify(msg) {
            // {"data":{"meetId":"1008","tel":"5012"},"channel":"/meet/status"}
            var data = msg.data;
            if (!data || !data.meetId) return;
            //
            var meet = findMeetById(data.meetId);
            if (!meet) return;
            //
            for (var i = meet.members.length - 1; i >= 0; i--) {
                var mem = meet.members[i];
                if (mem && mem.tel == data.tel) {
                    meet.members.splice(i,1);
                }
            }
            // fire events
            fireListens(event_const.MEET_MEM, {'type':'leave','meetId':data.meetId,'tel':data.tel});
        }
        function onMeetMemStsNotify(msg) {
        	// {"data":{"meetId":"1008","tel":"5012","level":"speak"},"channel":"/meet/status"}
            var data = msg.data;
            if (!data || !data.meetId) return;
            //
            var meet = findMeetById(data.meetId);
            if (!meet) return;
            //
            for (var i = meet.members.length - 1; i >= 0; i--) {
                var mem = meet.members[i];
                if (mem && mem.tel == data.tel) {
                    mem.level = data.level;
                }
            }
            // fire events
            fireListens(event_const.MEET_MEM, {'type':'level','meetId':data.meetId,'tel':data.tel,'level': data.level});
        }
        //
        function findMeetById(id) {
            for (var i = 0; i < meets.length; i++) {
                var meet = meets[i];
                if (meet && meet.id == id) {
                    return meet;
                }
            }
            return null;
        }
        //
        function findMeetAndUpdate(meet) {
        	if (!meet) return null;
        	for (var i = 0; i < meets.length; i++) {
        		var o = meets[i];
        		if (o && o.id == meet.id) {
        			return updateMeetObject(o,meet);
        		}
        	}
        	return null;
        }
        // (oldValue,newValue)
        function updateMeetObject(o,n) {
        	o.createId = n.createId || o.createId;
        	o.name = n.name || o.name;
        	o.type = n.type || o.type;
        	o.locked = n.locked || o.locked;
        	o.playVoice = n.playVoice || o.playVoice;
        	o.recording = n.recording || o.recording;
        	o.chairman = n.chairman || o.chairman;
        	o.members = n.members.length?n.members:o.members;
        	return o;
        }
        //
        function addMeetByData(data) {
            var meet = {
            	'createId': data.meetCreateId,
                'id': data.meetId,
                'name': data.meetName,
                'type': data.meetType,
                'locked': data.locked,
                'playVoice': data.playvoice,
                'recording': data.recording,
                'chairman': data.chairman,
                'members': [] // {meetId,tel,level}
            };
            //
            if (data.members) {
                for (var i = 0; i < data.members.length; i++) {
                	var mem = data.members[i];
                    meet.members.push({
                        'meetId': mem.meetId,
                        'tel': mem.tel,
                        'level': mem.level
                    });
                }
            }
            // add or update
            var o = findMeetAndUpdate(meet);
            if (o) {
            	meet = o;
            } else {
            	meets.push(meet);
                // fire events
                fireListens(event_const.MEET_LST, {'type':'add','meet': meet});
            }
            return meet;
        }
        //
        function removeMeetById(id) {
            for (var i = meets.length - 1; i >= 0; i--) {
                var meet = meets[i];
                if (meet && meet.id == id) {
                    meets.splice(i, 1);
                    // fire events
                    fireListens(event_const.MEET_LST, {'type':'remove','meet': meet});
                }
            }
        }
        //
        this.initialize = function() {
            sse.subscribe('/meet/status', onMeetStatusNotify);
            sse.subscribe('/meet/join', onMeetJoinNotify);
            sse.subscribe('/meet/leave', onMeetLeaveNotify);
            sse.subscribe('/meet/memsts', onMeetMemStsNotify);
        }
        this.destroy = function() {
        }
        //
        this.listMeets = function(resultCallback) {
            checkLogin();
            $.getJSON(meetUrl('/listMeets'), {'token':token}, function(data) {
                // {code,total,list:[{meetId,meetName,recording,playvoice,locked,members:[{meetId,tel}]}]}
                if (data && data.list && data.list.length) {
                    for (var i = 0; i < data.list.length; i++) {
                        addMeetByData(data.list[i]);
                    }
                }
                //
                if (resultCallback) resultCallback(data);
            });
        };
        this.createMeet = function(name, resultCallback) {
            checkLogin();
            $.getJSON(meetUrl('/createMeet'), {'token':token,'name':name}, function(data) {
                // {code,packetId}
                if (resultCallback) resultCallback(data);
            	fireMethodResponse(data);
            })
        };
        //
        function requestWithMeetId(path,id) {
            checkLogin();
            $.getJSON(meetUrl(path), {'token':token,'id':id}, function(data){
            	fireMethodResponse(data);
            });
        }
        //
        this.endMeet = function(id) {
            requestWithMeetId('/endMeet', id);
        }
        this.destroyMeet = function(id) {
            requestWithMeetId('/destroyMeet', id);
        }
        this.lock = function(id) {
            requestWithMeetId('/lock', id);
        }
        this.unlock = function(id) {
            requestWithMeetId('/unlock', id);
        }
        this.startRecord = function(id) {
            requestWithMeetId('/startRecord', id);
        }
        this.stopRecord = function(id) {
            requestWithMeetId('/stopRecord', id);
        }
        this.startPlayVoice = function(id) {
            requestWithMeetId('/startPlayVoice', id);
        }
        this.stopPlayVoice = function(id) {
            requestWithMeetId('/stopPlayVoice', id);
        }
        // meet-member actions
        //
        function requestAsMeetMember(path,id,tel,level) {
            checkLogin();
            if (!level) level = '';
            $.getJSON(meetUrl(path), {'token':token,'id':id,'tel':tel,'level':level}, function(data){
            	fireMethodResponse(data);
            });
        }
        this.joinMember = function(id,tel,level) {
            requestAsMeetMember('/joinMember',id,tel,level);
        };
        this.changeMemberLevel = function(id,tel,level) {
            requestAsMeetMember('/changeMemberLevel',id,tel,level);
        };
        this.changeMemberToSpeaker = function(id,tel) {
        	self.changeMemberLevel(id, tel, "speak");
        };
        this.changeMemberToAudience = function(id,tel) {
        	self.changeMemberLevel(id, tel, "audience");
        };
        this.changeMemberToChairman = function(id,tel) {
        	self.changeMemberLevel(id, tel, "chairman");
        };
        function requestAsLiteMeetMember(path,id,tel) {
            checkLogin();
            $.getJSON(meetUrl(path), {'token':token,'id':id,'tel':tel}, function(data){
            	fireMethodResponse(data);
            });
        }
        this.kickMember = function(id,tel) {
            requestAsLiteMeetMember('/kickMember', id, tel);
        };
        this.privateTalk = function(id,tel) {
            requestAsLiteMeetMember('/privateTalk', id, tel);
        };
        this.backToMeet = function(id,tel) {
            requestAsLiteMeetMember('/backToMeet', id, tel);
        };
    }
};

/** 子页面中的；通过引用来调用主页面中的功能（相同域名下） */
function DispatchSub() {
    // 如果在与主连接在同一域名下，则直接通过框架引用对象
    
    // 对主框架中 scooper.dispatch 的引用（相同域名下）
    var dispatch = null;
    //
    this.initialize = function() {
        var topFrame = findMainFrame();
        dispatch = topFrame.scooper.dispatch;
    };
    this.destroy = function() {
        dispatch = null;
    };
    this.getToken = function() {
        checkInit();
    	return dispatch.getToken();
    };
    this.setToken = function(val) {
        checkInit();
        dispatch.setToken(val);
    };
    this.getAccountToken = function() {
        checkInit();
    	if (dispatch.hasOwnProperty('getAccountToken')) {
    		return dispatch.getAccountToken();
    	}
    	return '';
    }
    this.setAccountToken = function(val) {
        checkInit();
    	if (dispatch.hasOwnProperty('setAccountToken')) {
    		dispatch.setAccountToken(val);
    	}
    }
    
    this.getAccountByToken = function(accountToken, clb) {
    	checkInit();
    	if (dispatch.hasOwnProperty('getAccountByToken')) {
    		dispatch.getAccountByToken(accountToken, clb);
    	}
	}
    
    this.sendChangeCfg = function(type,value) {
    	checkInit();
    	dispatch.sendChangeCfg(type, value);
    };
    //
    function checkInit() {
        if (!dispatch) {
            throw new Error("not initialized");
        }
    }
    //
    this.login = function(user,pass) { /* do nothing */ };
    this.logout = function() { /* do nothing */ };
    //
    this.listen = function(evtType,fn) {
        checkInit();
        dispatch.listen(evtType,fn);
    };
    this.unlisten = function(evtType,fn) {
        checkInit();
        dispatch.unlisten(evtType,fn);
    };
    // 呼叫相关操作
    this.calls = {
        'requestCallStatus': function(fn) {
            checkInit();
            dispatch.calls.requestCallStatus(fn);
        },
        'requestTelStatus': function(tel,fn) {
            checkInit();
            dispatch.calls.requestTelStatus(tel,fn);
        },
        'requestCallIns': function(fn) {
            checkInit();
            dispatch.calls.requestCallIns(fn);
        },
        'listStatus': function(resultCallback) {
            checkInit();
            dispatch.calls.listStatus(resultCallback);
        },
        'listCallIn': function(resultCallback) {
            checkInit();
            dispatch.calls.listCallIn(resultCallback);
        },
        'makeCall': function(tel) {
            checkInit();
            dispatch.calls.makeCall(tel);
        },
        'hungUp': function(tel) {
            checkInit();
            dispatch.calls.hungUp(tel);
        },
        'answer': function(tel) {
            checkInit();
            dispatch.calls.answer(tel);
        },
        'answerAll': function(tel) {
            checkInit();
            dispatch.calls.answerAll();
        },
        'hold': function(tel) {
            checkInit();
            dispatch.calls.hold(tel);
        },
        'unhold': function(tel) {
            checkInit();
            dispatch.calls.unhold(tel);
        },
        'transfer': function(from,to) {
            checkInit();
            dispatch.calls.transfer(from,to);
        },
        'retrieve': function(tel) {
            checkInit();
            dispatch.calls.retrieve(tel);
        },
        'tripleMonitor': function(tel) {
            checkInit();
            dispatch.calls.tripleMonitor(tel);
        },
        'tripleBreakin': function(tel) {
            checkInit();
            dispatch.calls.tripleBreakin(tel);
        },
        'tripleHungup': function(tel) {
            checkInit();
            dispatch.calls.tripleHungup(tel);
        },
        'callRecord': function(tel) {
            checkInit();
            dispatch.calls.callRecord(tel);
        },
        'callRecordEnd': function(tel) {
            checkInit();
            dispatch.calls.callRecordEnd(tel);
        },
        'groupCall': function(groupId) {
            checkInit();
            dispatch.calls.groupCall(groupId);
        },
        'groupCancel': function(groupId) {
            checkInit();
            dispatch.calls.groupCancel(groupId);
        },
        'selectCall': function(tels) {
            checkInit();
            dispatch.calls.selectCall(tels);
        },
        'selectCancel': function() {
            checkInit();
            dispatch.calls.selectCancel();
        },
        'groupSame' : function(memIds) {
            checkInit();
            dispatch.calls.groupSame(memIds);
        },
        'groupNotify': function(groupId,files,type,times,notifyId) {
        	checkInit();
        	dispatch.calls.groupNotify(groupId,files,type,times,notifyId);
        },
        'selectNotify': function(tels,files,type,times,notifyId) {
        	checkInit();
        	dispatch.calls.selectNotify(tels,files,type,times,notifyId);
        },
        'makeCallSame': function(tels, meetId) {
        	checkInit();
        	dispatch.calls.makeCallSame(tels, meetId);
        }
    };
    // 会议相关操作
    this.meets = {
        'requestMeets': function(fn) {
            checkInit();
            dispatch.meets.requestMeets(fn);
        },
        'requestMeetMembers': function(id,fn) {
        	checkInit();
        	dispatch.meets.requestMeetMembers(id,fn);
        },
        'requestMeetMember': function(meetId,tel,fn) {
        	checkInit();
        	dispatch.meets.requestMeetMember(meetId,tel,fn);
        },
        'listMeets': function(fn) {
            checkInit();
            dispatch.meets.listMeets(fn);
        },
        'createMeet': function(name,resultCallback) {
            checkInit();
            dispatch.meets.createMeet(name,resultCallback);
        },
        'endMeet': function(id) {
            checkInit();
            dispatch.meets.endMeet(id);
        },
        'destroyMeet': function(id) {
            checkInit();
            dispatch.meets.destroyMeet(id);
        },
        'lock': function(id) {
            checkInit();
            dispatch.meets.lock(id);
        },
        'unlock': function(id) {
            checkInit();
            dispatch.meets.unlock(id);
        },
        'startRecord': function(id) {
            checkInit();
            dispatch.meets.startRecord(id);
        },
        'stopRecord': function(id) {
            checkInit();
            dispatch.meets.stopRecord(id);
        },
        'startPlayVoice': function(id) {
            checkInit();
            dispatch.meets.startPlayVoice(id);
        },
        'stopPlayVoice': function(id) {
            checkInit();
            dispatch.meets.stopPlayVoice(id);
        },
        'joinMember': function(id, tel, level) {
            checkInit();
            dispatch.meets.joinMember(id,tel,level);
        },
        'changeMemberLevel': function(id, tel, level) {
            checkInit();
            dispatch.meets.changeMemberLevel(id,tel,level);
        },
        'changeMemberToSpeaker': function(id, tel) {
        	checkInit();
        	dispatch.meets.changeMemberToSpeaker(id,tel);
        },
        'changeMemberToAudience': function(id, tel) {
        	checkInit();
        	dispatch.meets.changeMemberToAudience(id,tel);
        },
        'changeMemberToChairman': function(id, tel) {
        	checkInit();
        	dispatch.meets.changeMemberToChairman(id,tel);
        },
        'kickMember': function(id, tel) {
            checkInit();
            dispatch.meets.kickMember(id, tel);
        },
        'privateTalk': function(id, tel) {
        	checkInit();
        	dispatch.meets.privateTalk(id, tel);
        },
        'backToMeet': function(id, tel) {
        	checkInit();
        	dispatch.meets.backToMeet(id, tel);
        }
    };
}

/** 跨域调用（子页面、顶层框架） */
function DispatchXDomain() {
    // TODO 与使用 dispatch 的框架处于不同域名，则通过发送消息来实现；
    
    this.initialize = function() {
        //
    };
    this.destroy = function() {
        //
    };
};

/** 封装各层框架中的实现 */
function DispatchProxy() {
    var self = this;
    //
    var _type = null;
    var dispatch = null;
    //
    function checkInit() {
        if (!dispatch) {
            throw new Error("not initialized");
        }
    }
    
    /** 如果与调度网页后台处于不同域名，则需要在一开始就设置该值为调度网页后台的地址（包含 contextPath ） */
    this.setRemoteBaseUrl = function(val) {
        remoteBaseUrl = val;
        if (dispatch && dispatch.hasOwnProperty('setRemoteBaseUrl')) {
        	dispatch.setRemoteBaseUrl(val);
        }
    };
    /** 获取当前调用方式：main, sub, xdomain */
    this.getType = function() {
        return _type;
    };
    //
    this.getToken = function() {
    	if (dispatch.hasOwnProperty('getToken')) {
    		return dispatch.getToken();
    	}
    	return '';
    }
    this.setToken = function(val) {
    	if (dispatch.hasOwnProperty('setToken')) {
    		dispatch.setToken(val);
    	}
    }
    //
    this.isConnected = function() {
    	if (dispatch.hasOwnProperty('isConnected')) {
    		return dispatch.isConnected();
    	}
    	return false;
    }

    /**	登录账号的 token；当采用js方式内嵌到其它共用 DB_SC_CORE.T_ACCOUNT 的程序可实现后台自动登录； */
    this.getAccountToken = function() {
    	if (dispatch.hasOwnProperty('getAccountToken')) {
    		return dispatch.getAccountToken();
    	}
    	return '';
    }
    this.setAccountToken = function(val) {
    	if (dispatch.hasOwnProperty('setAccountToken')) {
    		dispatch.setAccountToken(val);
    	}
    }
    
    this.getAccountByToken = function(accountToken, clb) {
    	if (dispatch.hasOwnProperty('getAccountByToken')) {
    		dispatch.getAccountByToken(accountToken, clb);
    	}
	}
    
    /**
     * 初始化
     * @param type main - 作为主框架存在；sub - 是作为子页面的组件存在；xdomain - 跨域调用
     */
    this.initialize = function(type) {
        if (!type) type = "main";
        switch(type) {
            case "main": dispatch = new Dispatch(); break;
            case "sub" : dispatch = new DispatchSub(); break;
            case "xdomain": dispatch = new DispatchXDomain(); break;
            default: throw new Error("unknow type : " + type);
        }
        _type = type;
        //
        if (remoteBaseUrl) {
        	self.setRemoteBaseUrl(remoteBaseUrl);
        }
        //
        dispatch.initialize();
    };
    this.destroy = function() {
        checkInit();
        dispatch.destroy();
    };
    //
    this.login = function(user,pass) {
        checkInit();
        dispatch.login(user,pass);
    };
    this.logout = function() {
        checkInit();
        dispatch.logout();
    };
    this.sendChangeCfg = function(type,value) {
    	checkInit();
    	dispatch.sendChangeCfg(type, value);
    };
    this.listen = function(evtType,fn) {
        checkInit();
        dispatch.listen(evtType, fn);
    };
    this.unlisten = function(evtType, fn) {
        checkInit();
        dispatch.unlisten(evtType, fn);
    };
    // 呼叫相关操作
    this.calls = {
        'requestCallStatus': function(fn) {
            checkInit();
            dispatch.calls.requestCallStatus(fn);
        },
        'requestTelStatus': function(tel,fn) {
            checkInit();
            dispatch.calls.requestTelStatus(tel,fn);
        },
        'requestCallIns': function(fn) {
            checkInit();
            dispatch.calls.requestCallIns(fn);
        },
        'listStatus': function(resultCallback) {
            checkInit();
            dispatch.calls.listStatus(resultCallback);
        },
        'listCallIn': function(resultCallback) {
            checkInit();
            dispatch.calls.listCallIn(resultCallback);
        },
        'makeCall': function(tel) {
            checkInit();
            dispatch.calls.makeCall(tel);
        },
        'hungUp': function(tel) {
            checkInit();
            dispatch.calls.hungUp(tel);
        },
        'answer': function(tel) {
            checkInit();
            dispatch.calls.answer(tel);
        },
        'answerAll': function(tel) {
            checkInit();
            dispatch.calls.answerAll();
        },
        'hold': function(tel) {
            checkInit();
            dispatch.calls.hold(tel);
        },
        'unhold': function(tel) {
            checkInit();
            dispatch.calls.unhold(tel);
        },
        'transfer': function(from,to) {
            checkInit();
            dispatch.calls.transfer(from,to);
        },
        'retrieve': function(tel) {
            checkInit();
            dispatch.calls.retrieve(tel);
        },
        'tripleMonitor': function(tel) {
            checkInit();
            dispatch.calls.tripleMonitor(tel);
        },
        'tripleBreakin': function(tel) {
            checkInit();
            dispatch.calls.tripleBreakin(tel);
        },
        'tripleHungup': function(tel) {
            checkInit();
            dispatch.calls.tripleHungup(tel);
        },
        'callRecord': function(tel) {
            checkInit();
            dispatch.calls.callRecord(tel);
        },
        'callRecordEnd': function(tel) {
            checkInit();
            dispatch.calls.callRecordEnd(tel);
        },
        'groupCall': function(groupId) {
            checkInit();
            dispatch.calls.groupCall(groupId);
        },
        'groupCancel': function(groupId) {
            checkInit();
            dispatch.calls.groupCancel(groupId);
        },
        'selectCall': function(tels) {
            checkInit();
            dispatch.calls.selectCall(tels);
        },
        'selectCancel': function() {
            checkInit();
            dispatch.calls.selectCancel();
        },
        'groupSame' : function(memIds) {
            checkInit();
            dispatch.calls.groupSame(memIds);
        },
        'groupNotify': function(groupId,files,type,times,notifyId) {
        	checkInit();
        	dispatch.calls.groupNotify(groupId,files,type,times,notifyId);
        },
        'selectNotify': function(tels,files,type,times,notifyId) {
        	checkInit();
        	dispatch.calls.selectNotify(tels,files,type,times,notifyId);
        },
        'makeCallSame': function(tels, meetId) {
        	checkInit();
        	dispatch.calls.makeCallSame(tels, meetId);
        }
    };
    // 会议相关操作
    this.meets = {
        'requestMeets': function(fn) {
            checkInit();
            dispatch.meets.requestMeets(fn);
        },
        'requestMeetMembers': function(id,fn) {
        	checkInit();
        	dispatch.meets.requestMeetMembers(id,fn);
        },
        'requestMeetMember': function(meetId,tel,fn) {
        	checkInit();
        	dispatch.meets.requestMeetMember(meetId,tel,fn);
        },
        'listMeets': function(fn) {
            checkInit();
            dispatch.meets.listMeets(fn);
        },
        'createMeet': function(name,resultCallback) {
            checkInit();
            dispatch.meets.createMeet(name,resultCallback);
        },
        'endMeet': function(id) {
            checkInit();
            dispatch.meets.endMeet(id);
        },
        'destroyMeet': function(id) {
            checkInit();
            dispatch.meets.destroyMeet(id);
        },
        'lock': function(id) {
            checkInit();
            dispatch.meets.lock(id);
        },
        'unlock': function(id) {
            checkInit();
            dispatch.meets.unlock(id);
        },
        'startRecord': function(id) {
            checkInit();
            dispatch.meets.startRecord(id);
        },
        'stopRecord': function(id) {
            checkInit();
            dispatch.meets.stopRecord(id);
        },
        'startPlayVoice': function(id) {
            checkInit();
            dispatch.meets.startPlayVoice(id);
        },
        'stopPlayVoice': function(id) {
            checkInit();
            dispatch.meets.stopPlayVoice(id);
        },
        'joinMember': function(id, tel, level) {
            checkInit();
            dispatch.meets.joinMember(id,tel,level);
        },
        'changeMemberLevel': function(id, tel, level) {
            checkInit();
            dispatch.meets.changeMemberLevel(id,tel,level);
        },
        'changeMemberToSpeaker': function(id, tel) {
        	checkInit();
        	dispatch.meets.changeMemberToSpeaker(id,tel);
        },
        'changeMemberToAudience': function(id, tel) {
        	checkInit();
        	dispatch.meets.changeMemberToAudience(id,tel);
        },
        'changeMemberToChairman': function(id, tel) {
        	checkInit();
        	dispatch.meets.changeMemberToChairman(id,tel);
        },
        'kickMember': function(id, tel) {
            checkInit();
            dispatch.meets.kickMember(id, tel);
        },
        'privateTalk': function(id, tel) {
        	checkInit();
        	dispatch.meets.privateTalk(id, tel);
        },
        'backToMeet': function(id, tel) {
        	checkInit();
        	dispatch.meets.backToMeet(id, tel);
        }
    };
}

// 常量定义
Dispatch.prototype.event_const = event_const;
DispatchSub.prototype.event_const = event_const;
DispatchProxy.prototype.event_const = event_const;
DispatchXDomain.prototype.event_const = event_const;
DispatchProxy.prototype.status_const = status_const;

return window.scooper.dispatch = new DispatchProxy();
}));