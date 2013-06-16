# coding: UTF-8
import cesk.types as types


def s_core_define(env, name, value):
	"""
	bind to root env
	name: string
	value: SObject
	"""
	env.bind_to_root(str(name), value)
	return types.SResult(env, value)


def s_core_set(env, name, value):
	"""
	bind to the parent env of current env
	name: string
	value: SObject
	"""
	if env.parent is not None:
		env.parent.bind(str(name), value)
	else:
		env.bind(str(name), value)
	return types.SResult(env, value)


def s_core_set_parent(env, name, value):
	if env.parent and env.parent.parent:
		env.parent.parent.bind(str(name), value)
	elif env.parent:
		env.parent.bind(str(name), value)
	else:
		env.bind(str(name), value)
	return types.SResult(env, value)


def s_core_expand_macro(env, macro, params):
	return macro.expand(env, list(params))


def s_core_type(env, value):
	return types.SResult(env, types.SString.value_of(value.typename))


def s_display(env, *values):
	for value in values:
		print value,
	return types.SResult(env, types.SNilObject.instance())


def s_core_and(env, *items):
	res = types.SBoolean(True)
	for item in items:
		if not item.to_boolean():
			return types.SResult(env, types.SBoolean(False))
		else:
			res = item
	return types.SResult(env, res)


def s_core_or(env, *items):
	for item in items:
		if item.to_boolean():
			return types.SResult(env, item)
	return types.SResult(env, types.SBoolean(False))


def s_cons(env, head, tail):
	seq = types.SList()
	seq.add(head)
	seq.add(tail)
	return types.SResult(env, seq)


def s_list(env, *items):
	seq = types.SList()
	for item in items:
		seq.add(item)
	return types.SResult(env, seq)


def s_list_len(env, seq):
	return types.SResult(env, types.SNumber(len(seq)))


def s_list_nth(env, seq, n):
	if len(seq) < n.value:
		raise Exception("%s has only %d items, index %d out of range" % (seq, len(seq), n.value))
	item = seq[n.value]
	return types.SResult(env, item)


def s_cons2(env, *items):
	seq = types.SList()
	import copy
	list = items[-1]
	items = items[:-1]
	seq.items = copy.copy(list.items)
	for i in range(len(items)):
		item = items[i]
		seq.items.insert(i, item)
	return types.SResult(env, seq)


def s_number_add(env, *items):
	sum = 0
	for item in items:
		sum += item.value
	s_sum = types.SNumber(sum)
	return types.SResult(env, s_sum)


def s_string_add(env, *items):
	str = ''
	for item in items:
		str += repr(item)
	s_str = types.SString.value_of(str)
	return types.SResult(env, s_str)


def s_add(env, *items):
	if all(map(lambda item : isinstance(item, types.SNumber), items)):
		return s_number_add(env, *items)
	else:
		return s_string_add(env, *items)


def s_minus(env, *items):
	if len(items) == 0:
		return types.SResult(env, types.SNumber(0))
	s = items[0].value
	for item in items[1:]:
		s -= item.value
	return types.SResult(env, types.SNumber(s))


def s_equal(env, *items):
	count = len(items)
	if count == 0 or count == 1:
		return types.SResult(env, types.SBoolean(True))
	for i in range(count - 1):
		if not items[i].equal(items[i+1]):
			return types.SResult(env, types.SBoolean(False))
	return types.SResult(env, types.SBoolean(True))


def s_core_str(env, name):
	s = types.SString.value_of(name.to_str())
	return types.SResult(env, s)


def s_core_symbol(env, name):
	sym = types.SIdentifier(str(name))
	return types.SResult(env, sym)


def s_core_id(env, value):
	"""
	return value itself
	"""
	return types.SResult(env, value)


def s_core_print_locals(env):
	"""
	print the current name=>value map in env
	"""
	print env.parent.current
	return types.SResult(env, types.SNilObject.instance())


def s_newline(env):
	print "\n",
	return types.SResult(env, types.SNilObject.instance())


def s_core_macro(env, params, body):
	param_items = params
	if isinstance(params, types.SList):
		param_items = params.items
	macro = types.SMacro(param_items, body)
	return types.SResult(env, macro)


def s_core_lambda(env, params, body):
	param_items = params
	if isinstance(params, types.SList):
		param_items = params.items
	fn = types.SFunc(param_items, body)
	return types.SResult(env, fn)


def s_core_do(env, *items):
	final_ret = types.SNilObject.instance()
	for item in items:
		result = item.realize(env)
		env = result.env
		ret = result.ret
		final_ret = ret
	return types.SResult(env, final_ret)


def s_core_retrieve(env, sym):
	val = env.find(sym.to_str())
	return types.SResult(env, val)


def s_core_str_sym(env, value):
	s = types.SString.value_of(value.str)
	return types.SResult(env, s)


def gen_continuation_func(cont):
	def func(env, ret):
		env.continuation = cont
		env.expand_continuation([ret])
		from cesk import core as core_cesk

		return core_cesk.run_cesk(env)

	return types.SNativeFunc(['ret'], func)


def s_core_call_cc(env, proc):
	cont = env.continuation.clone()
	ret_handler = gen_continuation_func(cont)
	l = types.SList()
	l.add(proc)
	l.add(ret_handler)
	return l.realize(env)


def s_core_map(env, fn, items):
	l = types.SList()
	for item in items:
		result = types.SCallable.call_procedure(fn, env, [item])
		env = result.env
		l.add(result.ret)
	return types.SResult(env, l)


def s_core_exit(env, number):
	exit(int(number.value))


def s_core_if(env, pred, *items):
	if len(items) == 0 or len(items) > 2:
		raise Exception("if statement only accept 2 or 3 params")
	pred_result = pred.realize(env)
	env = pred_result.env
	if pred_result.ret.to_boolean():
		body = items[0]
		return body.realize(env)
	else:
		if len(items) == 1:
			return types.SResult(env, types.SNilObject.instance())
		else:
			body = items[1]
			return body.realize(env)


def s_print_env(env):
	print env.parent
	return types.SResult(env, types.SNilObject.instance())


def s_core_realize(env, value):
	return value.realize(env)


def s_core_down_env(env):
	env = env.down()
	return types.SResult(env, types.SNilObject.instance())


def s_core_up_env(env):
	env = env.up()
	return types.SResult(env, types.SNilObject.instance())


def s_core_less(env, *items):
	count = len(items)
	if count <= 1:
		return types.SResult(env, types.SBoolean(True))
	else:
		for i in range(count - 1):
			if items[i].value >= items[i+1].value:
				return types.SResult(env, types.SBoolean(False))
		return types.SResult(env, types.SBoolean(True))


def s_core_hashmap_from_list(env, key_list, value_list):
	"""
	scheme 的hashmap暂时用list(key_list, value_list)的形式表示。
	将来打算再写一个SHashMap的类做这个功能
	"""
	l = [key_list, value_list]
	return types.SResult(env, l)


def s_core_hashmap_get(env, hashmap, *key_ret_val):
	"""
	if *key is more than 1, than first is key, second is the return value if not found
	"""
	k_len = len(key_ret_val)
	if k_len < 1:
		raise Exception('hashmap get needs key as second parameter, optional not found return value as third parameter')
	elif k_len == 1:
		key = key_ret_val[0]
		ret_value = types.SNilObject.instance()
	else:
		key = key_ret_val[0]
		ret_value = key_ret_val[1]
	if len(hashmap) < 2:
		raise Exception('The first parameter is not a hash map')
	values_count = len(hashmap[1])
	for i in range(len(hashmap[0])):
		k = hashmap[0][i]
		if values_count <= i:
			return types.SResult(env, ret_value)
		if k.equal(key):
			return types.SResult(env, hashmap[1][i])
	return types.SResult(env, ret_value)

quote_reader_macro = types.SNativeFunc(['value'], s_core_id, 'quote')
quote_reader_macro.is_reader_macro = True

do_reader_macro = types.SNativeFunc(['*items'], s_core_do, 'do')
do_reader_macro.is_reader_macro = True

core_macro = types.SNativeFunc(['params', 'body'], s_core_macro, 'core-macro')
core_macro.is_reader_macro = True

sym_str_reader = types.SNativeFunc(['value'], s_core_str_sym, 'sym->str')
sym_str_reader.is_reader_macro = True

core_lambda = types.SNativeFunc(['params', 'body'], s_core_lambda, 'core-lambda')
# core_lambda.is_reader_macro = True

str_reader_macro = types.SNativeFunc(['name'], s_core_str, 'str')
# str_reader_macro.is_reader_macro = True

if_reader = types.SNativeFunc(['pred', '*bodys'], s_core_if, 'if')
if_reader.is_reader_macro = True

native_fns = {
"core-define": types.SNativeFunc(['name', 'value'], s_core_define, 'core-define'),
"core-set": types.SNativeFunc(['name', 'value'], s_core_set, 'core-set'),
"core-set-parent": types.SNativeFunc(['name', 'value'], s_core_set_parent, 'core-set-parent'),
"type": types.SNativeFunc(['value'], s_core_type, 'type'),
"display": types.SNativeFunc(['*values'], s_display, 'display'),
"core-macro": core_macro,
"core-lambda": core_lambda,
"core-expand-macro": types.SNativeFunc(['*params'], s_core_expand_macro, 'core-expand-macro'),
"cons": types.SNativeFunc(['head', 'tail'], s_cons, 'cons'),
"cons2": types.SNativeFunc(['item', 'list'], s_cons2, 'cons2'),
"list": types.SNativeFunc(['*items'], s_list, 'list'),
"count": types.SNativeFunc(['seq'], s_list_len, 'count'),
"hashmap": types.SNativeFunc(['key_list', 'value_list'], s_core_hashmap_from_list, 'hashmap'),
"hashmap-get": types.SNativeFunc(['hashmap', 'key', 'optional-ret-value'], s_core_hashmap_get, 'hashmap-get'),
"nth": types.SNativeFunc(['seq', 'index'], s_list_nth, 'nth'),
"+": types.SNativeFunc(['*items'], s_add, '+'),
"-": types.SNativeFunc(['*items'], s_minus, '-'),
"=": types.SNativeFunc(['*items'], s_equal, '='),
"<": types.SNativeFunc(['*items'], s_core_less, '<'),
"do": do_reader_macro,
"str": str_reader_macro,
"sym->str": sym_str_reader,
"symbol": types.SNativeFunc(['name'], s_core_symbol, 'symbol'),
"quote": quote_reader_macro,
"id": types.SNativeFunc(['value'], s_core_id, 'id'),
"retrieve": types.SNativeFunc(['value'], s_core_retrieve, 'retrieve'),
"print-locals": types.SNativeFunc([], s_core_print_locals, 'print-locals'),
"print-env": types.SNativeFunc([], s_print_env, 'print-env'),
"newline": types.SNativeFunc([], s_newline, 'newline'),
"map": types.SNativeFunc(['fn', 'items'], s_core_map, 'map'),
"exit": types.SNativeFunc(['number'], s_core_exit, 'exit'),
"realize": types.SNativeFunc(['value'], s_core_realize, 'realize'),
"if": if_reader,
"call/cc": types.SNativeFunc(['ret'], s_core_call_cc, 'call/cc'),
"and": types.SNativeFunc(['*items'], s_core_and, 'and'),
"or": types.SNativeFunc(['*items'], s_core_or, 'or'),
"down-env": types.SNativeFunc([], s_core_down_env, 'down-env'),  # when call down-env or up-env in scheme code, error happens
"up-env": types.SNativeFunc([], s_core_up_env, 'up-env')
}