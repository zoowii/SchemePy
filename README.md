SchemePy
=====
A Scheme Compiler written in Python,
with features of func, macro, continuation, etc.
最终目标是借助scheme方言作为中间语言，将包含核心特性的PHP代码最终编译成java/javascript，甚至可以做到将PHP项目编译成java servlet并打包成war运行。
如果真的达到这个目标的话，也就可以改名叫miniPHP了，不过任重道远啊！

====
Requirements:
1. Python2.7
2. pip install ply
3. 代码需要时UTF-8格式，否则中午可能乱码

====
2013/6/10
项目开始后的第三天，已经花了几个小时了，目前实现了scheme代码的一些基本元素，可以解释执行了
目前包括的特性包括：scheme宏defmacr、有问题的call/cc、函数defn、lambda、define/set、数（包括正负的long、float型）、字符串、列表、quote、display、注释，还有一些内置函数
core.ss是作为实现的scheme的核心库的，在系统启动时加载，示例代码test.ss包含了一些已经实现的功能的demo，包括定义宏、定义函数、fibonacci数列等

continuation设计失误，开始想好了，结果因为实现时写着写着就忘了，导致现在才发现问题。没有将每一步的操作都放到continuation再执行，导致call/cc在参数中无法接受结果，也就是(cont ret)的ret无效
暂时先把这个问题抛下，在编译阶段改正

TODO：第4步和第7步可以作为两条支线分别执行
1. 将scheme代码进行宏展开成核心scheme元素构成的代码并确保可以解释执行展开后的代码，过程中的宏要保持下来，不要扔掉
2. 完善scheme的基础元素，主要包括列表、hash-map
3. scheme的函数重载功能，对应的Env的存储形式要略作修改
4. 将PHP代码语法解析成LISP形式
5. 对照PHP解析出的LISP形式编写scheme宏
6. 实现解释执行PHP解析出的LISP形式
7. 将核心scheme元素组成的scheme代码编译成Java代码/java字节码/JavaScript

