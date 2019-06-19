import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'a',
  attributeBindings: ['href', 'target', 'title', 'rel', 'tabindex'],
  classNameBindings: ['className', 'activeClassName'],

  // You can either pass in the following attributes directly,
  // or you can pass them in nested inside the "params" hash.
  params: {},

  // HTML attributes -- href is defined below.
  rel: Ember.computed.reads('params.rel'),
  title: Ember.computed.reads('params.title'),
  target: Ember.computed.reads('params.target'),
  tabindex: Ember.computed.reads('params.tabindex'),
  className: Ember.computed.reads('params.className'),

  // Ember link-to style attributes
  route: Ember.computed.reads('params.route'),
  model: Ember.computed.reads('params.model'),
  action: Ember.computed.reads('params.action'),
  queryParams: Ember.computed.reads('params.queryParams'),

  // By default, dynamic links on active routes will have class "active", but
  // you can reopen this and set it to blank if you don't like that behavior.
  defaultActiveClass: 'active',

  // You can set an explicit activeClass like in link-to, as well, which can
  // also be passed in via the params hash.
  activeClass: Ember.computed.reads('params.activeClass'),
  activeWhen: Ember.computed.reads('params.activeWhen'),
  activeClassName: Ember.computed('isActive', 'activeClass', 'defaultActiveClass', function() {
    if (this.get('isActive') && this.get('activeClass') !== false) {
      return this.get('activeClass') || this.get('defaultActiveClass');
    }
  }),

  // You can control whether or not the click event bubbles up through the
  // component by setting this property directly or by setting it in the
  // params hash. If no value is set, all clicks will bubble by default.
  bubbles: Ember.computed.reads('params.bubbles'),

  models: Ember.computed('model', function() {
    if (this.get('model') instanceof Array) {
      return this.get('model');
    } else if (this.get('model')) {
      return [this.get('model')];
    } else {
      return [];
    }
  }),

  absoluteRoute: Ember.computed('route', function() {
    const mountPoint = Ember.getOwner(this).mountPoint;
    let route = this.get('route');
    return typeof mountPoint === "undefined" ? route : `${mountPoint}.${route}`;
  }),

  // These are the arguments to be passed to `transitionToRoute`. They consist
  // of a route name and then an optional model with optional query params.
  routeArguments: Ember.computed('absoluteRoute', 'models', 'queryParams', function() {
    var args = [this.get('absoluteRoute')].concat(this.get('models'));

    if (this.get('queryParams')) {
      args.push({ queryParams: this.get('queryParams') });
    }

    return args;
  }),

  // Arguments suited for routing service
  routingArguments: Ember.computed('absoluteRoute', 'models', 'queryParams', function() {
    return [
      this.get('absoluteRoute'),
      this.get('models'),
      this.get('queryParams') || {}
    ];
  }),

  // The href attribute of the link takes one of three forms.
  // If we have a literal href passed in, always defer to it.
  // If we have route parameters, try to construct the route's URL.
  // If we have an action, just '#' should do.
  href: Ember.computed('routeArguments', 'action', 'params.href', function() {
    if (this.get('params.href')) {
      return this.get('params.href');
    } else if (this.get('route')) {
      if (this.get('_routing')) {
        return this.get('_routing').generateURL(...this.get('routingArguments'));
      } else {
        return this.get('_router').generate(...this.get('routeArguments'));
      }
    } else {
      return '#';
    }
  }),

  // Use prevent default to keep route transitions and actions from
  // refreshing the page. Allows click behavior to bubble up if allowed
  // by the bubbles property
  click: function(event) {
    if ((this.get('action') || this.get('route')) && !(event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (this.get('action')) {
        this.performAction();
      } else {
        this.transitionRoute();
      }
      return this.get('bubbles') !== false;
    } else {
      return true;
    }
  },

  // bubble the action to wherever the link was added
  performAction: function() {
    var target = this.get('_targetObject') || this.get('targetObject');
    if (target) {
      target.send(this.get('action'));
    }
  },

  _route: Ember.computed(function() {
    return Ember.getOwner(this).lookup('route:application');
  }),

  _router: Ember.computed('_route._router', '_route.router', function() {
    return this.get('_route._router') || this.get('_route.router');
  }),

  _routing: Ember.inject.service(),

  // have the application route transition to the location
  // specified by the parameters
  transitionRoute: function() {
    let routing = this.get('_routing');
    if (routing) {
      routing.transitionTo(...this.get('routingArguments'));
    } else {
      this.get('_router').transitionTo(...this.get('routeArguments'));
    }
  },

  isActive: Ember.computed('_router.currentState', 'activeWhen', function() {
    if (this.get('activeWhen') !== undefined) {
      return this.get('activeWhen');
    } else if (this.get('route') && this.get('_router.currentState')) {
      let routing = this.get('_routing');
      if (routing) {
        let currentState = Ember.get(this, '_routing.currentState');
        if (!currentState) { return false; }
        return routing.isActiveForRoute(this.get('models'), this.get('queryParams') || {}, this.get('absoluteRoute'), currentState, false);
      } else {
        return this.get('_router').isActive(...this.get('routeArguments'));
      }
    } else {
      return false;
    }
  })
});
