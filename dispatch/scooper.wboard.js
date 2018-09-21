(function (window, factory) {
	if (typeof define === 'function' && define.amd) {
		define('scooper.wboard', ['jquery'], factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = window.document ?
				factory(jQuery) :
				factory(requir('jquery'));
	} else {
		factory(jQuery);
	}
}(typeof window !== 'undefined' ? window : this, function ($){
	'use strict';
	
window.scooper = window.scooper || {};
if (window.scooper.wboard) return;

var event_const = {
	CONN_CNG	:	"connectionChanged",
	MEET_STS	:   "meetStatusChanged",
	MEET_MEM	:   "meetMemberChanged"
}
function apiUrl(path) {
	return window.contextPath + '/api' + path;
}
function WBMeetUrl(path) { 
	return apiUrl('/wbmeet' + path);
}
//获取本服务器网络请求的绝对路径 ${contextPath}/path/to/service
function _absUrl(path) {
	return window.contextPath + path;
}
// 获取通讯录成员相关数据加载地址
function _contactUrl(path) {
	return _absUrl('/data/contact' + path);
}

function WBoard() {
	if(!isIE()) {
		console.log("视频插件不支持非IE浏览器！");
	}
	var self = this,
	_obj,
	_asGetInfoCall,
	_accId = 0;
	
	//use as Event WhiteBoard
	var dom = document.createElement('div');
	
	function isIE() {
		return window.ActiveXObject || "ActiveXObject" in window;
	}
	
	//初始化控件
	this.init = function(objId) {
		if(!isIE())
			throw new Error("电子白板插件不支持非IE浏览器！");
		_obj = document.getElementById(objId);
	}
	
	//连接到白板服务器 i 
	this.connect = function(serverIP, serverPort) {
		var result = _obj.ConnectToServer(serverIP, serverPort);
		return result;
	}
	
	//登陆到电子白板服务器
	this.login = function(user, pass) {
		var result = _obj.Login(user, pass);
		return result;
	}
	
	//设置是否自动接受邀请0：不自动接受；1：自动接受
	this.setAutoAccept = function(bAuto) {
		_obj.SetAutoAccept(bAuto);
	}
	
	//根据会议名称获取会议ID
	this.getMeetByName = function(szMeetName, callBack) {
		_asGetInfoCall = callBack;
		var result = _obj.GetMeetingByName(szMeetName);
	}
	
	//创建白板会议
	this.creatMeet = function(szName, callBack) {
		var result = _obj.CreateMeeting(szName, 0);
		return result;
	}
	
	//加入白板会议
	this.joinMeet = function(szMeetId) {
		var result = _obj.JoinMeeting(szMeetId);
		return result;
	}
	
	//离开白板会议
	this.leaveMeet = function(accId, meetId) {
		var result = _obj.ExitMeeting();
		return result;
	}
	
	//邀请用户参加会议
	this.inviteMeetUser = function(tell, meetId, response) {
		$.getJSON(_contactUrl("/getAccountByTell"), {'tell':tell}, function(obj) {
			if(obj.code == 0) {
				var szUsers = obj.data.accId;
				var result = _obj.InviteMeetingUser(meetId, szUsers);
				response(result);
			}
		});
	}
	
	//meetCreat event
	this.onMeetCreatEvent = function(szMeetingId, szMeetName, szMsg) {
		var jsonData = {
			"meetId"   :  szMeetingId,
			"meetName" :  szMeetName,
			"type"	   :  'creat',
			"accId"	   :  _accId
		}
		fireListens(event_const.MEET_STS, jsonData);
	}
	
	//meetMem Change event
	this.onMeetEvent = function(lEventType, szMeetingId, WBAccId) {
		var objData = {
			"meetId"   :  szMeetingId,
			"accId"	   :  WBAccId,
			"type"	   :  lEventType	
		}
		if(lEventType == 0) {
			objData.type = 'destory';
			fireListens(event_const.MEET_STS, objData);
		}
		fireListens(event_const.MEET_MEM, objData);
	}
	
	
	this.onGetMeetInfo = function(result, szMeetId, szMeetName, WBAccId, error) {
		var objData = {
			'result'	:     result,
			'meetId'    :     szMeetId,
			'meetName'  :     szMeetName,
			'memId'		:     WBAccId
		}
		_asGetInfoCall(objData);
	}
	
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
    
    function verifiMethod(data, method) {
		if(typeof method === 'function') {
			method(data);
		}
	}
}

//常量定义
WBoard.prototype.event_const = event_const;

// export White Board Event Class
window.scooper.WBoard = WBoard;

window.scooper.wboard = new WBoard();
return window.scooper.wboard;
}));