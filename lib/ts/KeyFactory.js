'use strict';
var KeyFactory = (function () {
    function KeyFactory() {
    }
    KeyFactory.clubKeyMaker = function (clubname, cityname) {
        return "".concat(clubname, "~", cityname);
    };
    KeyFactory.squadKeyMaker = function (clubname, cityname, squadname, season) {
        return this.clubKeyMaker(clubname, cityname).concat('~', squadname, '~', season);
    };
    return KeyFactory;
})();
exports.KeyFactory = KeyFactory;
//# sourceMappingURL=KeyFactory.js.map