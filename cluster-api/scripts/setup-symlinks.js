const fs = require('fs');
const path = require('path');

const base = path.join(process.cwd(), 'node_modules/@kinvolk/headlamp-plugin/lib');

const target = path.join(base, 'lib', 'k8s');
const link = path.join(base, 'k8s');

if (!fs.existsSync(link)) {
  fs.symlinkSync(target, link, 'dir');
  console.log('Created:', link, '->', target);
}
