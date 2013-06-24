(function () {
	var context = this;
	// utilities
	var println = context.console.log;

	function exportToOut(name, value) {
		exports[name] = value;
	}

	exportToOut('println', println);

	// types
	function SResult(env, ret) {
		this.env = env;
		this.ret = ret;
	}
	function SObject() {
		this.value = null;
	}

	SObject.prototype.to_str = function () {
		return this.toString();
	};
	SObject.prototype.to_boolean = function() {
		return true;
	};
	SObject.prototype.realize = function(env) {
		return new SResult(env, this);
	};
	SObject.prototype.typename = 'object';
	function SBaseValue() {
	}
	SBaseValue.prototype = new SObject();
	function SNilObject() {
		this.value = null;
	}
	SNilObject._instance = null;
	SNilObject.instance = function() {
		if (SNilObject._instance === null) {
			SNilObject._instance = new SNilObject();
		}
		return SNilObject._instance;
	};
	SNilObject.toString = function() {
		return 'nil';
	};
	SNilObject.prototype = new SBaseValue();
	SNilObject.prototype.typename = 'nil';
	function SNumber() {

	}
})();