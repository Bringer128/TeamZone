'use strict';
var EmailVerifyService = (function () {
    function EmailVerifyService() {
        var _this = this;
        this.messageArray = [];
        this.send = function (toEmail, token, callback) {
            console.log('Send email simulation');
            _this.messageArray.push(toEmail);
            callback();
        };
        this.resetCount = function () {
            _this.messageArray = [];
        };
    }
    Object.defineProperty(EmailVerifyService.prototype, "messageCount", {
        get: function () {
            return this.messageArray.length;
        },
        enumerable: true,
        configurable: true
    });
    return EmailVerifyService;
})();
exports.EmailVerifyService = EmailVerifyService;
module.exports = EmailVerifyService;
//# sourceMappingURL=EmailVerifyService.js.map