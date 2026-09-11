const { parse } = require('@marcbachmann/cel-js');
const ast = parse("variables.any(v, v.name == 'admin' && v.permissions.has('write'))");
console.log(JSON.stringify(ast, null, 2));
