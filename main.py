# coding: UTF-8

if __name__ == '__main__':
	import os
	import cesk.core as cesk
	project_dir = os.path.dirname(__file__)
	in_filepath = os.path.join(project_dir, 'test1.ss')
	f = open(in_filepath)
	text = f.read()
	f.close()
	core_ss_filepath = os.path.join(project_dir, 'core.ss')
	result = cesk.startup(core_ss_filepath)
	exprlist = cesk.expand_macros_from_text(result.env, text)
	# print 'expaned:', exprlist.to_str()
	expanded_filepath = os.path.join(project_dir, 'macro_expanded_code.tmp')
	f = open(expanded_filepath, 'w+')
	f.write(exprlist.to_str())
	f.close()
	print 'the macros has expanded in file %s. The program is going to run!\n============\n============\n' % expanded_filepath
	result = cesk.startup(core_ss_filepath)
	result = cesk.run_exprlist(result.env, exprlist)
