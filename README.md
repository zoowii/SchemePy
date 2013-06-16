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

continuation设计失误，开始想好了，结果因为实现时写着写着就忘了，导致现在才发现问题。没有将每一步的操作都放到continuation再执行，导致call/cc在参数中无法接受结果，也就是(cont ret)的ret无效。
但使用时如果使用一个全局变量存放返回值用来通信，一样可以达到目标，只不过没有scheme标准中的call/cc使用起来优美方便。
暂时先把这个问题抛下，在编译阶段改正

TODO：第4步和第7步可以作为两条支线分别执行
1. 将scheme代码进行宏展开成核心scheme元素构成的代码并确保可以解释执行展开后的代码，过程中的宏要保持下来，不要扔掉. DONE. at 2013/6/14
2. 完善scheme的基础元素，主要包括列表、hash-map. DONE. at 2013/6/14. 具有list, count(计算List大小), nth, hashmap, hashmap-get等内置函数和类型
3. scheme的函数重载功能，对应的Env的存储形式要略作修改
4. 将PHP代码语法解析成LISP形式
5. 对照PHP解析出的LISP形式编写scheme宏
6. 实现解释执行PHP解析出的LISP形式
7. 将核心scheme元素组成的scheme代码编译成Java代码/java字节码/JavaScript

====
2013/6/14
今天花了点时间把scheme代码做了宏展开功能。并且做到了宏展开后的代码执行结果与解释执行一致。
其实之前解释执行的阶段宏也是先展开然后再执行的，所以这一次只不过调用了下原来写的函数再做些修改就实现了这个功能。
demo中展开后的代码放在macro_expanded_code.tmp文件中。因为函数和宏的值是要再将来编译时转换成目标语言的，所以目前作为值的函数和宏保留，其他的宏求值都已经展开了。
另外，增加了几个内置函数。
下一步的主要目标是用对PHP代码进行语法解析，并创建各种PHP语法对应的scheme宏和PHP类型。PHP类型暂时用列表实现。或者在scheme中添加基本的对象系统，作为PHP类和对象的基础。