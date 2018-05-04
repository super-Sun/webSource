;(function () {
    function FUNC() {
        this.name = 'name';
    }
    FUNC.prototype.getName = function () {
        return this.name;
    }

    window.FUNC = FUNC;
})();