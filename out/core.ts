var context = this;
context.sayHi = function () {
	print('hi');
};
context.getModule = function(module_name) {
	return require(module_name);
};
function print() {
	var stdout = process.stdout;
	var s = '';
	for (var i = 0; i < arguments.length; ++i) {
		var toWrite = 'undefined';
		if (arguments[i] !== undefined) {
			toWrite = arguments[i].toString();
		}
		s += toWrite;
	}
	stdout.write(s);
}
var println = print;
function error() {
	var stderr = process.stderr;
	var s = '';
	for (var i = 0; i < arguments.length; ++i) {
		var toWrite = 'undefined';
		if (arguments[i] !== undefined) {
			toWrite = arguments[i].toString();
		}
		s += toWrite;
	}
	stderr.write(s);
}

// utiliteis
function exportOut(name, value) {
	exports[name] = value;
}
function exit(num:number) {
	process.exit(num);
}
function clone(value) {
	// TODO: use underscore's _.clone
	if (value instanceof Array) {
		var result = [];
	} else {
		var result = {};
	}
	for (var i in value) {
		result[i] = value[i];
	}
	return result;
}

exportOut('println', println);

// types
class SResult {
	env:SEnv;
	ret:SObject;

	constructor(env, ret) {
		this.env = env;
		this.ret = ret;
	}

	setEnv(newEnv:SEnv) {
		this.env = newEnv;
	}

	setRet(newRet:SObject) {
		this.ret = newRet;
	}

	getEnv() {
		return this.env;
	}

	getRet() {
		return this.ret;
	}

	toString() {
		return JSON.stringify(this);
	}
}

var typenames = {
	Object: 'object',
	NilObject: 'nil',
	Number: 'number',
	Boolean: 'boolean',
	String: 'string',
	Identifier: 'symbol',
	List: 'list',
	ExprList: 'exprlist',
	Callable: 'callable',
	Macro: 'macro',
	Func: 'function',
	NativeFunc: 'native_function'
};


class SObject {
	value = null;
	typename = typenames.Object;

	to_str() {
		return this.toString();
	}

	to_boolean() {
		return true; // TODO
	}

	realize(env) {
		return new SResult(env, this);
	}

	getValue() {
		return this.value;
	}

	toNative() {
		return this.getValue();
	}

	toString() {
		return '<object>';
	}

	equal(other:SObject) {
		return this.typename === other.typename && this.getValue() === other.getValue();
	}

	static create(val) {
		var obj = new SObject();
		obj.value = val;
		return obj;
	}
}

class SBaseValue extends SObject {
}

class SNilObject extends SBaseValue {
	typename = typenames.NilObject;
	static _instance = null;

	static instance() {
		if (_instance === null) {
			_instance = new SNilObject();
		}
		return _instance;
	}

	toString() {
		return 'nil';
	}

	toNative() {
		return null;
	}

	static create(any) {
		return SNilObject.instance();
	}
}

class SNumber extends SBaseValue {
	typename = typenames.Number;

	constructor(num:number) {
		this.value = num;
	}

	toString() {
		return '' + this.value;
	}

	toNative() {
		return this.value;
	}

	static create(num:number) {
		return new SNumber(num);
	}
}

class SBoolean extends SBaseValue {
	typename = typenames.Boolean;

	constructor(val:bool) {
		this.value = val;
	}

	toString() {
		if (this.value) {
			return 'true';
		} else {
			return 'false';
		}
	}

	toNative() {
		return this.value;
	}

	static _true = new SBoolean(true);
	static _false = new SBoolean(false);

	static create(val:bool) {
		return val ? _true : _false;
	}
}

class SString extends SBaseValue {
	typename = typenames.String;

	constructor(val:string) {
		this.value = val;
	}

	toString() {
		return this.value;
	}

	to_str() {
		return '"' + this.value.replace('\n', '\\n').replace('\r', '\\r') + '"';
	}

	static create(val) {
		return new SString(val);
	}
}

class SIdentifier extends SObject {
	typename = typenames.Identifier;

	constructor(str:string) {
		this.value = str;
	}

	toString() {
		return this.value;
	}

	realize(env) {
		return new SResult(env, env.find(this.value));
	}

	static get_value(env, identifier) {
		return identifier.realize(env).ret
	}

	static create(str:string) {
		return new SIdentifier(str);
	}

}

class SList extends SObject {
	typename = typenames.List;
	items = [];

	static create() {
		var l = new SList();
		for (var i = 0; i < arguments.length; ++i) {
			l.add(arguments[i]);
		}
		return l;
	}

	to_str() {
		var s = '(';
		for (var i = 0; i < this.items.length; ++i) {
			var item = this.items[i];
			if (i > 0) {
				s += ' ';
			}
			s += item.to_str();
		}
		return s;
	}

	add(item:SObject) {
		this.items.push(item);
	}

	size() {
		return this.items.length;
	}

	get_item(index:number) {
		return this.items[index];
	}

	getValue() {
		return this.items;
	}

	toNative() {
		var result = this.items.forEach(function (item) {
			return item.toNative();
		});
		return result;
	}

	toString() {
		var s = '(';
		for (var i = 0; i < this.items.length; ++i) {
			var item = this.items[i];
			if (i > 0) {
				s += ' ';
			}
			s += item.toString();
		}
		return s;
	}

	realize(env) {
		if (this.size() === 0) {
			throw new Error("empty list can't be realized");
		}
		var first_symbol = this.get_item(0);
		if (first_symbol instanceof SIdentifier) {
			first_symbol = SIdentifier.get_value(env, first_symbol);
		}
		if (!first_symbol) {
			throw new Error("Can't find the symbol " + this.get_item(0) + " in env");
		}
		var tmp = first_symbol.realize(env);
		env = tmp.env;
		first_symbol = tmp.ret;
		if (!(first_symbol instanceof SCallable)) {
			error('not callable of list first item ', first_symbol);
			throw new Error(first_symbol + " is not callable");
			exit(1);
		}
		var proc = first_symbol;
		var params = [];
		for (var i = 1; i < this.size(); ++i) {
			params.push(this.get_item(i));
		}
		return SCallable.call_procedure(proc, env, params)
	}

	expand_macro(env) {
		// TODO
	}
}

class SExprList extends SObject {
	typename = typenames.ExprList;
	items = [];

	static create() {
		var l = new SExprList();
		for (var i = 0; i < arguments.length; ++i) {
			l.add(arguments[i]);
		}
		return l;
	}

	to_str() {
		var s = '';
		for (var i = 0; i < this.size(); ++i) {
			s += this.get_item(i).to_str();
			s += '\n';
		}
		return s;
	}

	size() {
		return this.items.length;
	}

	get_item(index:number) {
		return this.items[index];
	}

	add(item:SObject) {
		this.items.push(item)
	}

	getValue() {
		return this.items;
	}

	toNative() {
		return this.items.forEach(function (item) {
			return item.toNative();
		});
	}

	toString() {
		var s = '';
		for (var i = 0; i < this.size(); ++i) {
			if (i > 0) {
				s += ' ';
			}
			s += this.get_item(i).toString();
		}
		return s;
	}

	realize(env) {
		env.expand_continuation(this.items);
		var result = CeskMachine.runCesk(env);
		return result;
	}

	expand_macro(env) {
		// TODO
	}
}

class SCallable extends SObject {
	typename = typenames.Callable;

	constructor(public params, public body, public name = '') {
		this.params = params;
		this.body = body;
		this.name = name;
	}

	toString() {
		return JSON.stringify({
								  typename: this.typename,
								  name: this.name,
								  params: this.params,
								  body: this.body
							  });
	}

	match(param_values) {
		// TODO
	}

	do_apply(env, params) {
		return this.apply(env, params);
	}

	apply(env, params) {

	}

	after_apply(result) {
		return result;
	}

	getValue() {
		return [this.name, this.params, this.body]
	}

	static call_procedure(proc, env, params) {
		env = env.down();
		var result = proc.after_apply(proc.do_apply(env, params));
		env = env.up();
		result.env = env;
		return result;
	}
}

class SFunc extends SCallable {
	typename = typenames.Func;
	isReaderMacro = false;

	constructor(params, body, name = '', isReaderMacro = false) {
		super(params, body, name);
		this.isReaderMacro = isReaderMacro;
	}

	do_apply(env, params) {
		if (this.isReaderMacro) {
			return this.apply(env, params)
		}
		var param_values = [];
		var res = null;
		for (var i = 0; i < params.length; ++i) {
			res = params[i].realize(env);
			if (!res.ret) {
				throw new Error("Can't find the symbol " + params[i] + " in env");
			}
			param_values.push(res.ret);
			env = res.env;
		}
		return this.apply(env, param_values)
	}

	bind_params_to_env(env, params) {
		if (!(this.params instanceof Array)) {
			var l = new SList();
			l.items = clone(params);
			env.bind(this.params.toString(), l);
			return
		}
		var count = this.params.length;
		if (count != params.length) {
			println(this.params, params)
			throw new Error(count + " params needed, while " + params.length + " params given");
		}
		for (var i = 0; i < count; ++i) {
			var name = this.params[i];
			var value = params[i];
			env.bind(name.toString(), value)
		}
	}

	apply(env, params) {
		this.bind_params_to_env(env, params)
		return this.body.realize(env)
	}

	toString() {
		var s = "function " + this.name + "(" + this.params.toString() + ") {\n";
		if (this.body instanceof Function) {
			s += "<native_function>";
		} else {
			s += this.body.toString();
		}
		s += "\n}";
		return s;
	}

	to_str() {
		var s = "function " + this.name + "(" + this.params.to_str() + ") {\n";
		s += this.body.to_str();
		s += "\n}";
		return s;
	}

	static create(params, body, name = '') {
		return new SFunc(params, body, name);
	}
}

class SMacro extends SFunc {
	typename = typenames.Macro;

	static create(params, body, name = '') {
		var macro = new SMacro(params, body);
		return macro;
	}

	do_apply(env, params) {
		return this.apply(env, params);
	}

	expand(env, params) {
		return this.do_apply(env, params);
	}

	after_apply(result:SResult) {
		var env = result.env;
		var form = result.ret;
		env.expand_continuation([form]);
		return result;
	}

	expand_macro(env) {
		var result = this.body.expand_macro(env);
		this.body = result.ret;
		env = result.env;
		return new SResult(env, this)
	}

	static create(params, body, name = '') {
		return new SMacro(params, body, name);
	}
}

class SNativeFunc extends SFunc {
	typename = typenames.NativeFunc;

	apply(env, params) {
		var tmp_params = clone(params);
		tmp_params.reverse().push(env);
		tmp_params.reverse();
		var result = this.body.apply(undefined, tmp_params);
		return result;
	}

	to_str() {
		return this.name;
	}

	static create(params, body, name = '', isReaderMacro = false) {
		return new SNativeFunc(params, body, name, isReaderMacro);
	}
}

class SContinuation {
	forms = [];
	parent = null;
	_depth = 0;

	depth() {
		if (this._depth === 0) {
			var cur = this;
			var count = 1;
			while (cur.parent !== null) {
				++count;
				cur = cur.parent;
			}
			this._depth = count;
		}
		return this._depth
	}

	deeper_than(other_cont:SContinuation) {
		return this.depth() > other_cont.depth();
	}

	hasMore() {
		if (this.forms.length > 0) {
			return true;
		} else if (this.parent === null) {
			return false;
		} else {
			return this.parent.hasMore();
		}
	}

	clone() {
		var cont = new SContinuation();
		cont.forms = clone(this.forms);
		if (this.parent === null) {
			cont.parent = null;
		} else {
			cont.parent = this.parent.clone()
		}
		return cont;
	}

	next_step() {
		if (this.forms.length > 0) {
			this.forms.shift();
			return this;
		} else if (this.parent === null) {
			return false;
		} else {
			return this.parent.next_step();
		}
	}

	next() {
		if (this.hasMore()) {
			if (this.forms.length > 0) {
				return this.forms[0];
			} else {
				return this.parent.next();
			}
		} else {
			return false;
		}
	}

	expand(forms) {
		var cont = new SContinuation();
		cont.parent = this;
		cont.forms = forms;
		return cont;
	}

	static genContinuation(forms) {
		var cont = new SContinuation();
		cont.parent = null;
		cont.forms = forms;
		return cont;
	}
}

class SEnv {
	parent = null;
	continuation = null;
	current = {};

	getAllMacros() {
		// TODO
	}

	find_in_current(name) {
		if (this.current[name] !== undefined) {
			return this.current[name];
		} else {
			return false;
		}
	}

	find(name) {
		if (this.current[name] !== undefined) {
			return this.find_in_current(name);
		} else if (this.parent !== null) {
			return this.parent.find(name);
		} else {
			return false;
		}
	}

	bind(name, value) {
		this.current[name] = value;
	}

	bindToExist(name, value) {
		if (this.find(name)) {
			if (this.find_in_current(name)) {
				return this.bind(name, value);
			} else {
				return this.parent.bindToExist(name, value);
			}
		} else {
			return false;
		}
	}

	bindToRoot(name, value) {
		if (this.parent === null) {
			this.bind(name, value);
		} else {
			this.parent.bindToRoot(name, value);
		}
	}

	hasMore() {
		return this.continuation.hasMore();
	}

	nextStep() {
		if (this.hasMore()) {
			this.continuation.next_step();
			return this;
		} else {
			return false;
		}
	}

	down() {
		var env = new SEnv();
		env.parent = this;
		env.continuation = this.continuation;
		this.continuation = null;
		return env;
	}

	up() {
		var env = this.parent;
		env.continuation = this.continuation;
		this.continuation = null;
		return env;
	}

	nextForm() {
		if (this.hasMore()) {
			return this.continuation.next();
		} else {
			return false;
		}
	}

	expand_continuation(forms) {
		this.continuation = this.continuation.expand(forms)
	}

	static makeEmptyEnv(cont) {
		var env = new SEnv();
		env.continuation = cont;
		return env;
	}

	static makeRootEnv() {
		var env = SEnv.makeEmptyEnv(SContinuation.genContinuation([]));
		for (var name in coreDefinitions.nativeFns) {
			env.bind(name, coreDefinitions.nativeFns[name])
		}
		return env;
	}

	toString() {
		var s = this.current.toString();
		if (this.parent !== null) {
			return s + '\n' + this.parent.toString();
		} else {
			return s;
		}
	}
}

class CeskMachine {
	static runCesk(env:SEnv) {
		var ceskLoop = function (env:SEnv, last_val:SObject) {
			if (env.hasMore()) {
				var form = env.nextForm();
				env.nextStep();
				var realize_result = form.realize(env);
				return ceskLoop(realize_result.env, realize_result.ret);
			} else {
				return new SResult(env, last_val);
			}
		};
		return ceskLoop(env, SNilObject.instance());
	}

	static runExprList(env, exprlist:SExprList) {
		return exprlist.realize(env);
	}

	static startRunExprList(exprlist:SExprList) {
		var env = SEnv.makeRootEnv();
		return exprlist.realize(env);
	}
}
function s_display() {
	var env = arguments[0];
	var s = '';
	for (var i = 1; i < arguments.length; ++i) {
		if (i > 1) {
			s += ' ';
		}
		s += arguments[i].toString();
	}
	println(s);
	return new SResult(env, SNilObject.instance());
}
function s_core_define(env, name, value) {
	env.bindToRoot(name.toString(), value);
	return new SResult(env, value);
}
function s_core_set(env, name, value) {
	if (env.parent !== null) {
		env.parent.bind(name.toString(), value);
	} else {
		env.bind(name.toString(), value);
	}
	return new SResult(env, value);
}
function s_core_expand_macro(env, macro, params) {
	return macro.expand(env, params.items);
}
function s_core_number_add() {
	var sum = 0;
	var env = arguments[0];
	for (var i = 1; i < arguments.length; ++i) {
		sum += arguments[i].getValue();
	}
	var s_num = SNumber.create(sum);
	return new SResult(env, s_num);
}
function s_core_string_add() {
	var s = '';
	var env = arguments[0];
	for (var i = 1; i < arguments.length; ++i) {
		s += arguments[i].toString();
	}
	var s_s = SString.create(s);
	return new SResult(env, s_s);
}
function s_core_id(env, value) {
	return new SResult(env, value);
}
function genContinuationFunc(cont) {
	function func(env, ret) {
		env.continuation = cont;
		env.expand_continuation([ret]);
		return CeskMachine.runCesk(env);
	}

	return new SNativeFunc(['ret'], func);
}
var coreDefinitions = {
	nativeFns: {
		"display": new SNativeFunc(["*values"], s_display, 'display'),
		'core-define': new SNativeFunc(['name', 'value'], s_core_define, 'core-define'),
		'core-set': new SNativeFunc(['name', 'value'], s_core_set, 'core-set'),
		"nil": SNilObject.instance(),
		'type': new SNativeFunc(['value'], function (env, value) {
			return new SResult(env, new SString(value.typename));
		}, 'type'),
		'and': new SNativeFunc(['*items'], function () {
			var env = arguments[0];
			var res = new SBoolean(true);
			for (var i = 1; i < arguments.length; ++i) {
				var item = arguments[i];
				if (!item.to_boolean()) {
					return new SResult(env, new SBoolean(false));
				} else {
					res = item;
				}
			}
			return new SResult(env, res);
		}, 'and'),
		'or': new SNativeFunc(['*items'], function () {
			var env = arguments[0];
			for (var i = 1; i < arguments.length; ++i) {
				var item = arguments[i];
				if (item.to_boolean()) {
					return new SResult(env, item);
				}
			}
			return new SResult(env, new SBoolean(false));
		}, 'or'),
		'cons': new SNativeFunc(['head', 'tail'], function (env, head, tail) {
			var seq = new SList();
			seq.add(head);
			seq.add(tail);
			return new SResult(env, seq);
		}, 'cons'),
		'list': new SNativeFunc(['*items'], function () {
			var env = arguments[0];
			var seq = new SList();
			for (var i = 1; i < arguments.length; ++i) {
				seq.add(arguments[i]);
			}
			return new SResult(env, seq);
		}, 'list'),
		'count': new SNativeFunc(['seq'], function (env, seq) {
			return new SResult(env, new SNumber(seq.size()));
		}, 'count'),
		'nth': new SNativeFunc(['seq', 'n'], function (env, seq, n) {
			if (seq.size() < n.getValue()) {
				throw new Error(seq.toString() + " has only " + seq.size() + " items, index " + n.toString() + " out of range");
			}
			return new SResult(env, seq.get_item(n.value));
		}, 'nth'),
		'cons2': new SNativeFunc(['*items'], function () {
			var env = arguments[0];
			var seq = new SList();
			var params = clone(arguments);
			params.shift();
			var list = params[params.length - 1];
			var items = params.pop();
			items.reverse();
			seq.items = clone(list.items);
			items.forEach(function (item) {
				seq.items.unshift(item);
			});
			return new SResult(env, seq);
		}, 'cons2'),
		'true': SBoolean.create(true),
		'false': SBoolean.create(false),
		'core-expand-macro': new SNativeFunc(['macro', 'params'], s_core_expand_macro, 'core-expand-macro'),
		'+': new SNativeFunc(['*items'], function () {
			var is_number_add = true;
			for (var i = 1; i < arguments.length; ++i) {
				if (!(arguments[i] instanceof SNumber)) {
					is_number_add = false;
					break;
				}
			}
			if (is_number_add) {
				return s_core_number_add.apply(undefined, arguments);
			} else {
				return s_core_string_add.apply(undefined, arguments);
			}
		}, '+'),
		'-': new SNativeFunc(['*items'], function () {
			var env = arguments[0];
			var result = 0;
			if (arguments.length > 1) {
				result = arguments[1].getValue();
				for (var i = 2; i < arguments.length; ++i) {
					result -= arguments[i].getValue();
				}
			}
			return new SResult(env, SNumber.create(result));
		}, '-'),
		'=': new SNativeFunc(['*items'], function () {
			var env = arguments[0];
			var count = arguments.length - 1;
			var result = true;
			if (count > 1) {
				for (var i = 1; i < arguments.length - 1; ++i) {
					if (!arguments[i].equal(arguments[i + 1])) {
						result = false;
						break;
					}
				}
			}
			return new SResult(env, SBoolean.create(result));
		}, '='),
		'str': new SNativeFunc(['name'], function (env, name) {
			return new SResult(env, SString.create(name.to_str()));
		}, 'str'),
		'symbol': new SNativeFunc(['name'], function (env, name) {
			return new SResult(env, SIdentifier.create(name.to_str()));
		}, 'symbol'),
		'id': new SNativeFunc(['value'], s_core_id, 'id'),
		'quote': new SNativeFunc(['value'], s_core_id, 'quote', true),
		'print-locals': new SNativeFunc([], function (env) {
			print(env.parent.current);
			return new SResult(env, SNilObject.instance());
		}, 'print-locals'),
		'newline': new SNativeFunc([], function (env) {
			print("\n");
			return new SResult(env, SNilObject.instance());
		}, 'newline'),
		'core-macro': new SNativeFunc(['params', 'body'], function (env, params, body) {
			var param_items = params;
			if (params instanceof SList) {
				param_items = params.items;
			}
			return new SResult(env, new SMacro(param_items, body));
		}, 'core-macro', true),
		'core-lambda': new SNativeFunc(['params', 'body'], function (env, params, body) {
			var param_items = params;
			if (params instanceof SList) {
				param_items = params.items;
			}
			return new SResult(env, new SFunc(param_items, body));
		}, 'core-lambda'),
		'do': new SNativeFunc(['*items'], function (env) {
			var final_ret = SNilObject.instance();
			for (var i = 1; i < arguments.length; ++i) {
				var result = arguments[i].realize(env);
				env = result.env;
				final_ret = result.ret;
			}
			return new SResult(env, final_ret);
		}, 'do', true),
		'retrieve': new SNativeFunc(['symbol'], function (env, symbol) {
			return new SResult(env, env.find(symbol.to_str()));
		}, 'retrieve'),
		'sym->str': new SNativeFunc(['value'], function (env, value) {
			return new SResult(env, SString.create(value.to_str()));
		}, 'sym->str', true),
		'call/cc': new SNativeFunc(['proc'], function (env, proc) {
			var cont = env.continuation.clone();
			var ret_handler = genContinuationFunc(cont);
			var l = SList.create(proc, ret_handler);
			return l.realize(env);
		}, 'call/cc'),
		'map': new SNativeFunc(['fn', 'items'], function (env:SEnv, fn:SCallable, items:SList) {
			var l = new SList();
			for (var i = 0; i < items.size(); ++i) {
				var result = SCallable.call_procedure(fn, env, [items.get_item(i)]);
				env = result.env;
				l.add(result.ret);
			}
			return new SResult(env, l);
		}, 'map'),
		'exit': new SNativeFunc(['num'], function (env, num) {
			exit(num.getValue());
		}, 'exit'),
		'if': new SNativeFunc(['pred', '*items'], function (env, pred) {
			var arguements_size = arguments.length;
			if (arguements_size === 2 || arguements_size > 4) {
				throw new Error("if statement only accept 2 or 3 params");
			}
			var pred_result = pred.realize(env);
			env = pred_result.env;
			if (pred_result.ret.to_boolean()) {
				var body = arguments[2];
				return body.realize(env);
			} else {
				if (arguements_size === 3) {
					return new SResult(env, SNilObject.instance());
				} else {
					var body = arguments[3];
					return body.realize(env);
				}
			}
		}, 'if', true),
		'print-env': new SNativeFunc([], function (env) {
			println(env.parent.toString());
			return new SResult(env, SNilObject.instance());
		}, 'print-env'),
		'realize': new SNativeFunc(['value'], function (env, value) {
			return value.realize(env);
		}, 'realize'),
		'<': new SNativeFunc(['*items'], function (env) {
			var count = arguments.length - 1;
			if (count <= 1) {
				return SBoolean.create(true);
			} else {
				for (var i = 1; i < count; ++i) {
					if (arguments[i].getValue() >= arguments[i + 1].getValue()) {
						return new SResult(env, SBoolean.create(false));
					}
				}
				return new SResult(env, SBoolean.create(true));
			}
		}, '<'),
		'hashmap': new SNativeFunc(['key_list', 'value_list'], function (env, key_list, value_list) {
			return new SResult(env, SList.create(key_list, value_list));
		}, 'hashmap'),
		'hashmap-get': new SNativeFunc(['hashmap', "*key_ret_val"], function (env, hashmap) {
			var arguments_size = arguments.length;
			var ret_val = SNilObject.instance();
			if (arguments_size < 3) {
				throw new Error("hashmap-get needs key as a second parameter, optional not-found-ret-value if not found the key");
			}
			var key = arguments[2];
			if (arguments_size >= 3) {
				ret_val = arguments[3];
			}
			if (hashmap.size() < 2) {
				throw new Error("the first parameter is not a hashmap");
			}
			var key_list = hashmap.get_item(0);
			var value_list = hashmap.get_item(1);
			var values_count = value_list.size();
			for (var i = 0; i < key_list.size(); ++i) {
				var k = key_list.get_item(i);
				if (values_count <= i) {
					return new SResult(env, ret_val);
				}
				if (k.equal(key)) {
					return new SResult(env, value_list.get_item(i));
				}
			}
			return new SResult(env, ret_val);
		}, 'hashmap-get'),
		"context": SObject.create(context),
		"js-get-property": new SNativeFunc(['js_obj', 'property_name'], function(env, js_obj, property_name) {
			var property = js_obj.getValue()[property_name];
			if(property === undefined || property === null) {
				return SNilObject.instance();
			} else {
				return SObject.create(property);
			}
		}, 'js-get-property'),
		"js-call-function": new SNativeFunc(['js_obj', 'js_function_name', 'params'], function (env, js_obj, js_function_name, params) {
			var js_obj = js_obj.getValue();
			var func = js_obj[js_function_name];
			var param_values = [];
			for (var i = 0; i < params.size(); ++i) {
				var param = params.get_item(i);
				param_values.push(param.toNative());
			}
			var result = func.apply(js_obj, param_values);
			if(result === undefined || result === null) {
				result = SNilObject.instance();
			} else {
				result = SObject.create(result);
			}
			return new SResult(env, result);
		}, 'js-call-function')
	}
};

exportOut('CeskMachine', CeskMachine);
exportOut('SExprList', SExprList);
exportOut('SList', SList);
exportOut('SIdentifier', SIdentifier);
exportOut('SString', SString);
exportOut('SNumber', SNumber);
exportOut('SBoolean', SBoolean);
exportOut('SObject', SObject);
exportOut('SNilObject', SNilObject);
exportOut('SFunc', SFunc);
exportOut('SMacro', SMacro);
exportOut('SNativeFunc', SNativeFunc);