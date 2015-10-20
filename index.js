/* jshint node: true */
'use strict';

var Promise          = require('ember-cli/lib/ext/promise');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var Notify = require('./lib/notify');
var _ = require('lodash');
var merge = _.merge;
var pick = _.pick;

module.exports = {
  name: 'ember-cli-deploy-notifications',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        configuredServices: {
          bugsnag: {
            url: 'http://notify.bugsnag.com/deploy'
          }
        },

        httpClient: function(context) {
          return context.notifyHTTPClient; // if you want to provide your own http-client
        }
      },

      didDeploy: function(context) {
        var preConfig  = this.readConfig('configuredServices');
        var userConfig = this.readConfig('services');

        var services = merge(preConfig, userConfig);

        var servicesToNotify = pick(services, function(s) {
          return s.url && s.data
        });

        var promises = [];

        for(var key in servicesToNotify) {
          var service = servicesToNotify[key];

          var dataToSend = service.data(context);

          var notify = new Notify({
            plugin: this
          });

          promises.push(notify.send(service.url, dataToSend));
        }

        return Promise.all(promises);
      }
    });

    return new DeployPlugin();
  }
};
