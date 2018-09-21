<#if useVar>
/**
 * Declare this variable before loading RequireJS JavaScript library
 * 使用：<script src="/dispatch-web/conf/requireConfig?var=require"></script> 来引入
 */
var ${varName} =
</#if>
{
		"baseUrl": "${contextPath}/js",
		"priority": ["jquery"],
		"shim": {
			"jquery": {"exports":"jQuery"},
			"jquery.cookie": ["jquery"],
			"bootstrap": ["jquery"],
			"ztree": ["jquery"],
			"jgrowl": ["jquery"]
		},
		"paths": {
	        "jquery": "lib/jquery-1.9.1",
	        "bootstrap": "lib/bootstrap.min",
	        "respond": "lib/respond.min",
	        "org": "${contextPath}/org", // for CometD
	        "jquery.cometd": "lib/jquery.cometd",
	        "jquery.cometd-ack": "lib/jquery.cometd-ack",
	        "jquery.cometd-reload": "lib/jquery.cometd-reload",
	        "jquery.cometd-timestamp": "lib/jquery.cometd-timestamp",
	        "jquery.cometd-timesync": "lib/jquery.cometd-timesync",
	        "jquery.cookie": "lib/jquery.cookie",
	        "ztree": "lib/jquery.ztree.all",
	        "jgrowl": "lib/jgrowl/js/jquery.jgrowl.min"
		}
}