/* jshint node: true */
'use strict';

var RSVP             = require('rsvp');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var Notify = require('./lib/notify');
var Service = require('./lib/service');
var _ = require('lodash');
var merge = _.merge;
var pick = _.pick;
var intersection = _.intersection;
var forIn = _.forIn;

function notificationHook(hookName) {
  return function(context) {
    var preConfig  = this.readConfig('configuredServices');
    var userConfig = this.readConfig('services');

    var promises = [];

    for (var key in userConfig) {
      var defaults = preConfig[key] || {};
      var user     = userConfig[key] || {};
      var hook     = userConfig[key][hookName] || {};

      var service = new Service({
        defaults: defaults,
        user: user,
        hook: hook
      });

      if (service.serviceOptions[hookName]) {
        var notify = new Notify({
          plugin: this
        });

        var opts = service.buildServiceCall(context);

        promises.push(notify.send(key, opts));
      }
    }

    return RSVP.all(promises);
  }
}

module.exports = {
  name: require('./package').name,

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        configuredServices: function(context) {
          return {
            bugsnag: {
              url: 'http://notify.bugsnag.com/deploy',
              method: 'POST',
              headers: {},
              body: function() {
                var apiKey = this.apiKey;

                if (!apiKey) { return; }

                return {
                  apiKey: this.apiKey,
                  releaseStage: process.env.DEPLOY_TARGET
                }
              }
            },

            slack: {
              url: function() {
                return this.webhookURL;
              },
              method: 'POST',
              headers: {}
            }
          }
        },

        httpClient: function(context) {
          return context.notifyHTTPClient;
        }
      },

      setup: function(context) {
        var services = this.readConfig('services');
        var hooks = [
          'willDeploy', 'willBuild', 'build', 'didBuild', 'willPrepare', 'prepare',
          'didPrepare', 'willUpload', 'upload', 'didUpload', 'willActivate',
          'activate', 'didActivate', 'didDeploy', 'teardown', 'fetchRevisions',
          'displayRevisions', 'didFail'
        ];

        var servicesWithNoHooksConfigured = pick(services, function(service) {
          return _.intersection(Object.keys(service), hooks).length === 0;
        });

        _.forIn(servicesWithNoHooksConfigured, function(value, key) {
          this.log('Warning! '+key+' - Service configuration found but no hook specified in deploy configuration. Service will not be notified.', { color: 'yellow' });
        }, this);
      },

      willDeploy: notificationHook('willDeploy'),

      willBuild: notificationHook('willBuild'),
      build: notificationHook('build'),
      didBuild: notificationHook('didBuild'),

      willPrepare: notificationHook('willPrepare'),
      prepare: notificationHook('prepare'),
      didPrepare: notificationHook('didPrepare'),

      willUpload: notificationHook('willUpload'),
      upload: notificationHook('upload'),
      didUpload: notificationHook('didUpload'),

      willActivate: notificationHook('willActivate'),
      activate: notificationHook('activate'),
      didActivate: notificationHook('didActivate'),

      didDeploy: notificationHook('didDeploy'),

      teardown: notificationHook('teardown'),

      fetchRevisions: notificationHook('fetchRevisions'),
      displayRevisions: notificationHook('displayRevisions'),

      didFail: notificationHook('didFail')
    });

    return new DeployPlugin();
  }
};
