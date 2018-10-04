const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');

chai.use(chaiAsPromised);

const assert = chai.assert;

describe('Notify', function() {
  let Notify, subject, bad_url, mockUi, plugin, url, serviceKey;

  before(function() {
    Notify = require('../../../lib/notify'); // eslint-disable-line node/no-missing-require
  });

  beforeEach(function() {
    serviceKey = 'test';

    mockUi = {
      messages: [],
      write() {},
      writeLine(message) {
        this.messages.push(message);
      }
    };
    plugin = {
      ui: mockUi,
      readConfig(propertyName) {
        if (propertyName === 'httpClient') {
          return undefined;
        }
      },
      log(message, opts) {
        opts = opts || {};

        if (!opts.verbose || (opts.verbose && this.ui.verbose)) {
          this.ui.write('|    ');
          this.ui.writeLine(`- ${message}`);
        }
      }
    };

    nock('http://notify.bugsnag.com')
      .post('/deploy', {
        apiKey: '1234'
      })
      .reply(200, 'OK')
      .post('/deploy', {
        apiKey: '4321'
      })
      .reply(200, { status: 'OK' })
      .post('/deploy', {
        apiKey: '4321',
        bar: 'foo'
      })
      .reply(500, { status: 'Internal Server Error' });

    nock('http://notify.bugsnag.comm')
      .post('/deploy', {})
      .replyWithError('Timeout');
  });

  describe('#send', function() {
    beforeEach(function() {
      url = 'http://notify.bugsnag.com/deploy';
      bad_url = 'http://notify.bugsnag.comm/deploy';
      subject = new Notify({
        plugin
      });
    });

    describe('does not issue requests when `url`,`method`, `headers` or `body` is falsy in opts', function() {
      it('logs to the console when one of the properties is missing (verbose logging)', function() {
        mockUi.verbose = true;

        let promise = subject.send(serviceKey, {
          url
        });

        return assert.isFulfilled(promise)
          .then(function() {
            let messages = mockUi.messages;

            // assert.isAbove(messages.length, 0);
            assert.equal(messages[0], `- ${serviceKey} => No request issued! Request options invalid! You have to specify \`url\`, \`headers\`, \`method\` and \`body\`.`);
          });
      });

      it('resolves immediately when no body is specified', function() {
        let promise = subject.send(serviceKey, {
          url: '/fubar'
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when no url is specified', function() {
        let promise = subject.send(serviceKey, {
          body: {
            apiKey: '1234'
          }
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when `body` is false', function() {
        let promise = subject.send(serviceKey, {
          url: false,
          body: {
            apiKey: '1234'
          }
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when `body` is false', function() {
        let promise = subject.send(serviceKey, {
          url: '/fubar',
          body: false
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when `headers` is false', function() {
        let promise = subject.send(serviceKey, {
          url: '/fubar',
          body: {
            apiKey: '1234'
          },
          headers: false
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when `method` is false', function() {
        let promise = subject.send(serviceKey, {
          url: '/fubar',
          body: {
            apiKey: '1234'
          },
          method: false
        });

        return assert.isFulfilled(promise);
      });
    });

    it('calls the correct url', function() {
      let data = { apiKey: '1234' };

      let opts = {
        url,
        body: data
      };

      let promise = subject.send(serviceKey, opts);

      return assert.isFulfilled(promise);
    });

    it('logs when a request was successful', function() {
      let data = { apiKey: '1234' };

      let opts = {
        url,
        body: data
      };

      let promise = subject.send(serviceKey, opts);

      return assert.isFulfilled(promise)
        .then(function() {
          let messages = mockUi.messages;

          assert.isAbove(messages.length, 0);
          assert.equal(messages[0], `- ${serviceKey} => OK`);
        });
    });

    it('logs when a request is an object', function() {
      let data = { apiKey: '4321' };

      let opts = {
        url,
        body: data
      };

      let promise = subject.send(serviceKey, opts);

      return assert.isFulfilled(promise)
        .then(function() {
          let messages = mockUi.messages;

          assert.isAbove(messages.length, 0);
          assert.equal(messages[0], `- ${serviceKey} => {"status":"OK"}`);
        });
    });

    it('logs when a request was successful and critical is true', function() {
      let opts = {
        url,
        body: { apiKey: '4321' },
        critical: true
      };

      let promise = subject.send(serviceKey, opts);

      return assert.isFulfilled(promise)
        .then(function() {
          let messages = mockUi.messages;

          assert.isAbove(messages.length, 0);
          assert.equal(messages[0], `- ${serviceKey} => {"status":"OK"}`);
        });
    });

    describe('when request fails', function() {
      it('resolves when the request fails', function() {
        let promise = subject.send(serviceKey, {
          url: bad_url,
          body: {}
        });

        return assert.isFulfilled(promise);
      });

      it('logs to the console', function() {
        let promise = subject.send(serviceKey, {
          url: bad_url,
          body: {}
        });

        return assert.isFulfilled(promise)
          .then(function() {
            let messages = mockUi.messages;

            assert.isAbove(messages.length, 0);
            assert.equal(messages[0], `- ${serviceKey} => Error: Timeout`);
          });
      });
    });

    describe('when request fails and critical is true', function() {
      it('reject when the request fails', function() {
        let promise = subject.send(serviceKey, {
          url: bad_url,
          body: {},
          critical: true
        });
        return assert.isRejected(promise);
      });

      it('reject when the status code is not 2xx', function() {
        let promise = subject.send(serviceKey, {
          url,
          body: {
            apiKey: '4321',
            bar: 'foo'
          },
          critical: true
        });

        return assert.isRejected(promise);
      });
    });
  });
});
