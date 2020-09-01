const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { transformFromAst } = require('@babel/core');

const moduleAnalyser = (filename) => {
    // 读取入口文件的内容
    const content = fs.readFileSync(filename, "utf-8")
    //! 分析内容，得到AST
    const ast = parser.parse(content, {
        sourceType: "module"
    })
    const dependencies = {}
    traverse(ast, {
        ImportDeclaration({ node }) {
            const dirname = path.dirname(filename)
            const newPath = './' + path.join(dirname, node.source.value)

            dependencies[node.source.value] = newPath
        }
    })
    // console.log(dependencies) // { './a.js': './src/a.js' }

    const { code } = transformFromAst(ast, null, {
        presets: ["@babel/preset-env"]
    })

    return {
        filename, // 入口文件
        code, // 浏览器可以运行的代码
        dependencies // 依赖路径表
    }
}

const makeDependenciesGraph = (entry) => {
    const entryModule = moduleAnalyser(entry)
    const graphArr = [entryModule]

    // 以循环的方式，实现递归的效果
    for(let i = 0; i < graphArr.length; i++) {
        const item = graphArr[i]
        const { dependencies } = item

        if (dependencies) {
            for(let j in dependencies) {
                graphArr.push(
                    moduleAnalyser(dependencies[j])
                )
            }
        }
    }

    // 数组结构转换为对象
    const graph = {}
    graphArr.forEach(item => {
        graph[item.filename] = {
            dependencies: item.dependencies,
            code: item.code
        }
    })

    return graph
}

const generate = (entry) => {
    const graph = makeDependenciesGraph(entry)
    const graphStr = JSON.stringify(graph) // 将转换后的代码转为字符串，传入webpack启动函数中

    // 在依赖图谱中，有require函数，有exports对象，但这些在浏览器中并不存在
    // 因此，其实其并不能直接在浏览器中执行，所以需要构造require函数，创建exports对象

    // 生成一个要在浏览器中执行的闭包函数，防止污染浏览器环境
    // const bundle = `(function(){})()`
    return `
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
            require('${entry}')
        })(${graphStr})
    `
}

const { entry, output } = require('./webpack.config.js');

const filePath = path.join(output.path, output.filename)
const bundle = generate(entry)

fs.writeFileSync(filePath, bundle, 'utf-8')
