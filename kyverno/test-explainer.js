require('ts-node').register();
const { explainCEL } = require('./src/utils/celExplainer.ts');
console.log(explainCEL("variables.any(v, v.name == 'admin' && v.permissions.has('write'))"));
