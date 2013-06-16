# coding: UTF-8
import cesk.types as types


class SContinuation(object):
	def depth(self):
		if self._depth > 0:
			return self._depth
		cur = self
		count = 1
		while cur.parent is not None:
			count += 1
			cur = cur.parent
		self._depth = count
		return self._depth

	def deeper_than(self, other_cont):
		return self.depth() > other_cont.depth()

	def __init__(self):
		self.forms = []
		self.parent = None
		self._depth = 0  # 0 represent not computed yet

	def has_more(self):
		if len(self.forms) > 0:
			return True
		elif self.parent is None:
			return False
		else:
			return self.parent.has_more()

	def clone(self):
		import copy

		cont = SContinuation()
		cont.forms = copy.copy(self.forms)
		if self.parent is None:
			cont.parent = None
		else:
			cont.parent = self.parent.clone()
		return cont

	def next_step(self):
		if len(self.forms) > 0:
			self.forms.pop(0)
			return self
		elif self.parent is None:
			return False
		else:
			return self.parent.next_step()

	def next(self):
		if self.has_more():
			if len(self.forms) > 0:
				return self.forms[0]
			else:
				return self.parent.next()
		else:
			return False

	def expand(self, forms):
		cont = SContinuation()
		cont.parent = self
		cont.forms = forms
		return cont

	@staticmethod
	def gen_continuation(forms):
		cont = SContinuation()
		cont.parent = None
		cont.forms = forms
		return cont


class SEnvItem(object):
	name = None
	value = None  # TODO: change to value to address in store

	def __init__(self, name, value):
		self.name = name
		self.value = value

	def get_value(self):
		return self.value  # TODO: change to get value in address from store


class SEnv(object):
	parent = None
	continuation = None

	def __init__(self):
		self.current = {}

	def get_all_macros(self):
		result = {}
		for k in self.current.keys():
			v = self.current[k]
			if isinstance(v, types.SMacro):
				result[k] = v
		if not self.parent:
			return result
		else:
			return result.update(self.parent.get_all_macros())

	def find_in_current(self, name):
		if name in self.current:
			# TODO: function override, if there are some versions with different params of same-name-function, return last
			# Important: don't change the lists, just replace them
			return self.current[name]
		else:
			return False

	def find(self, name):
		if name in self.current:
			return self.find_in_current(name)
		elif self.parent is not None:
			return self.parent.find(name)
		else:
			return False

	def bind(self, name, value):
		# TODO: if it's function override, put the same-name functions to a list/exist list, and append the new one to the last
		self.current[name] = value

	def bind_to_exist(self, name, value):
		"""
		if name is in env, use value to replace the position of the old value of name
		"""
		if self.find(name):
			if self.find_in_current(name):
				self.current[name] = value  # TODO: refer to the doc in self.find
			else:
				self.parent.bind_to_exist(name, value)
		else:
			return False

	def bind_to_root(self, name, value):
		if self.parent is None:
			self.bind(name, value)
		else:
			self.parent.bind_to_root(name, value)

	def has_more(self):
		return self.continuation.has_more()

	def next_step(self):
		if self.has_more():
			self.continuation.next_step()
			return self
		else:
			return False

	def down(self):
		env = SEnv()
		env.parent = self
		env.continuation = self.continuation
		env.current = {}
		self.continuation = None
		return env

	def up(self):
		env = self.parent
		env.continuation = self.continuation
		return env

	def next_form(self):
		if self.has_more():
			return self.continuation.next()
		else:
			return False

	def expand_continuation(self, forms):
		self.continuation = self.continuation.expand(forms)

	@staticmethod
	def make_empty_env(cont):
		env = SEnv()
		env.continuation = cont
		return env

	@staticmethod
	def make_root_env():
		env = SEnv.make_empty_env(SContinuation.gen_continuation([]))
		from cesk import core_definition

		for (name, value) in core_definition.native_fns.items():
			env.bind(name, value)
		return env

	def __repr__(self):
		str = repr(self.current)
		if self.parent is not None:
			return str + '\n' + repr(self.parent)
		else:
			return str


def run_cesk(env):
	def cesk_loop(env, last_val):
		if env.has_more():
			form = env.next_form()
			env.next_step()
			realize_result = form.realize(env)
			return cesk_loop(realize_result.env, realize_result.ret)
		else:
			return types.SResult(env, last_val)

	return cesk_loop(env, types.SNilObject.instance())


def run_exprlist(env, exprlist):
	return exprlist.realize(env)


def start_run_exprlist(exprlist):
	env = SEnv.make_root_env()
	result = exprlist.realize(env)
	return result


from util import parser


def startup(core_ss_filepath):
	f = open(core_ss_filepath)
	text = f.read()
	f.close()
	parsed_code = parser.run_yacc(text)
	result = start_run_exprlist(parsed_code)
	return result


def run_code_with_env(env, text):
	parsed_code = parser.run_yacc(text)
	expanded = parsed_code.expand_macro(env)
	print 'expanded:', expanded.ret
	env = expanded.env
	result = parsed_code.realize(env)
	return result


def expand_macros_from_text(env, text):
	parsed_code = parser.run_yacc(text)
	expanded_exprlist = expand_macros(env, parsed_code)
	return expanded_exprlist


def expand_macros(env, exprlist):
	"""
	TODO: expand all macros in exprlist using macros in env and exprlist
	"""
	expanded = exprlist.expand_macro(env)
	return expanded.ret