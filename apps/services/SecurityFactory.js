angular
	.module('app')
	.factory('SecurityFactory', [function () {
		var security = {};
		var setSecurity = function (policy, signature) {
			return security = {
				policy: policy,
				signature: signature
			};
		}

		var getSecurity = function () {
			return security;
		}
		return {
			setSecurity: setSecurity,
			getSecurity: getSecurity
		}
	}
]);