;(function (global) {
    // 创建自定义cPromise构造函数
    function cPromise (func) {
        var self = this;
        this.state = 0; // 0: 表示进行中 1：表示完成 2：表示拒绝
        this.value = null;
        this.resolveCallbacks = [];
        this.rejectCallbacks = [];
        var resolve = function (data) {
            console.log('resolve');
            // this.then
            self.state = 1;
            self.value = data;
            // cPromise.prototype.then.call(self);
            var resolveCallbacks = self.resolveCallbacks;
            for (var i = 0; i < resolveCallbacks.length; i++) {
                var callback = resolveCallbacks[i];
                if (i == 0) {
                    self.value = data;
                }
                self.value = callback(self.value);
            }
        }
        var reject = function (data) {
            self.state = 2;
            self.value = data;
            console.log('reject');
            var rejectCallbacks = self.rejectCallbacks;
            for (var i = 0; i < rejectCallbacks.length; i++) {
                var callback = rejectCallbacks[i];
                if (i == 0) {
                    self.value = data;
                }
                self.value = callback(self.value);
            }
        }
        func.call(this, resolve, reject);
    }
    // 初始化cPromise.prototype.then
    cPromise.prototype.then = function (success, fail) {
        this.resolveCallbacks.push(success);
        this.rejectCallbacks.push(fail);
        //var state = this.state;
        return this;
    }
    global.cPromise = cPromise;
})(this);