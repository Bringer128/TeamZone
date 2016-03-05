'use strict';
var _ = require('underscore');
var logger = require("../../utils/logger");
var Mailgun = require('mailgun').Mailgun;
var MailGunAPIEmailVerifyService = (function () {
    function MailGunAPIEmailVerifyService(fromEmailAddress, baseUrl, mailGunApiKey, mailgun) {
        var _this = this;
        this.fromEmailAddress = fromEmailAddress;
        this.baseUrl = baseUrl;
        this.mailGunApiKey = mailGunApiKey;
        this.mailgun = mailgun;
        this.send = function (toEmail, token, callback) {
            var rawMailBody;
            _this.uri = _this.baseUrl + '?u=' + toEmail + '&t=' + encodeURIComponent(token);
            rawMailBody = 'Please use the following web address to validate your email.  Usually clicking on the link in your email program will take you to the validation web page.\r\n\r\n' + 'If that does not work try selecting the web address and copying and pasteing it into your favourite web browser.  We look forward to having you onboard.\r\n\r\n' + _this.uri;
            _this.mailgun.sendText(_this.fromEmailAddress, [toEmail], 'Please verify your email address to complete registration on TeamZone', rawMailBody, 'noreply@aboutagile.com', {}, function (err, result) {
                if (err)
                    callback(err);
                else
                    callback();
            });
        };
        if (!_.isEmpty(mailgun))
            this.mailgun = mailgun;
        else
            this.mailgun = new Mailgun(mailGunApiKey);
    }
    Object.defineProperty(MailGunAPIEmailVerifyService.prototype, "URI", {
        get: function () {
            return this.uri;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MailGunAPIEmailVerifyService.prototype, "mailGun", {
        get: function () {
            return this.mailgun;
        },
        enumerable: true,
        configurable: true
    });
    return MailGunAPIEmailVerifyService;
})();
exports.MailGunAPIEmailVerifyService = MailGunAPIEmailVerifyService;
module.exports = MailGunAPIEmailVerifyService;
//# sourceMappingURL=MailGunAPIEmailVerifyService.js.map