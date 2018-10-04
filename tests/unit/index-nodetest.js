const Promise = require('rsvp');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

describe('webhooks plugin', function() {
  let subject, plugin, context, mockUi, mockHTTP, services, serviceCalls, callbackReturnValue;

  let BUGSNAG_URI = 'http://notify.bugsnag.com/deploy';

  before(function() {
    subject = require('../../index'); // eslint-disable-line node/no-missing-require
  });

  beforeEach(function() {
    serviceCalls = [];

    plugin = subject.createDeployPlugin({
      name: 'webhooks'
    });

    callbackReturnValue = undefined;

    mockHTTP = function() {
      return function(opts, cb) {
        serviceCalls.push({
          url: opts.url,
          method: opts.method,
          headers: opts.headers,
          body: opts.body || {}
        });

        cb(callbackReturnValue);
      };
    };

    mockUi = {
      messages: [],
      write() {},
      writeLine(message) {
        this.messages.push(message);
      }
    };

    services = {};

    plugin.log = function(message, opts) {
      opts = opts || {};

      if (!opts.verbose || (opts.verbose && this.ui.verbose)) {
        this.ui.write('|    ');
        this.ui.writeLine(`- ${message}`);
      }
    };

    context = {
      ui: mockUi,

      config: {
        webhooks: {
          services,
          httpClient: mockHTTP
        }
      }
    };
  });

  it('has a name', function() {
    assert.equal(plugin.name, 'webhooks');
  });

  describe('configuring services', function() {
    it('warns of services that are configured but have not hook turned on', function() {
      services.bugsnag = {
        apiKey: '1234'
      };

      services.slack = {
        webhookURL: '<your-webhook-url>'
      };

      plugin.beforeHook(context);
      plugin.configure(context);
      plugin.setup(context);

      let messages = mockUi.messages;

      assert.isAbove(messages.length, 0);
      assert.equal(messages[0], '- Warning! bugsnag - Service configuration found but no hook specified in deploy configuration. Service will not be notified.');
    });

    describe('preconfigured services', function() {
      describe('bugsnag', function() {
        beforeEach(function() {
          services.bugsnag = {
            didActivate: true,
            body: {
              apiKey: '1234',
            }
          };
        });

        it('notifies the bugsnag service correctly on `didActivate`', function() {
          plugin.beforeHook(context);
          plugin.configure(context);

          let promise = plugin.didActivate(context);

          return assert.isFulfilled(promise)
            .then(function() {
              assert.equal(serviceCalls.length, 1);

              let call = serviceCalls[0];
              assert.equal(call.url, BUGSNAG_URI);
              assert.deepEqual(call.body, { apiKey: '1234' });
            });
        });

        it('calls custom-url for preconfigured services when url is passed via config', function() {
          let CUSTOM_BUGSNAG_URI = 'http://bugsnag.simplabs.com/deploy';
          services.bugsnag.url = CUSTOM_BUGSNAG_URI;

          plugin.beforeHook(context);
          plugin.configure(context);

          let promise = plugin.didActivate(context);

          return assert.isFulfilled(promise)
            .then(function() {
              assert.equal(serviceCalls.length, 1);

              let call = serviceCalls[0];

              assert.equal(call.url, CUSTOM_BUGSNAG_URI);
              assert.deepEqual(call.body, { apiKey: '1234' });
            });
        });

        it('is enough to specify specific properties to build the correct url', function() {
          services.bugsnag = {
            apiKey: '4321',
            didActivate: true
          };

          plugin.beforeHook(context);
          plugin.configure(context);

          let promise = plugin.didActivate(context);

          return assert.isFulfilled(promise)
            .then(function() {
              assert.equal(serviceCalls.length, 1);

              let call = serviceCalls[0];

              assert.equal(call.url, BUGSNAG_URI);
              assert.deepEqual(call.body, { apiKey: '4321' });
            });
        });

        it('is possible to notify on different hooks', function() {
          services.bugsnag.didActivate = false;
          services.bugsnag.didDeploy = {
            body: {
              apiKey: 'hook specific'
            }
          };

          plugin.beforeHook(context);
          plugin.configure(context);
          plugin.didActivate(context);

          let promise = plugin.didDeploy(context);

          return assert.isFulfilled(promise)
            .then(function() {
              assert.equal(serviceCalls.length, 1);

              let call = serviceCalls[0];

              assert.equal(call.url, BUGSNAG_URI);
              assert.deepEqual(call.body, { apiKey: 'hook specific' });
            });
        });
      });

      describe('slack', function() {
        it('does not implement any hook by default', function() {
          services.slack = {};

          plugin.beforeHook(context);
          plugin.configure(context);

          let promise = Promise.all([
            plugin.setup(context),

            plugin.willDeploy(context),

            plugin.willBuild(context),
            plugin.build(context),
            plugin.didBuild(context),

            plugin.willPrepare(context),
            plugin.prepare(context),
            plugin.didPrepare(context),

            plugin.willUpload(context),
            plugin.upload(context),
            plugin.didUpload(context),

            plugin.willActivate(context),
            plugin.activate(context),
            plugin.didActivate(context),

            plugin.didDeploy(context),
            plugin.teardown(context)
          ]);

          return assert.isFulfilled(promise)
            .then(function() {
              assert.equal(serviceCalls.length, 0);
            });
        });

        it('is possible to specify hooks where slack should be notified', function() {
          let webhookURL = 'https://hooks.slack.com/services/my-webhook-url';
          services.slack = {
            webhookURL,

            didDeploy: {
              body: {
                text: 'didDeploy'
              }
            },

            didActivate: {
              body: {
                text: 'didActivate'
              }
            }
          };

          plugin.beforeHook(context);
          plugin.configure(context);

          let promise = Promise.all([
            plugin.setup(context),

            plugin.willDeploy(context),

            plugin.willBuild(context),
            plugin.build(context),
            plugin.didBuild(context),

            plugin.willPrepare(context),
            plugin.prepare(context),
            plugin.didPrepare(context),

            plugin.willUpload(context),
            plugin.upload(context),
            plugin.didUpload(context),

            plugin.willActivate(context),
            plugin.activate(context),
            plugin.didActivate(context),

            plugin.didDeploy(context),
            plugin.teardown(context)
          ]);

          return assert.isFulfilled(promise)
            .then(function() {
              assert.equal(serviceCalls.length, 2);

              let didActivateMessage = serviceCalls[0];
              let didDeployMessage = serviceCalls[1];

              assert.deepEqual(didActivateMessage.body, { text: 'didActivate' });
              assert.deepEqual(didActivateMessage.url, webhookURL);
              assert.deepEqual(didActivateMessage.method, 'POST');

              assert.deepEqual(didDeployMessage.body, { text: 'didDeploy' });
              assert.deepEqual(didDeployMessage.url, webhookURL);
              assert.deepEqual(didDeployMessage.method, 'POST');
            });
        });
      });
    });

    describe('user configured services', function() {
      it('allows to notify services that are not preconfigured', function() {
        let CUSTOM_URI = 'https://my-custom-hack.com/deployment-webhooks';

        services.custom = {
          url: CUSTOM_URI,
          headers: {},
          method: 'POST',
          body: {
            deployer: 'levelbossmike'
          },
          didActivate: true
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        let promise = plugin.didActivate(context);

        return assert.isFulfilled(promise)
          .then(function() {
            assert.equal(serviceCalls.length, 1);

            let call = serviceCalls[0];

            assert.equal(call.url, CUSTOM_URI);
            assert.deepEqual(call.body, { deployer: 'levelbossmike' });
          });
      });
    });
  });
});
