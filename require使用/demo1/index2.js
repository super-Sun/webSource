console.log(1);
var aa = 11;
require(['fun'], function (FUNC) {
    console.log(2);
    aa = 111
})
console.log(aa);