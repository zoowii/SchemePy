# coding: UTF-8

if __name__ == '__main__':
	import os
	import cesk.core as cesk
	project_dir = os.path.dirname(__file__)
	os.environ['project_dir'] = project_dir
	in_filepath = os.path.join(project_dir, 'test1.ss')
	compiled_filepath = cesk.CeskMachine.total_compile_to_js_file(in_filepath)
	print "compiled to js done. The compiled js file is %s" % compiled_filepath
	# f = open(in_filepath)
	# text = f.read()
	# f.close()
	# core_ss_filepath = os.path.join(project_dir, 'core.ss')
	# f_core = open(core_ss_filepath)
	# core_text = f_core.read()
	# f_core.close()
	# result = cesk.CeskMachine.startup(core_ss_filepath)
	# exprlist = cesk.CeskMachine.expand_macros_from_text(result.env, text)
	# core_exprlist = cesk.CeskMachine.expand_macros_from_text(result.env, core_text)
	# cesk.CeskMachine.compile_to_js_file(result.env, [core_exprlist, exprlist], os.path.join(project_dir, 'out/out.js'))
	# print 'compile to js done'
	# print 'expaned:', exprlist.to_str()
	# expanded_filepath = os.path.join(project_dir, 'macro_expanded_code.tmp')
	# f = open(expanded_filepath, 'w+')
	# f.write(exprlist.to_str())
	# f.close()
	# print 'the macros has expanded in file %s. The program is going to run!\n============\n============\n' % expanded_filepath
	# result = cesk.CeskMachine.startup(core_ss_filepath)
	# result = cesk.run_exprlist(result.env, exprlist)
