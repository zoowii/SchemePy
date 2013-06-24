; (core-define "a" 123)
; 222
;(display a)
;(display (cons "a" "b"))
;(display (str (symbol "abc")))
;"abc"
;(newline)
;(display (cons "a" (cons "b" "c")))

; (define log (macro (item) (realize (cons2 (symbol "do") (cons (quote (print "log: ")) (quote (println item)))))))

; (println log)
; (log "hi")
(defmacro log (item) (do (print "log: ") (println item)))
; (println log)
(log "hello-world")

(if (= (+ 1 1) (- 3 1 0)) (println "true") (println "false"))

(println (call/cc (lambda (ret) (ret "hello, call/cc!"))))
(display "abc" 234)
(newline)

(set l1 (list "a1" "b2" "c2"))
(do (print "list l1 is") (println l1))
(do (print "length of l1 is") (println (count l1)))
(do (print "the 3rd of l1 is") (println (nth l1 2)))

(println "fibonacci test:")

(defn hello (name) (do (print "Hello") (println name)))
(hello "World!")

(define fib (lambda (n)

                (if (< n 3)
                    1
                    (+ (fib (- n 1)) (fib (- n 2))))))

(do (print "fib 15 =") (println (fib 15)))

(define say-hi (lambda (msg name) (do (print msg) (println name))))

; (println say-hi)
;(println (core-expand-macro lambda '("msg" "name") (quote (do (print msg) (println name)))))
(say-hi "welcome" "zoowii")
(println (+ 1 2 3 4 5))
; (define b "helloworld")
; (print-locals)
; (display b)
; (newline)
; '(a b "jfiej" '(1 2))

(println "hashmap test")
(define m1 (hashmap (list "a" "b" "c") (list "hello" list 123)))
(println m1)
(do (print (hashmap-get m1 "a")) (print (hashmap-get m1 "c")) (println (hashmap-get m1 "d" "not found return value")))
(println "世界
你好")
; (defmacro println-js-obj (obj)
;     (do (display-js-obj obj) (newline)))
(define http (js-call-function context "getModule" (list "http")))  ; This only run on node.js, because it use http module
(display-js-obj http)(newline)
(js-call-function context "sayHi" (list))(newline)
(define plain-http-head (js-create-object))
(js-set-property plain-http-head "Content-Type" "text/html")
(defn create-http-server (handler)
    (do
    (core-set "server" (js-call-function http "createServer" (list (make-js-function handler))))
    server
    ))
(define http-handler
    (lambda (req res)
        (do
            (js-call-function res "writeHead" (list 200 plain-http-head))
            (js-call-function res "end" (list"Hello, World!<h1>SchemePy</h1><h3>Written by SchemePy(compiled to javascript and running on Node.)</h3><h3>Author: zoowii</h3><h3><a href='https://github.com/zoowii/SchemePy'>Github</a></h3>")))))
(display-js-obj (make-js-function http-handler))(newline)
(display-js-obj plain-http-head)(newline)
(define server (create-http-server http-handler))
(display-js-obj server)(newline)
(js-call-function server "listen" (list 5000 "127.0.0.1"))