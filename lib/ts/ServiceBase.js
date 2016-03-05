'use strict';
var errTo = require('errto');
var Service;
(function (Service) {
    var ServiceBase = (function () {
        function ServiceBase() {
        }
        ServiceBase.prototype.validateParameters = function (parameters, callback) {
            var validationCalls = this.flattenValidationCalls(parameters);
            var validationCallsLength = validationCalls.length;
            if (validationCallsLength === 0)
                return callback();
            if (validationCallsLength === 1) {
                validationCalls[0].validator(validationCalls[0].fieldcontent, validationCalls[0].fieldname, errTo(callback, callback), validationCalls[0].message);
            }
            else {
                var process = this.processFlattenedValidationCalls;
                process(validationCalls, 0, validationCallsLength, process, errTo(callback, callback));
            }
        };
        ServiceBase.prototype.processFlattenedValidationCalls = function (validationCalls, processed, totalValidations, process, callback) {
            if (processed === totalValidations)
                return callback();
            var parameter;
            parameter = validationCalls[processed];
            parameter.validator(parameter.content, parameter.name, errTo(callback, function () {
                process(validationCalls, processed + 1, totalValidations, process, errTo(callback, callback));
            }), parameter.message);
        };
        ServiceBase.prototype.flattenValidationCalls = function (parameters) {
            var calls = [];
            var parameterslength = parameters.length;
            var validationslength;
            var i;
            var j;
            var parameter;
            var validation;
            for (i = 0; i < parameterslength; i = i + 1) {
                parameter = parameters[i];
                validationslength = parameter.validations.length;
                for (j = 0; j < validationslength; j = j + 1) {
                    validation = parameter.validations[j];
                    if (validation.v !== undefined) {
                        calls.push({ name: parameter.name, content: parameter.content, validator: validation.v, message: validation.m });
                    }
                    else {
                        calls.push({ name: parameter.name, content: parameter.content, validator: validation, message: undefined });
                    }
                }
            }
            return calls;
        };
        ServiceBase.prototype.checkNotNullOrEmpty = function (parametervalue, parametername, callback, invalidMessage) {
            if (parametervalue === undefined || parametervalue === null || parametervalue.trim().length === 0) {
                return callback(new Error('The argument ' + parametername + ' is a required argument'));
            }
            callback();
        };
        ServiceBase.prototype.checkEmailAddress = function (email, parametername, callback, invalidMessage) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (!re.test(email)) {
                return callback(new Error(invalidMessage));
            }
            callback();
        };
        return ServiceBase;
    })();
    Service.ServiceBase = ServiceBase;
})(Service = exports.Service || (exports.Service = {}));
//# sourceMappingURL=ServiceBase.js.map