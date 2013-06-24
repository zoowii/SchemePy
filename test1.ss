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
(define http (js-call-function context "getModule" (list "http")))
(println http)
(js-call-function context "sayHi" (list))