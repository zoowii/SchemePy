# coding: UTF-8
import os

project_dir = os.environ.get('project_dir', os.path.dirname(os.path.dirname(__file__)))
compile_out_dir = os.path.join(project_dir, 'out')
compile_out_extension = 'js'
default_compile_out_filename = 'main'
