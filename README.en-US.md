SchemePy  
=====  
A Scheme Compiler Written in Python,  
With Features Like `func`, `macro`, `continuation`, etc.  

The ultimate goal is to use Scheme as an intermediate language, compiling PHP code with core features into Java, JavaScript, or even packaging PHP projects as Java servlets into WAR files for deployment.  
If achieved, the project could be renamed to *miniPHP*. However, this is an ambitious endeavor!

====  
**Requirements:**  
1. Python 2.7  
2. `pip install ply`  
3. Code must be in UTF-8 encoding; otherwise, output may be garbled.  

====  
**2013/6/10**  
On the third day of the project, several hours were spent. Basic elements of Scheme code have now been implemented and can execute interpreted. Features include:  
- Scheme macros `defmacr`  
- (Problematic) `call/cc`  
- Functions `defn`  
- `lambda`, `define`/`set`  
- Numbers (including positive/negative long integers and floating-point numbers)  
- Strings (multiline strings, similar to Python’s `"""`)  
- Lists, `quote`, `display`, comments  
- Some built-in functions  

`core.ss` is the core library for the implemented Scheme. It loads automatically on system startup. `test.ss` contains demo examples for the implemented features: defining macros, defining functions, Fibonacci sequence, etc.  

**Continuation Design Mistake:**  
Initially, the design was correct, but during implementation, I forgot key details, leading to the realization that `call/cc` cannot accept results in its arguments—`(cont ret)`’s `ret` is ineffective.  
However, using a global variable to store return values for communication can still achieve the goal, albeit less elegantly than the standard `call/cc`.  
This issue will be addressed during the compilation phase.  

**TODO List:**  
1. Implement macro expansion for Scheme code, ensuring expanded code can be interpreted. Retain macros for future compilation. *DONE.* 2013/6/14  
2. Enhance basic Scheme elements: lists, hash-maps. *DONE.* 2013/6/14. Includes `list`, `count` (calculates list size), `nth`, `hashmap`, `hashmap-get`. *DONE.* 2013/6/24  
3. Implement function overloading in Scheme, requiring minor modifications to `Env` storage.  
4. Parse PHP syntax into LISP format.  
5. Design Scheme macros corresponding to PHP’s LISP structures.  
6. Implement interpretation of PHP’s LISP-format code generated via macros.  
7. Compile Scheme code (composed of core Scheme elements) into Java bytecode/JavaScript. *PARTIAL DONE.* 2013/6/24 (JS). Target: compile to JS  

====  
**2013/6/14**  
Achieved macro expansion for Scheme code. The expanded code’s interpretation matches the original.  
Previously, macro expansion occurred during interpretation, so this feature calls the original functions with minor modifications.  
Expanded code is saved to `macro_expanded_code.tmp` in the demo.  
Functions and macros are preserved as values for later compilation into target languages. Other macros have been fully expanded.  
Added several built-in functions.  
Next step: parse PHP syntax and create Scheme macros/functions for PHP constructs. PHP types are temporarily modeled as lists. Alternatively, an object system in Scheme could form the basis for PHP classes/objects.  

====  
**2013/6/24**  
To improve performance:  
- **Interpretation:** Retained continuation mechanism.  
- **Compilation:** Replaced continuation model with Turing machine simulation (PC counter represents continuation).  

**Target Platforms (Priority Order):**  
1. Golang (for ease of deployment)  
2. C/C++ (strings are immutable → may need C++)  
3. JavaScript  
4. Java  

**JS Compilation:**  
Converted macro-expanded Scheme code to self-interpreted JS, leveraging V8’s performance but missing compile-time optimizations.  
For high performance, continuations (tracking execution states) must be replaced by Turing machine simulation (PC counting) or removed entirely by compiling to imperative-style Go/C/C++.  

**Achieved:**  
- Compiled Scheme code into a standalone JS file, preserving all features (macros, continuations, `lambda`). Runs in Node.js and browsers, interoperable with JavaScript. Browser output adds an extra newline due to `console.log`.  

**Future Work:**  
- Compile to C/C++/Golang.  
- Implement PHP syntax parsing into LISP macros and execution.  
- Add compile-time optimizations (tail-call, inlining).  

**Macro Issues:**  
Possible bugs in macro functionality; some use cases are inconvenient.  

**Demo (`test1.ss`):**  
Features include functions, macros, JS interop, Node.js HTTP server creation.  

**Dependency:**  
JS runtime libraries compiled with TypeScript, embedded into the final output.  

**Running the Demo:**  
Run `rake` (Ruby’s Rake) in the project directory to compile and execute the code (`out/test1.ss.js`). Resulting in a web server on port 5000.
