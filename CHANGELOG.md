# 0.4.2

* ember-cli-deply-webhooks now uses rsvp for promises instead of the Ember CLI
  Promise implementation, see #23.

# 0.4.1

* Fixed a bug that caused the deployment to not fail although a webhook marked
  as critical did not actually succeed, see #20.

# 0.4.0

* Webhooks can now be defined as **critical** so that when they fail the
  complete deployment will fail, see #19.

# 0.3.0

* The Addon was renamed to ember-cli-deploy-webhooks, see #14.
* Dependencies only used for testing have been moved 
* The Addon does now support authorization data for webhooks, see 10.

# 0.2.0

* The Addon can now send notifications on all deployment hooks, see #8.

# 0.0.1

initial release
