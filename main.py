# coding: UTF-8

if __name__ == '__main__':
	import os
	import cesk.core as cesk
	project_dir = os.path.dirname(__file__)
	in_filepath = os.path.join(project_dir, 'test1.ss')
	f = open(in_filepath)
	text = f.read()
	f.close()
	result = cesk.startup(os.path.join(project_dir, 'core.ss'))
	result = cesk.run_code_with_env(result.env, text)
