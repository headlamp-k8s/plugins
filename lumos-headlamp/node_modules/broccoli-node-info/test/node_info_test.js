'use strict'

var broccoliNodeInfo = require('..')
var chai = require('chai'), expect = chai.expect

var versions = {
  'broccoli-plugin': {
    '1.0.0': 'broccoli-plugin-1-0-0',
    '1.1.0': 'broccoli-plugin-1-1-0',
    '1.2.0': 'broccoli-plugin-1-2-0',
    '1.3.0': 'broccoli-plugin-1-3-0',
  },
  'broccoli-source': {
    '1.1.0': 'broccoli-source-1-1-0'
  }
};

function forEachVersion(packageName, callback) {
  for (var versionNumber in versions[packageName]) {
    var aliasedPackageName = versions[packageName][versionNumber];
    var entryPoint = require(aliasedPackageName);
    callback(versionNumber, entryPoint);
  }
}

describe('transform nodes', function() {
  forEachVersion('broccoli-plugin', function(version, Plugin) {
    describe('broccoli-plugin ' + version, function() {
      NoopPlugin.prototype = Object.create(Plugin.prototype)
      NoopPlugin.prototype.constructor = NoopPlugin
      function NoopPlugin(inputNodes, options) {
        Plugin.call(this, inputNodes || [], options)
      }
      NoopPlugin.prototype.build = function() {
      }

      it('has all properties', function() {
        var nodeInfo = broccoliNodeInfo.getNodeInfo(new NoopPlugin)
        expect(nodeInfo.nodeType).to.equal('transform')
        expect(nodeInfo.name).to.equal('NoopPlugin')
        expect(nodeInfo).to.have.property('annotation', undefined)
        expect(nodeInfo.instantiationStack).to.be.a('string')
        expect(nodeInfo.inputNodes).to.deep.equal([])
        expect(nodeInfo.setup).to.be.a('function')
        expect(nodeInfo.getCallbackObject).to.be.a('function')
        expect(nodeInfo.persistentOutput).to.equal(false)
        expect(nodeInfo.needsCache).to.equal(true)
        expect(nodeInfo.fsFacade).to.equal(false)

        // Check that there are no extra keys
        expect(nodeInfo).to.have.keys([
          'nodeType', 'name', 'annotation', 'instantiationStack',
          'inputNodes', 'setup', 'getCallbackObject', 'persistentOutput',
          'needsCache', 'volatile', 'trackInputChanges', 'fsFacade'
        ])
      })

      it('does not eagerly evaluate instantiationStack', function() {
        var plugin = new NoopPlugin();
        plugin.__broccoliGetInfo__ = function(features) {
          var originalNodeInfo = NoopPlugin.prototype.__broccoliGetInfo__.call(this, features);

          var nodeInfo = {}
          for (var key in originalNodeInfo) {
            nodeInfo[key] = originalNodeInfo[key]
          }

          Object.defineProperty(nodeInfo, 'instantiationStack', {
            enumerable: true,
            configurable: true,
            get: function() {
              throw new Error('Do not eagerly evaluate instantiationStack!!!!');
            }
          });

          return nodeInfo;
        };

        // should not throw here at all
        var nodeInfo = broccoliNodeInfo.getNodeInfo(plugin);

        // ensure that we *do* throw the error if we actually access
        expect(function () {
          nodeInfo.instantiationStack;
        }).throws(/Do not eagerly evaluate instantiationStack/);
      });
    })
  })

})

describe('source nodes', function() {
  forEachVersion('broccoli-source', function(version, broccoliSource) {
    describe('broccoli-source ' + version, function() {
      var classNames = { 'WatchedDir': true, 'UnwatchedDir': false }
      Object.keys(classNames).forEach(function(className) {
        var class_ = broccoliSource[className]
        var watched = classNames[className]
        describe(className, function() {
          it('has all properties', function() {
            var nodeInfo = broccoliNodeInfo.getNodeInfo(new class_('some/dir'))
            expect(nodeInfo.nodeType).to.equal('source')
            expect(nodeInfo.name).to.be.a('string')
            expect(nodeInfo).to.have.property('annotation', undefined)
            expect(nodeInfo.instantiationStack).to.be.a('string')
            expect(nodeInfo.sourceDirectory).to.equal('some/dir')
            expect(nodeInfo.watched).to.equal(watched)
            // Check that there are no extra keys
            expect(nodeInfo).to.have.keys(['nodeType', 'name', 'annotation', 'instantiationStack',
              'sourceDirectory', 'watched'])
          })
        })
      })
    })
  })
})

describe('invalid nodes', function() {
  ['read', 'rebuild'].forEach(function(functionName) {
    it('rejects .' + functionName + '-based nodes', function() {
      var node = {}
      node[functionName] = function() { }
      expect(function() {
        broccoliNodeInfo.getNodeInfo(node)
      }).to.throw(broccoliNodeInfo.InvalidNodeError, 'The .read/.rebuild API is no longer supported')
    })
  })

  it('rejects null', function() {
    expect(function() {
      broccoliNodeInfo.getNodeInfo(null)
    }).to.throw(broccoliNodeInfo.InvalidNodeError, 'null is not a Broccoli node')
  })

  it('rejects non-node objects', function() {
    expect(function() {
      broccoliNodeInfo.getNodeInfo({})
    }).to.throw(broccoliNodeInfo.InvalidNodeError, '[object Object] is not a Broccoli node')
  })

  it('rejects string nodes', function() {
    expect(function() {
      broccoliNodeInfo.getNodeInfo('some/dir')
    }).to.throw(broccoliNodeInfo.InvalidNodeError, '"some/dir": String nodes are not supported')
  })

  it('rejects nodes with invalid nodeType', function() {
    expect(function() {
      console.log(broccoliNodeInfo.getNodeInfo({
        __broccoliFeatures__: { persistentOutputFlag: true, sourceDirectories: true },
        __broccoliGetInfo__: function(builderFeatures) {
          return { nodeType: 'foo' }
        }
      }))
    }).to.throw(broccoliNodeInfo.InvalidNodeError, 'Unexpected nodeType: foo')
  })
})
