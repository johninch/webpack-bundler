
        (function(graph) {
            function require(module) {
                function localRequire(relativePath) {
                    // 其实是用相对路径找到真实的绝对路径，再require
                    return require(graph[module].dependencies[relativePath])
                }
                var exports = {}; // 注意：一定要加分号，因为后面跟着自执行函数

                (function(require, exports, code) {
                    eval(code)
                })(localRequire, exports, graph[module].code)

                return exports
            }
            require('./src/index.js')
        })({"./src/index.js":{"dependencies":{"./messsge.js":"./src/messsge.js"},"code":"\"use strict\";\n\nvar _messsge = _interopRequireDefault(require(\"./messsge.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nconsole.log(_messsge[\"default\"]);"},"./src/messsge.js":{"dependencies":{"./word.js":"./src/word.js"},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nvar _word = require(\"./word.js\");\n\nvar message = \"say \".concat(_word.word);\nvar _default = message;\nexports[\"default\"] = _default;"},"./src/word.js":{"dependencies":{},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.word = void 0;\nvar word = \"hello\";\nexports.word = word;"}})
    