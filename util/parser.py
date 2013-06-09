# coding: UTF-8

tokens = (
'IDENTIFIER', 'STRING', 'BOOLEAN', 'LEFT_PARENTHESES', 'RIGHT_PARENTHESES', 'NUMBER', 'SPACE', 'QUOTE', 'NEWLINE',
'COMMENT'
)

t_LEFT_PARENTHESES = r'\('
t_RIGHT_PARENTHESES = r'\)'

import cesk.types as types


def t_STRING(t):
	r'\"[\w\W]*?\"'
	t.value = types.SString(t.value)
	return t


def t_BOOLEAN(t):
	r'(true)|(false)'
	if t.value == 'true':
		t.value = True
	else:
		t.value = False
	t.value = types.SBoolean(t.value)
	return t


def t_QUOTE(t):
	r'\''
	t.value = types.SIdentifier('quote')
	return t


def t_NUMBER(t):
	r'(-|\+)?\d+(\.\d+)?'
	try:
		if t.value.count('.') > 0:
			t.value = float(t.value)
		else:
			t.value = long(t.value)
	except ValueError:
		print "Too large number", t.value
		t.value = 0
	t.value = types.SNumber(t.value)
	return t


def t_COMMENT(t):
	r';[\w\W]*?\n'
	t.lexer.lineno += 1


def t_IDENTIFIER(t):
	r'([a-zA-Z_=+-?^/%]|\*)([\w=+-?^/%]|\*)*'
	t.value = types.SIdentifier(t.value)
	return t


def t_SPACE(t):
	r'[\t ]+'
	t.value = ' '
	return t


def t_NEWLINE(t):
	r'\n+'
	t.lexer.lineno += t.value.count('\n')


def t_error(t):
	print "Illegal character '%s'" % t.value[0]
	t.lexer.skip(1)


import ply.lex as lex


precedence = ()
identifiers = {}


def p_statement_single(p):
	"""expression : IDENTIFIER
				| NUMBER
				| STRING
				| BOOLEAN"""
	p[0] = p[1]


def p_statement_empty_expr1(p):
	"""expression : empty expression"""
	p[0] = p[2]


def p_statement_empty_expr2(p):
	"""expression : expression empty"""
	p[0] = p[1]


def p_statement_empty_exprlist1(p):
	"""expressionlist : expressionlist empty"""
	p[0] = p[1]


def p_statement_empty_exprlist2(p):
	"""expressionlist : empty expressionlist"""
	p[0] = p[2]


def p_statement_quote_expr(p):
	"""expression : QUOTE expression"""
	p[0] = types.SList()
	p[0].add(p[1])
	p[0].add(p[2])


def p_statement_form(p):
	"""expression : LEFT_PARENTHESES expressionlist RIGHT_PARENTHESES
					| LEFT_PARENTHESES expression RIGHT_PARENTHESES"""
	# """expression : LEFT_PARENTHESES expression RIGHT_PARENTHESES
	#                 | LEFT_PARENTHESES expression expression RIGHT_PARENTHESES
	#                 | LEFT_PARENTHESES expression expression expression RIGHT_PARENTHESES
	#                 | LEFT_PARENTHESES expression expression expression expression RIGHT_PARENTHESES
	#                 | LEFT_PARENTHESES expression expression expression expression expression RIGHT_PARENTHESES
	#                 | LEFT_PARENTHESES expression expression expression expression expression expression RIGHT_PARENTHESES
	#                 | LEFT_PARENTHESES expression expression expression expression expression expression expression RIGHT_PARENTHESES"""
	# p[0] = ['seq-expression']
	# for i in range(2, len(p) - 1):
	#     p[0].append(p[i])
	# p[0] = tuple(p[0])
	if isinstance(p[2], types.SExprList):
		p[0] = types.SList()
		for item in p[2]:
			p[0].add(item)
	else:
		p[0] = types.SList()
		p[0].add(p[2])


def p_statement_list(p):
	"""expressionlist : expression expressionlist
					| expression expression"""
	if isinstance(p[2], types.SExprList):
		p[0] = types.SExprList()
		p[0].add(p[1])
		for item in p[2]:
			p[0].add(item)
	else:
		p[0] = types.SExprList()
		p[0].add(p[1])
		p[0].add(p[2])


def p_statement_list_exp(p):
	"""expression : expressionlist"""
	p[0] = p[1]


def p_statement_empty(p):
	"""empty : SPACE
			| NEWLINE
			| COMMENT"""
	pass


def p_error(p):
	# print "Syntax error"
	pass

# print p.lineno, p.type
# print "Syntax error at '%s'" % p.value


import ply.yacc as yacc


def run_lex(text):
	lex.lex()
	lex.input(text)
	while True:
		token = lex.token()
		if not token: break
		print token


def run_yacc(text):
	lex.lex()
	yacc.yacc()
	result = yacc.parse(text)
	return result


if __name__ == '__main__':
	import os

	project_dir = os.path.dirname(os.path.dirname(__file__))
	f = open(os.path.join(project_dir, 'test1.ss'))
	text = f.read()
	f.close()
	# run_lex(text)
	result = run_yacc(text)
	print result