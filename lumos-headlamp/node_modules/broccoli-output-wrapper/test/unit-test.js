const buildOutputWrapper = require('../src');
const tmp = require('tmp');
const fs = require('fs');
const { expect } = require('chai');
const path = require('path');

describe('output-wrapper', function() {
  let output, temp, node;

  beforeEach(() => {
    temp = tmp.dirSync();
    node = {
      outputPath: temp.name,
    };
    output = buildOutputWrapper(node);
  });

  it('should write to given location', function() {
    output.writeFileSync('test.md', 'test');
    let content = fs.readFileSync(`${temp.name}/test.md`, 'UTF-8');
    expect(content).to.be.equal('test');
  });

  it(`takes absolute path as input`, function() {
    output.writeFileSync('test.md', 'test');
    expect(output.existsSync(`${temp.name}/test.md`, 'test')).to.be.true;
  });

  it(`throws actionable error when relative path is traverses above outputPath`, function() {
    expect(() => output.writeFileSync(`../../../test.md`, 'test')).to.throw(
      `Traversing above the outputPath is not allowed. Relative path ../../../test.md traverses beyond ${node.outputPath}`
    );
  });

  it(`should not allow other fs operations`, function() {
    expect(() => output.writevSync('test.md', 'test')).to.throw(
      /^Operation writevSync is not allowed to use. Allowed operations are readFileSync,existsSync,lstatSync,readdirSync,statSync,writeFileSync,appendFileSync,rmdirSync,mkdirSync,unlinkSync,symlinkOrCopySync,symlinkSync,utimesSync,outputFileSync$/
    );
  });

  it('can create folder recursively', function() {
    let SUBFOLDER_PATH = 'main/sub';
    expect(fs.existsSync(`${temp.name}/${SUBFOLDER_PATH}`)).to.be.false;
    output.mkdirSync(SUBFOLDER_PATH, { recursive: true });
    expect(fs.existsSync(`${temp.name}/${SUBFOLDER_PATH}`)).to.be.true;
  });

  it('can create folder non recursive', function() {
    expect(fs.existsSync(`${temp.name}/test`)).to.be.false;
    output.mkdirSync('test');
    expect(fs.existsSync(`${temp.name}/test`)).to.be.true;
  });

  it('can remove folder recursively', function() {
    output.mkdirSync('test');
    expect(fs.existsSync(`${temp.name}/test`)).to.be.true;
    output.writeFileSync('test.md', 'test');
    output.rmdirSync('./', {
      recursive: true
    });
    expect(fs.existsSync(`${temp.name}/test`)).to.be.false;
  });

  it('can remove folder non recursive', function() {
    output.mkdirSync('test');
    expect(fs.existsSync(`${temp.name}/test`)).to.be.true;
    expect(()=> output.rmdirSync('./')).to.throw(Error);
    output.rmdirSync('test');
    expect(fs.existsSync(`${temp.name}/test`)).to.be.false;
  });

  it('can symlinkOrCopySync', function () {
    let temp_in = tmp.dirSync().name;
    fs.writeFileSync(`${temp_in}/test.md`, 'test');
    output.symlinkOrCopySync(`${temp_in}/test.md`, `test.md`);
    expect(fs.realpathSync(`${temp.name}/test.md`)).to.be.contains(path.join(temp_in,'test.md'));
    expect(output.lstatSync('test.md').isSymbolicLink()).to.be.true;
  });

  it('can create file with outputFileSync', function () {
    output.outputFileSync(`asset/test.md`, `test`);
    expect(output.readFileSync('asset/test.md', 'utf-8')).to.be.equal('test');
  });

  it(`should throw if the dir strutcture doesn't exist and attempt to write`, function() {
    expect(() => output.writeFileSync('test/test.md', 'test')).to.throw(
      /.*no such file or directory.*/
    );
  });

  it(`should throw if the dir strutcture doesn't exist and attempt to read`, function() {
    expect(() => output.readFileSync('test/test.md')).to.throw(
      /ENOENT: no such file or directory,/
    );
  });
});