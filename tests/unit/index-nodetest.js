var assert = require('ember-cli/tests/helpers/assert');

describe('notifications plugin', function() {
  var subject, plugin, context, mockUi, mockHTTP, services, serviceCalls;


  before(function() {
    subject = require('../../index');
  });

  beforeEach(function() {
    serviceCalls = [];

    plugin = subject.createDeployPlugin({
      name: 'notifications'
    });

    mockHTTP = {
      post: function(url, data, cb) {
        serviceCalls.push({
          url: url,
          data: data.form || {}
        });

        cb();
      }
    };

    mockUi = {
      messages: [],
      write: function() {},
      writeLine: function(message) {
        this.messages.push(message);
      }
    };

    services = {
      bugsnag: {
        data: function(context) {
          return { apiKey: '1234' }
        }
      }
    };

    context = {
      ui: mockUi,

      config: {
        notifications: {
          services: services,
          httpClient: mockHTTP
        }
      }
    }
  });

  it('has a name', function() {
    assert.equal(plugin.name, 'notifications');
  });

  describe('#didActivate', function() {
    it('implements the `didActivate`-hook', function() {
      assert.ok(plugin.didActivate);
    });

    describe('notifies services that are present as keys in the plugin config', function() {
      describe('pre-configured services', function() {
        it('calls correct url for pre-configured services when no url is passed via config', function() {
          plugin.beforeHook(context);
          plugin.configure(context);

          var promise = plugin.didActivate(context);

          return assert.isFulfilled(promise)
            .then(function() {
              assert.equal(serviceCalls.length, 1);

              var call = serviceCalls[0];
              assert.equal(call.url, 'http://notify.bugsnag.com/deploy');
              assert.deepEqual(call.data, { apiKey: '1234' });
            });
        });

        it('calls custom-url for preconfigured services when url is passed via config', function() {
          services.bugsnag.url = 'http://bugsnag.simplabs.com/deploy'

          plugin.beforeHook(context);
          plugin.configure(context);

          var promise = plugin.didActivate(context);

          return assert.isFulfilled(promise)
            .then(function() {
              assert.equal(serviceCalls.length, 1);

              var call = serviceCalls[0];

              assert.equal(call.url, 'http://bugsnag.simplabs.com/deploy');
              assert.deepEqual(call.data, { apiKey: '1234' });
            });
        });
      });

      it('calls service when specifying data-function and url', function() {
        var customServiceURL    = 'http://deployLog.simplabs.com';
        var deployer            = 'LevelbossMike';
        var customServiceConfig = {
          url: customServiceURL,
          data: function() {
            return {
              deployer: deployer
            }
          }
        };

        services.simplabs = customServiceConfig;

        plugin.beforeHook(context);
        plugin.configure(context);

        var promise = plugin.didActivate(context);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(serviceCalls.length, 2);

            var call = serviceCalls[1];

            assert.equal(call.url, customServiceURL);
            assert.deepEqual(call.data, { deployer: deployer });
          });
      });

      it('rejects when request fails', function() {
        mockHTTP.post = function(url, data, cb) {
          cb('error');
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        var promise = plugin.didActivate(context);

        return assert.isRejected(promise);
      });

      it("can be passed a function that gets passed the deploy context - the function's return value will be sent as data", function() {
        var deployer     = 'Simplabs';
        context.deployer = deployer;

        services.bugsnag.data = function(context) {
          return {
            apiKey: '1234',
            deployer: context.deployer
          };
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        var promise = plugin.didActivate(context);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(serviceCalls[0].data.deployer, deployer, "It's possible to send dynamic content based on deploy context");
          });
      });

    });

    it("does not notify custom services that don't define a data AND url property", function() {
      services.customService = {
        url: 'http://deployLog.simplabs.com'
      };

      plugin.beforeHook(context);
      plugin.configure(context);

      var promise = plugin.didActivate(context);

      return assert.isFulfilled(promise)
        .then(function() {
          assert.equal(serviceCalls.length, 1, 'Only (preconfigured) bugsnag service was called');
        });
    });

    it('does not break when no services are configured in deploy.js', function() {
      delete context.config.notifications.services;

      plugin.beforeHook(context);
      plugin.configure(context);

      var promise = plugin.didActivate(context);

      return assert.isFulfilled(promise);
    });
  });
});
