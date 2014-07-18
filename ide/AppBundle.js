
/*
----------------------------
  A refactor version of previous lib/websocket
  The usage of Meteor seems to be wrong, but whatever.
----------------------------
 */

(function() {
  define('ide/Websocket',["Meteor", "backbone", "event", "MC"], function(Meteor, Backbone, ide_event) {
    var WEBSOCKET_URL, Websocket, singleton;
    WEBSOCKET_URL = "" + MC.API_HOST + "/ws/";
    Meteor._debug = function() {
      return console.log.apply(console, arguments);
    };
    singleton = null;
    Websocket = function() {
      var opts;
      if (singleton) {
        return singleton;
      }
      singleton = this;
      this.__readyDefer = Q.defer();
      this.__isReady = false;
      this.connection = Meteor.connect(WEBSOCKET_URL, true);
      opts = {
        connection: this.connection
      };
      this.collection = {
        request: new Meteor.Collection("request", opts),
        request_detail: new Meteor.Collection("request_detail", opts),
        stack: new Meteor.Collection("stack", opts),
        app: new Meteor.Collection("app", opts),
        status: new Meteor.Collection("status", opts),
        imports: new Meteor.Collection("imports", opts)
      };
      Deps.autorun((function(_this) {
        return function() {
          return _this.statusChanged();
        };
      })(this));
      this.subscribe();
      this.pipeChanges();
      setTimeout((function(_this) {
        return function() {
          _this.shouldNotify = true;
          if (!_this.connection.status.connected) {
            return _this.statusChanged();
          }
        };
      })(this), 5000);
      return this;
    };
    Websocket.prototype.statusChanged = function() {
      var status;
      status = this.connection.status().connected;
      if (status) {
        this.shouldNotify = true;
      }
      if (!this.shouldNotify) {
        return;
      }
      return this.trigger("StatusChanged", status);
    };
    Websocket.prototype.subscribe = function() {
      var callback, onReady, session, subscribed, usercode;
      if (this.subscribed) {
        return;
      }
      subscribed = true;
      onReady = function() {
        this.__isReady = true;
        return this.__readyDefer.resolve();
      };
      usercode = App.user.get('usercode');
      session = App.user.get('session');
      callback = {
        onReady: _.bind(onReady, this),
        onError: _.bind(this.onError, this)
      };
      this.connection.subscribe("request", usercode, session, callback);
      this.connection.subscribe("stack", usercode, session);
      this.connection.subscribe("app", usercode, session);
      this.connection.subscribe("status", usercode, session);
      this.connection.subscribe("imports", usercode, session);
    };
    Websocket.prototype.ready = function() {
      return this.__readyDefer.promise;
    };
    Websocket.prototype.isReady = function() {
      return this.__isReady;
    };
    Websocket.prototype.onError = function(error) {
      console.error("Websocket/Meteor Error:", error);
      this.subscribed = false;
      this.trigger("Disconnected");
    };
    Websocket.prototype.pipeChanges = function() {
      var self;
      self = this;
      this.collection.request.find().fetch();
      this.collection.request.find().observeChanges({
        added: function(idx, dag) {
          return self.trigger("requestChange", idx, dag);
        },
        changed: function(idx, dag) {
          return self.trigger("requestChange", idx, dag);
        }
      });
      this.collection.imports.find().fetch();
      this.collection.imports.find().observe({
        added: function(idx, dag) {
          return self.trigger("visualizeUpdate", idx);
        },
        changed: function(idx, dag) {
          return self.trigger("visualizeUpdate", idx);
        }
      });
      this.collection.status.find().fetch();
      return this.collection.status.find().observe({
        added: function(idx, statusData) {
          ide_event.trigger(ide_event.UPDATE_STATE_STATUS_DATA, 'add', idx, statusData);
          return ide_event.trigger(ide_event.UPDATE_STATE_STATUS_DATA_TO_EDITOR, idx ? [idx.res_id] : []);
        },
        changed: function(newDocument, oldDocument) {
          ide_event.trigger(ide_event.UPDATE_STATE_STATUS_DATA, 'change', newDocument, oldDocument);
          return ide_event.trigger(ide_event.UPDATE_STATE_STATUS_DATA_TO_EDITOR, newDocument ? [newDocument.res_id] : []);
        }
      });
    };
    _.extend(Websocket.prototype, Backbone.Events);
    return Websocket;
  });

}).call(this);

define('ide/subviews/SessionDialogTpl',['handlebars'], function(Handlebars){ var TEMPLATE = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<section style=\"width:400px;\" class=\"invalid-session\" id=\"SessionDialog\">\n  <div class=\"confirmSession\">\n  <div class=\"modal-header\"><h3>Invalid Session</h3></div>\n\n  <article class=\"modal-body\">\n    <div class=\"modal-text-major\"> <p>Your account has signed in from other location or you last login has timed out.</p> <p>Would you like to reconnect this session or close it?</p> </div>\n    <div class=\"modal-text-minor\">If you have unsaved changes, close this session will cause all your change to lose.</div>\n  </article>\n\n  <footer class=\"modal-footer\">\n    <button id=\"SessionReconnect\" class=\"btn btn-blue\">Reconnect</button>\n    <button id=\"SessionClose\" class=\"btn btn-silver\">Close Session</button>\n  </footer>\n  </div>\n\n  <div class=\"reconnectSession\" style=\"display:none;\">\n  <div class=\"modal-header\"><h3>Reconnect Session</h3></div>\n  <article class=\"modal-body\">\n    <div class=\"modal-text-major\">Please provide your password to reconnect:</div>\n    <div class=\"modal-input\">\n      <input type=\"password\" id=\"SessionPassword\" class=\"input\" placeholder=\"Password\" style=\"width:200px;\" autofocus>\n    </div>\n  </article>\n  <footer class=\"modal-footer\">\n    <button id=\"SessionConnect\" class=\"btn btn-blue\" disabled>Connect</button>\n    <button id=\"SessionClose2\" class=\"btn btn-red\">Close Session</button>\n  </footer>\n  </div>\n</section>";
  }; return Handlebars.template(TEMPLATE); });
(function() {
  define('ide/subviews/SessionDialog',['i18n!/nls/lang.js', "./SessionDialogTpl", "backbone"], function(lang, template) {
    var CurrentSessionDialog, SessionDialogView;
    CurrentSessionDialog = null;
    SessionDialogView = Backbone.View.extend({
      events: {
        'click #SessionReconnect': 'showReconnect',
        'click #SessionClose': 'closeSession',
        'click #SessionClose2': 'closeSession',
        'click #SessionConnect': 'connect',
        'keyup #SessionPassword': 'passwordChanged'
      },
      constructor: function() {
        if (CurrentSessionDialog) {
          return CurrentSessionDialog;
        }
        CurrentSessionDialog = this;
        this.defer = Q.defer();
        modal(template(), false);
        return this.setElement($('#modal-wrap'));
      },
      promise: function() {
        return this.defer.promise;
      },
      showReconnect: function() {
        $(".invalid-session .confirmSession").hide();
        $(".invalid-session .reconnectSession").show();
      },
      closeSession: function() {
        return App.logout();
      },
      connect: function() {
        if ($("#SessionConnect").is(":disabled")) {
          return;
        }
        $("#SessionConnect").attr("disabled", "disabled");
        return App.user.acquireSession($("#SessionPassword").val()).then((function(_this) {
          return function() {
            _this.remove();
            _this.defer.resolve();
          };
        })(this), function(error) {
          $("#SessionConnect").removeAttr("disabled");
          notification('error', lang.ide.NOTIFY_MSG_WARN_AUTH_FAILED);
          $("#SessionPassword").toggleClass("parsley-error", true);
        });
      },
      passwordChanged: function(evt) {
        $("#SessionPassword").toggleClass("parsley-error", false);
        if (($("#SessionPassword").val() || "").length >= 6) {
          $("#SessionConnect").removeAttr("disabled");
        } else {
          $("#SessionConnect").attr("disabled", "disabled");
        }
        if (evt.which === 13) {
          this.connect();
        }
      }
    });
    return SessionDialogView;
  });

}).call(this);

define('ide/subviews/HeaderTpl',['handlebars'], function(Handlebars){ var TEMPLATE = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, escapeExpression=this.escapeExpression, functionType="function";


  buffer += "<nav id=\"header\">\n  <a id=\"support\" class=\"icon-support\" href=\"mailto:3rp02j1w@incoming.intercom.io\" target=\"_blank\">Support</a>\n\n  <section class=\"dropdown\" >\n    <div id=\"HeaderNotification\" class=\"js-toggle-dropdown\">\n      <i class=\"icon-notification\"></i>\n      <span id=\"NotificationCounter\"></span>\n    </div>\n\n    <div class=\"dropdown-menu\">\n      <div id=\"notification-panel-wrapper\" class=\"scroll-wrap\">\n        <div class=\"scrollbar-veritical-wrap\"><div class=\"scrollbar-veritical-thumb\"></div></div>\n        <ul class=\"scroll-content\"></ul>\n\n        <div class=\"notification-empty\">\n          <div class=\"title\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_BLANK_NOTIFICATION", {hash:{},data:data}))
    + "</div>\n          <div class=\"description\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_BLANK_NOTIFICATION_DESC", {hash:{},data:data}))
    + "</div>\n        </div>\n      </div>\n\n    </div>\n  </section>\n\n  <section class=\"dropdown\">\n    <div id=\"HeaderUser\" class=\"js-toggle-dropdown tooltip\" data-tooltip=\""
    + escapeExpression(((stack1 = (depth0 && depth0.user_email)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n      <span class=\"truncate left\" style=\"max-width:100px;\">"
    + escapeExpression(((stack1 = (depth0 && depth0.user_name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n      <i class=\"icon-caret-down\"></i>\n    </div>\n\n    <ul class=\"dropdown-menu\">\n      <li id=\"HeaderShortcuts\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_MENUITEM_KEY_SHORT", {hash:{},data:data}))
    + "</li>\n      <li><a class=\"dis-blk\" href=\"http://docs.visualops.io\" target=\"_blank\" >"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_MENUITEM_DOC", {hash:{},data:data}))
    + "</a></li>\n      <li id=\"HeaderSettings\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_MENUITEM_SETTING", {hash:{},data:data}))
    + "</li>\n      <li id=\"HeaderLogout\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_MENUITEM_LOGOUT", {hash:{},data:data}))
    + "</li>\n    </ul>\n  </section>\n</nav>";
  return buffer;
  }; return Handlebars.template(TEMPLATE); });
define('ide/subviews/SettingsDialogTpl',['handlebars'], function(Handlebars){ var TEMPLATE = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  
  return "style=\"display:block;\"";
  }

function program3(depth0,data) {
  
  var buffer = "";
  buffer += "\n        <button id=\"CredSetupRemove\" class=\"link-style\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_REMOVE_CREDENTIAL", {hash:{},data:data}))
    + "</button>\n        ";
  return buffer;
  }

  buffer += "<div class=\"modal-header\">\n  <h3>"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_SETTING", {hash:{},data:data}))
    + "</h3><i class=\"modal-close\">&times;</i>\n</div>\n\n<nav id=\"SettingsNav\">\n  <span data-target=\"AccountTab\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_ACCOUNT", {hash:{},data:data}))
    + "</span>\n  <span data-target=\"CredentialTab\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_CREDENTIAL", {hash:{},data:data}))
    + "</span>\n  <span data-target=\"TokenTab\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCESSTOKEN", {hash:{},data:data}))
    + "</span>\n</nav>\n\n<div class=\"modal-body\" id=\"SettingsBody\">\n  <section id=\"AccountTab\">\n    <dl class=\"dl-horizontal\">\n      <dt>"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_ACCOUNT_USERNAME", {hash:{},data:data}))
    + "</dt><dd>"
    + escapeExpression(((stack1 = (depth0 && depth0.username)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n      <dt>"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_ACCOUNT_EMAIL", {hash:{},data:data}))
    + "</dt><dd>"
    + escapeExpression(((stack1 = (depth0 && depth0.email)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n    </dl>\n\n    <button id=\"AccountPwd\" class=\"link-style\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_CHANGE_PASSWORD", {hash:{},data:data}))
    + "</button>\n    <div id=\"AccountPwdWrap\">\n\n      <dl class=\"dl-horizontal\">\n        <dt>"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_CURRENT_PASSWORD", {hash:{},data:data}))
    + "</dt>\n        <dd><input type=\"password\" class=\"input\" id=\"AccountCurrentPwd\" /></dd>\n\n        <dt>"
    + escapeExpression(helpers.i18n.call(depth0, "HAED_LABEL_NEW_PASSWORD", {hash:{},data:data}))
    + "</dt>\n        <dd><input type=\"password\" class=\"input\" id=\"AccountNewPwd\" /></dd>\n      </dl>\n\n      <div id=\"AccountInfo\" class=\"empty-hide\"></div>\n\n      <div id=\"AccountPwdBtns\">\n        <button class=\"btn btn-blue\" id=\"AccountUpdatePwd\" disabled>"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_BTN_UPDATE", {hash:{},data:data}))
    + "</button>\n        <span id=\"AccountCancelPwd\" class=\"link-style\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_BTN_CANCEL", {hash:{},data:data}))
    + "</span>\n      </div>\n    </div>\n  </section>\n\n  <section id=\"CredentialTab\">\n    <div id=\"CredDemoWrap\" ";
  stack1 = helpers.unless.call(depth0, (depth0 && depth0.account), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n      <h3>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_DEMO_TIT", {hash:{},data:data}))
    + "</h3>\n      <p>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_DEMO_TEXT", {hash:{},data:data}))
    + "</p>\n      <p class=\"tac\"><button class=\"btn btn-blue cred-setup\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_DEMO_SETUP", {hash:{},data:data}))
    + "</button></p>\n    </div>\n\n    <div id=\"CredAwsWrap\" class=\"pos-r\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.account), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n      <h3>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_CONNECTED_TIT", {hash:{},data:data}))
    + "</h3>\n      <button class=\"cred-setup link-style\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCOUNT_UPDATE", {hash:{},data:data}))
    + "</button>\n      <dl class=\"dl-horizontal cred-setup-msg\" style=\"margin-top:15px;\">\n        <dt>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCOUNTID", {hash:{},data:data}))
    + "</dt><dd>"
    + escapeExpression(((stack1 = (depth0 && depth0.account)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n        <dt>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCESSKEY", {hash:{},data:data}))
    + "</dt><dd>"
    + escapeExpression(((stack1 = (depth0 && depth0.awsAccessKey)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n        <dt>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_SECRETKEY", {hash:{},data:data}))
    + "</dt><dd>"
    + escapeExpression(((stack1 = (depth0 && depth0.awsSecretKey)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</dd>\n      </dl>\n    </div>\n\n    <div id=\"CredSetupWrap\">\n      <div id=\"CredSetupMsg\" class=\"cred-setup-msg empty-hide\"></div>\n      <ul>\n        <li>\n          <i class=\"icon-info icon-label tooltip\" data-tooltip=\""
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_TIP_CRED_ACCOUNTID", {hash:{},data:data}))
    + "\"></i>\n          <label>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCOUNTID", {hash:{},data:data}))
    + "</label>\n          <input autocomplete=\"off\" class=\"input\" id=\"CredSetupAccount\" type=\"text\" value=\""
    + escapeExpression(((stack1 = (depth0 && depth0.account)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n        </li>\n        <li>\n          <i class=\"icon-info icon-label tooltip\" data-tooltip=\""
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_TIP_CRED_ACCESSKEY", {hash:{},data:data}))
    + "\"></i>\n          <label>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCESSKEY", {hash:{},data:data}))
    + "</label>\n          <input autocomplete=\"off\" class=\"input\" id=\"CredSetupAccessKey\" type=\"text\" placeholder=\""
    + escapeExpression(((stack1 = (depth0 && depth0.awsAccessKey)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n        </li>\n        <li>\n          <i class=\"icon-info icon-label tooltip\" data-tooltip=\""
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_TIP_CRED_SECRETKEY", {hash:{},data:data}))
    + "\"></i>\n          <label>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_SECRETKEY", {hash:{},data:data}))
    + "</label>\n          <input autocomplete=\"off\" class=\"input\" id=\"CredSetupSecretKey\" type=\"password\" placeholder=\""
    + escapeExpression(((stack1 = (depth0 && depth0.awsSecretKey)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n        </li>\n      </ul>\n\n      <div class=\"cred-btn-wrap clearfix\">\n        ";
  stack1 = helpers.unless.call(depth0, (depth0 && depth0.credNeeded), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        <button class=\"right link-style cred-setup-cancel\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCOUNT_CANCEL", {hash:{},data:data}))
    + "</button>\n        <button id=\"CredSetupSubmit\" class=\"btn btn-blue right\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_BTN_SUBMIT", {hash:{},data:data}))
    + "</button>\n      </div>\n\n    </div>\n\n    <div id=\"CredRemoveWrap\">\n      <h3>"
    + escapeExpression(((stack1 = (depth0 && depth0.credRemoveTitle)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h3>\n      <div>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_REMOVE_TEXT", {hash:{},data:data}))
    + "</div>\n      <div class=\"cred-btn-wrap clearfix\">\n        <button class=\"right link-style cred-cancel\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCOUNT_CANCEL", {hash:{},data:data}))
    + "</button>\n        <button id=\"CredRemoveConfirm\" class=\"btn btn-red right\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_REMOVE_CREDENTIAL", {hash:{},data:data}))
    + "</button>\n      </div>\n    </div>\n\n    <div id=\"CredConfirmWrap\">\n      <h3>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_UPDATE_CONFIRM_TIT", {hash:{},data:data}))
    + "</h3>\n      <div>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_UPDATE_CONFIRM_TEXT", {hash:{},data:data}))
    + "</div>\n      <div class=\"cred-btn-wrap clearfix\">\n        <button class=\"right link-style cred-cancel\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCOUNT_CANCEL", {hash:{},data:data}))
    + "</button>\n        <button id=\"CredSetupConfirm\" class=\"btn btn-red right\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_UPDATE_CONFIRM", {hash:{},data:data}))
    + "</button>\n      </div>\n    </div>\n\n    <div id=\"CredRemoving\"><p>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_REMOVING", {hash:{},data:data}))
    + "</p><div class=\"loading-spinner\"></div></div>\n    <div id=\"CredUpdating\"><p>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_UPDATING", {hash:{},data:data}))
    + "</p><div class=\"loading-spinner\"></div></div>\n\n  </section>\n\n  <section id=\"TokenTab\">\n    <div id=\"TokenManager\">\n      <p class=\"clearfix\"> <button class=\"btn btn-blue right\" id=\"TokenCreate\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_BTN_TOKEN_CREATE", {hash:{},data:data}))
    + "</button>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_INFO_TOKEN", {hash:{},data:data}))
    + "<a href=\"http://docs.visualops.io/source/reference/ide.html#3-4-5-github-service\" target=\"_blank\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_INFO_TOKEN_LINK", {hash:{},data:data}))
    + "</a> </p>\n      <section class=\"token-table\">\n        <header class=\"clearfix\">\n          <span class=\"tokenName\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_TOKENTABLE_NAME", {hash:{},data:data}))
    + "</span>\n          <span class=\"tokenToken\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_TOKENTABLE_TOKEN", {hash:{},data:data}))
    + "</span>\n        </header>\n        <div class=\"scroll-wrap\">\n          <div class=\"scrollbar-veritical-wrap\"><div class=\"scrollbar-veritical-thumb\"></div></div>\n          <ul id=\"TokenList\" class=\"scroll-content\" data-empty=\""
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_INFO_TOKEN_EMPTY", {hash:{},data:data}))
    + "\"></ul>\n        </div>\n      </section>\n    </div>\n    <div id=\"TokenRmConfirm\" class=\"hide\">\n      <h3 id=\"TokenRmTit\"></h3>\n      <p>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CONFIRM_TOKEN_RM", {hash:{},data:data}))
    + "</p>\n      <div class=\"cred-btn-wrap clearfix\">\n        <button class=\"right link-style\" id=\"TokenRmCancel\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCOUNT_CANCEL", {hash:{},data:data}))
    + "</button>\n        <button id=\"TokenRemove\" class=\"btn btn-red right\">"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_BTN_TOKEN_REMOVE", {hash:{},data:data}))
    + "</button>\n      </div>\n    </div>\n  </section>\n</div>";
  return buffer;
  }; return Handlebars.template(TEMPLATE); });
(function() {
  define('ide/subviews/SettingsDialog',["./SettingsDialogTpl", 'i18n!/nls/lang.js', "ApiRequest", "backbone"], function(SettingsTpl, lang, ApiRequest) {
    var SettingsDialog;
    SettingsDialog = Backbone.View.extend({
      events: {
        "click #SettingsNav span": "switchTab",
        "click #AccountPwd": "showPwd",
        "click #AccountCancelPwd": "hidePwd",
        "click #AccountUpdatePwd": "changePwd",
        "click .cred-setup, .cred-cancel": "showCredSetup",
        "click .cred-setup-cancel": "cancelCredSetup",
        "click #CredSetupRemove": "showRemoveCred",
        "click #CredRemoveConfirm": "removeCred",
        "click #CredSetupSubmit": "submitCred",
        "click #CredSetupConfirm": "confirmCred",
        "click #TokenCreate": "createToken",
        "click .tokenControl .icon-edit": "editToken",
        "click .tokenControl .icon-delete": "removeToken",
        "click .tokenControl .tokenDone": "doneEditToken",
        "click #TokenRemove": "confirmRmToken",
        "click #TokenRmCancel": "cancelRmToken",
        "keyup  #CredSetupAccount, #CredSetupAccessKey, #CredSetupSecretKey": "updateSubmitBtn",
        "change #CredSetupAccount, #CredSetupAccessKey, #CredSetupSecretKey": "updateSubmitBtn",
        "change #AccountCurrentPwd, #AccountNewPwd": "updatePwdBtn",
        "keyup  #AccountCurrentPwd, #AccountNewPwd": "updatePwdBtn"
      },
      initialize: function(options) {
        var attributes, tab;
        attributes = {
          username: App.user.get("username"),
          email: App.user.get("email"),
          account: App.user.get("account"),
          awsAccessKey: App.user.get("awsAccessKey"),
          awsSecretKey: App.user.get("awsSecretKey"),
          credRemoveTitle: sprintf(lang.ide.SETTINGS_CRED_REMOVE_TIT, App.user.get("username")),
          credNeeded: !!App.model.appList().length
        };
        modal(SettingsTpl(attributes));
        this.setElement($("#modal-box"));
        tab = 0;
        if (options) {
          tab = options.defaultTab || 0;
          if (tab === SettingsDialog.TAB.CredentialInvalid) {
            this.showCredSetup();
            $(".modal-close").hide();
            $("#CredSetupMsg").text(lang.ide.SETTINGS_ERR_CRED_VALIDATE);
          }
          if (tab < 0) {
            tab = Math.abs(tab);
          }
        }
        $("#SettingsNav").children().eq(tab).click();
        this.updateTokenTab();
      },
      updateCredSettings: function() {
        var attributes;
        attributes = {
          username: App.user.get("username"),
          email: App.user.get("email"),
          account: App.user.get("account"),
          awsAccessKey: App.user.get("awsAccessKey"),
          awsSecretKey: App.user.get("awsSecretKey"),
          credRemoveTitle: sprintf(lang.ide.SETTINGS_CRED_REMOVE_TIT, App.user.get("username"))
        };
        $("#modal-box").html(SettingsTpl(attributes));
        return $("#SettingsNav").children().eq(SettingsDialog.TAB.Credential).click();
      },
      switchTab: function(evt) {
        var $this;
        $this = $(evt.currentTarget);
        if ($this.hasClass("selected")) {
          return;
        }
        $("#SettingsBody").children().hide();
        $("#SettingsNav").children().removeClass("selected");
        $("#" + $this.addClass("selected").attr("data-target")).show();
      },
      showPwd: function() {
        $("#AccountPwd").hide();
        $("#AccountPwdWrap").show();
        $("#AccountCurrentPwd").focus();
      },
      hidePwd: function() {
        $("#AccountPwd").show();
        $("#AccountPwdWrap").hide();
        $("#AccountCurrentPwd, #AccountNewPwd").val("");
        $("#AccountInfo").empty();
      },
      updatePwdBtn: function() {
        var new_pwd, old_pwd;
        old_pwd = $("#AccountCurrentPwd").val() || "";
        new_pwd = $("#AccountNewPwd").val() || "";
        if (old_pwd.length && new_pwd.length) {
          $("#AccountUpdatePwd").removeAttr("disabled");
        } else {
          $("#AccountUpdatePwd").attr("disabled", "disabled");
        }
      },
      changePwd: function() {
        var new_pwd, old_pwd;
        old_pwd = $("#AccountCurrentPwd").val() || "";
        new_pwd = $("#AccountNewPwd").val() || "";
        if (new_pwd.length < 6) {
          $('#AccountInfo').text(lang.ide.SETTINGS_ERR_INVALID_PWD);
          return;
        }
        $("#AccountInfo").empty();
        $("#AccountUpdatePwd").attr("disabled", "disabled");
        App.user.changePassword(old_pwd, new_pwd).then(function() {
          notification('info', lang.ide.SETTINGS_UPDATE_PWD_SUCCESS);
          $("#AccountCancelPwd").click();
          $("#AccountUpdatePwd").removeAttr("disabled");
        }, function(err) {
          if (err.error === 2) {
            $('#AccountInfo').html("" + lang.ide.SETTINGS_ERR_WRONG_PWD + " <a href='/reset/' target='_blank'>" + lang.ide.SETTINGS_INFO_FORGET_PWD + "</a>");
          } else {
            $('#AccountInfo').text(lang.ide.SETTINGS_UPDATE_PWD_FAILURE);
          }
          return $("#AccountUpdatePwd").removeAttr("disabled");
        });
      },
      showCredSetup: function() {
        $("#CredentialTab").children().hide();
        $("#CredSetupWrap").show();
        $("#CredSetupAccount").focus()[0].select();
        $("#CredSetupRemove").toggle(App.user.hasCredential());
        this.updateSubmitBtn();
      },
      cancelCredSetup: function() {
        $("#CredentialTab").children().hide();
        if (App.user.hasCredential()) {
          $("#CredAwsWrap").show();
        } else {
          $("#CredDemoWrap").show();
        }
      },
      showRemoveCred: function() {
        $("#CredentialTab").children().hide();
        $("#CredRemoveWrap").show();
      },
      removeCred: function() {
        var self;
        $("#CredentialTab").children().hide();
        $("#CredRemoving").show();
        $("#modal-box .modal-close").hide();
        self = this;
        App.user.changeCredential().then(function() {
          self.updateCredSettings();
        }, function() {
          $("#CredSetupMsg").text(lang.ide.SETTINGS_ERR_CRED_REMOVE);
          $("#modal-box .modal-close").show();
          return self.showCredSetup();
        });
      },
      updateSubmitBtn: function() {
        var accesskey, account, privatekey;
        account = $("#CredSetupAccount").val();
        accesskey = $("#CredSetupAccessKey").val();
        privatekey = $("#CredSetupSecretKey").val();
        if (account.length && accesskey.length && privatekey.length) {
          $("#CredSetupSubmit").removeAttr("disabled");
        } else {
          $("#CredSetupSubmit").attr("disabled", "disabled");
        }
      },
      submitCred: function() {
        var accesskey, privatekey, self;
        $("#CredentialTab").children().hide();
        $("#CredUpdating").show();
        $("#modal-box .modal-close").hide();
        accesskey = $("#CredSetupAccessKey").val();
        privatekey = $("#CredSetupSecretKey").val();
        self = this;
        return App.user.validateCredential(accesskey, privatekey).then(function() {
          self.setCred();
        }, function() {
          $("#CredSetupMsg").text(lang.ide.SETTINGS_ERR_CRED_VALIDATE);
          $("#modal-box .modal-close").show();
          self.showCredSetup();
        });
      },
      setCred: function() {
        var accesskey, account, privatekey, self;
        account = $("#CredSetupAccount").val();
        accesskey = $("#CredSetupAccessKey").val();
        privatekey = $("#CredSetupSecretKey").val();
        if (account === "demo_account") {
          account = "user_demo_account";
          $("#CredSetupAccount").val(account);
        }
        self = this;
        return App.user.changeCredential(account, accesskey, privatekey, false).then(function() {
          return self.updateCredSettings();
        }, function(err) {
          if (err.error === ApiRequest.Errors.ChangeCredConfirm) {
            self.showCredConfirm();
          } else {
            self.showCredUpdateFail();
          }
        });
      },
      showCredUpdateFail: function() {
        $("#CredSetupMsg").text(lang.ide.SETTINGS_ERR_CRED_UPDATE);
        $("#modal-box .modal-close").show();
        return this.showCredSetup();
      },
      showCredConfirm: function() {
        $("#CredentialTab").children().hide();
        $("#CredConfirmWrap").show();
        return $("#modal-box .modal-close").show();
      },
      confirmCred: function() {
        var accesskey, account, privatekey, self;
        account = $("#CredSetupAccount").val();
        accesskey = $("#CredSetupAccessKey").val();
        privatekey = $("#CredSetupSecretKey").val();
        self = this;
        App.user.changeCredential(account, accesskey, privatekey, true).then(function() {
          return self.updateCredSettings();
        }, function() {
          return self.showCredUpdateFail();
        });
      },
      editToken: function(evt) {
        var $p, $t;
        $t = $(evt.currentTarget);
        $p = $t.closest("li").toggleClass("editing", true);
        $p.children(".tokenName").removeAttr("readonly").focus().select();
      },
      removeToken: function(evt) {
        var $p, name;
        $p = $(evt.currentTarget).closest("li");
        name = $p.children(".tokenName").val();
        this.rmToken = $p.children(".tokenToken").text();
        $("#TokenManager").hide();
        $("#TokenRmConfirm").show();
        $("#TokenRmTit").text(sprintf(lang.ide.SETTINGS_CONFIRM_TOKEN_RM_TIT, name));
      },
      createToken: function() {
        var self;
        $("#TokenCreate").attr("disabled", "disabled");
        self = this;
        App.user.createToken().then(function() {
          self.updateTokenTab();
          return $("#TokenCreate").removeAttr("disabled");
        }, function() {
          notification("error", "Fail to create token, please retry.");
          return $("#TokenCreate").removeAttr("disabled");
        });
      },
      doneEditToken: function(evt) {
        var $p, duplicate, newTokenName, oldName, t, token, _i, _len, _ref;
        $p = $(evt.currentTarget).closest("li").removeClass("editing");
        $p.children(".tokenName").attr("readonly", true);
        token = $p.children(".tokenToken").text();
        newTokenName = $p.children(".tokenName").val();
        _ref = App.user.get("tokens");
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
          if (t.token === token) {
            oldName = t.name;
          } else if (t.name === newTokenName) {
            duplicate = true;
          }
        }
        if (!newTokenName || duplicate) {
          $p.children(".tokenName").val(oldName);
          return;
        }
        App.user.updateToken(token, newTokenName).fail(function() {
          oldName = "";
          $p.children(".tokenName").val(oldName);
          return notification("error", "Fail to update token, please retry.");
        });
      },
      confirmRmToken: function() {
        var self;
        $("#TokenRemove").attr("disabled", "disabled");
        self = this;
        App.user.removeToken(this.rmToken).then(function() {
          self.updateTokenTab();
          return self.cancelRmToken();
        }, function() {
          notification("Fail to delete token, please retry.");
          return self.cancelRmToken();
        });
      },
      cancelRmToken: function() {
        this.rmToken = "";
        $("#TokenRemove").removeAttr("disabled");
        $("#TokenManager").show();
        $("#TokenRmConfirm").hide();
      },
      updateTokenTab: function() {
        var tokens;
        tokens = App.user.get("tokens");
        $("#TokenManager").find(".token-table").toggleClass("empty", tokens.length === 0);
        if (tokens.length) {
          $("#TokenList").html(MC.template.accessTokenTable(tokens));
        } else {
          $("#TokenList").empty();
        }
      }
    });
    SettingsDialog.TAB = {
      CredentialInvalid: -1,
      Normal: 0,
      Credential: 1,
      Token: 2
    };
    return SettingsDialog;
  });

}).call(this);

(function() {
  define('ide/subviews/HeaderView',["./HeaderTpl", "./SettingsDialog", 'backbone', "UI.selectbox"], function(tmpl, SettingsDialog) {
    var HeaderView;
    HeaderView = Backbone.View.extend({
      events: {
        'click #HeaderLogout': 'logout',
        'click #HeaderSettings': 'settings',
        'click #HeaderShortcuts': 'shortcuts',
        'DROPDOWN_CLOSE #HeaderNotification': 'dropdownClosed'
      },
      initialize: function() {
        this.listenTo(App.user, "change", this.update);
        this.listenTo(App.model, "change:notification", this.updateNotification);
        this.setElement($(tmpl(App.user.toJSON())).prependTo("#wrapper"));
      },
      logout: function() {
        return App.logout();
      },
      shortcuts: function() {
        return modal(MC.template.shortkey());
      },
      settings: function() {
        return new SettingsDialog();
      },
      update: function() {
        return $("#HeaderUser").data("tooltip", App.user.get("email")).children("span").text(App.user.get("username"));
      },
      setAlertCount: function(count) {
        return $('#NotificationCounter').text(count || "");
      },
      updateNotification: function() {
        var html, i, notification, unread_num, _i, _len;
        console.log("Notification Updated, Websocket isReady:", App.WS.isReady());
        notification = App.model.get("notification");
        html = "";
        unread_num = 0;
        for (_i = 0, _len = notification.length; _i < _len; _i++) {
          i = notification[_i];
          html += MC.template.headerNotifyItem(i);
          if (!i.readed) {
            unread_num++;
          }
        }
        this.setAlertCount(unread_num);
        $("#notification-panel-wrapper").find(".scroll-content").html(html);
        $("#notification-panel-wrapper").css("max-height", Math.ceil(window.innerHeight * 0.8));
        return null;
      },
      dropdownClosed: function() {
        $("#notification-panel-wrapper").find(".scroll-content").children().removeClass("unread");
        this.setAlertCount();
        App.model.markNotificationRead();
        return null;
      }
    });
    return HeaderView;
  });

}).call(this);

define('ide/subviews/WelcomeTpl',['handlebars'], function(Handlebars){ var TEMPLATE = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  var buffer = "";
  buffer += "\n    <p>"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_PROVIDE_CRED_DESC", {hash:{},data:data}))
    + "</p>\n  ";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <h2>"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_TIT", {hash:{},data:data}))
    + "<span>"
    + escapeExpression(((stack1 = (depth0 && depth0.username)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span></h2>\n    <p>"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_DESC", {hash:{},data:data}))
    + "</p>\n  ";
  return buffer;
  }

  buffer += "<section id=\"WelcomeSettings\">\n  <header>\n  ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.noWelcome), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </header>\n  <div id=\"CredSetupWrap\">\n    <div id=\"CredSetupMsg\" class=\"cred-setup-msg empty-hide\"></div>\n    <ul>\n      <li>\n        <i class=\"icon-info icon-label tooltip\" data-tooltip=\""
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_TIP_CRED_ACCOUNTID", {hash:{},data:data}))
    + "\"></i>\n        <label>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCOUNTID", {hash:{},data:data}))
    + "</label>\n        <input autocomplete=\"off\" class=\"input\" id=\"CredSetupAccount\" type=\"text\">\n      </li>\n      <li>\n        <i class=\"icon-info icon-label tooltip\" data-tooltip=\""
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_TIP_CRED_ACCESSKEY", {hash:{},data:data}))
    + "\"></i>\n        <label>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_ACCESSKEY", {hash:{},data:data}))
    + "</label>\n        <input autocomplete=\"off\" class=\"input\" id=\"CredSetupAccessKey\" type=\"text\">\n      </li>\n      <li>\n        <i class=\"icon-info icon-label tooltip\" data-tooltip=\""
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_TIP_CRED_SECRETKEY", {hash:{},data:data}))
    + "\"></i>\n        <label>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_LABEL_SECRETKEY", {hash:{},data:data}))
    + "</label>\n        <input autocomplete=\"off\" class=\"input\" id=\"CredSetupSecretKey\" type=\"password\">\n      </li>\n    </ul>\n\n    <footer class=\"cred-btn-wrap clearfix tar\">\n      <button id=\"WelcomeSkip\" class=\"link-style\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_LABEL_ACCOUNT_SKIP", {hash:{},data:data}))
    + "</button>\n      <button id=\"CredSetupSubmit\" class=\"btn btn-blue\" disabled=\"disabled\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_BTN_SUBMIT", {hash:{},data:data}))
    + "</button>\n    </footer>\n  </div>\n</section>\n\n<section id=\"WelcomeCredUpdate\" class=\"hide\">\n  <p>"
    + escapeExpression(helpers.i18n.call(depth0, "SETTINGS_CRED_UPDATING", {hash:{},data:data}))
    + "</p>\n  <div class=\"loading-spinner\"></div>\n</section>\n\n<section id=\"WelcomeSkipWarning\" class=\"hide modal-body\">\n  <h3>"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_SKIP_TIT", {hash:{},data:data}))
    + "</h3>\n  <h5>"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_SKIP_SUBTIT", {hash:{},data:data}))
    + "</h5>\n  <p>"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_SKIP_MSG", {hash:{},data:data}))
    + "</p>\n  <p>"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_SKIP_MSG_EXTRA", {hash:{},data:data}))
    + "</p>\n  <footer class=\"cred-btn-wrap clearfix tar\">\n    <button id=\"WelcomeBack\" class=\"link-style\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_BTN_BACK", {hash:{},data:data}))
    + "</button>\n    <button id=\"WelcomeDone\" class=\"btn btn-blue\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_BTN_DONE", {hash:{},data:data}))
    + "</button>\n  </footer>\n</section>\n\n<section id=\"WelcomeDoneWrap\" class=\"hide\">\n  <p id=\"WelcomeDoneTitDemo\">"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_DONE_HINT_DEMO", {hash:{},data:data}))
    + "</p>\n  <p id=\"WelcomeDoneTit\">"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_DONE_HINT", {hash:{},data:data}))
    + " <span></span></p>\n  <h3>"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_DONE_TIT", {hash:{},data:data}))
    + "</h3>\n  <ul>"
    + escapeExpression(helpers.i18n.call(depth0, "WELCOME_DONE_MSG", {hash:{},data:data}))
    + "</ul>\n  <footer class=\"cred-btn-wrap clearfix tar\">\n    <button id=\"WelcomeClose\" class=\"btn btn-blue\">"
    + escapeExpression(helpers.i18n.call(depth0, "HEAD_BTN_DONE", {hash:{},data:data}))
    + "</button>\n  </footer>\n</section>";
  return buffer;
  }; return Handlebars.template(TEMPLATE); });
(function() {
  define('ide/subviews/WelcomeDialog',["./WelcomeTpl", "UI.modalplus", 'i18n!/nls/lang.js', "backbone"], function(WelcomeTpl, Modal, lang) {
    var WelcomeDialog;
    WelcomeDialog = Backbone.View.extend({
      events: {
        "click #WelcomeSkip": "skip",
        "click #WelcomeBack": "back",
        "click #WelcomeDone": "skipDone",
        "click #WelcomeClose": "close",
        "click #CredSetupSubmit": "submitCred",
        "keyup #CredSetupAccount, #CredSetupAccessKey, #CredSetupSecretKey": "updateSubmitBtn"
      },
      initialize: function(options) {
        var attributes, title;
        attributes = {
          username: App.user.get("username")
        };
        if (options && options.askForCredential) {
          title = lang.ide.WELCOME_PROVIDE_CRED_TIT;
          attributes.noWelcome = true;
        } else {
          title = lang.ide.WELCOME_DIALOG_TIT;
        }
        this.modal = new Modal({
          title: title,
          template: WelcomeTpl(attributes),
          width: "600",
          disableClose: true,
          disableFooter: true,
          compact: true,
          hideClose: true,
          cancel: {
            hide: true
          }
        });
        this.modal.tpl.find(".context-wrap").attr("id", "WelcomeDialog");
        this.setElement(this.modal.tpl);
      },
      skip: function() {
        $("#WelcomeSettings").hide();
        return $("#WelcomeSkipWarning").show();
      },
      back: function() {
        $("#WelcomeSettings").show();
        return $("#WelcomeSkipWarning").hide();
      },
      skipDone: function() {
        if (!App.user.hasCredential()) {
          this.done();
          return;
        }
        $("#CredSetupAccount").val("");
        $("#CredSetupAccessKey").val("");
        $("#CredSetupSecretKey").val("");
        $("#WelcomeSkipWarning").hide();
        $("#WelcomeCredUpdate").show();
        this.setCred();
      },
      done: function() {
        $("#WelcomeSettings, #WelcomeSkipWarning, #WelcomeCredUpdate").hide();
        $("#WelcomeDoneWrap").show();
        if (App.user.hasCredential()) {
          $("#WelcomeDoneTitDemo").hide();
          return $("#WelcomeDoneTit").children("span").text(App.user.get("account"));
        } else {
          $("#WelcomeDoneTitDemo").show();
          return $("#WelcomeDoneTit").hide();
        }
      },
      close: function() {
        return this.modal.close();
      },
      updateSubmitBtn: function() {
        var accesskey, account, privatekey;
        account = $("#CredSetupAccount").val();
        accesskey = $("#CredSetupAccessKey").val();
        privatekey = $("#CredSetupSecretKey").val();
        if (account.length && accesskey.length && privatekey.length) {
          $("#CredSetupSubmit").removeAttr("disabled");
        } else {
          $("#CredSetupSubmit").attr("disabled", "disabled");
        }
      },
      submitCred: function() {
        var accesskey, privatekey, self;
        $("#WelcomeSettings").hide();
        $("#WelcomeCredUpdate").show();
        accesskey = $("#CredSetupAccessKey").val();
        privatekey = $("#CredSetupSecretKey").val();
        self = this;
        return App.user.validateCredential(accesskey, privatekey).then(function() {
          self.setCred();
        }, function() {
          $("#CredSetupMsg").text(lang.ide.SETTINGS_ERR_CRED_VALIDATE);
          self.showCredSetup();
        });
      },
      setCred: function() {
        var accesskey, account, privatekey, self;
        account = $("#CredSetupAccount").val();
        accesskey = $("#CredSetupAccessKey").val();
        privatekey = $("#CredSetupSecretKey").val();
        if (account === "demo_account") {
          account = "user_demo_account";
          $("#CredSetupAccount").val(account);
        }
        self = this;
        return App.user.changeCredential(account, accesskey, privatekey, true).then(function() {
          self.done();
        }, function(err) {
          $("#CredSetupMsg").text(lang.ide.SETTINGS_ERR_CRED_UPDATE);
          self.showCredSetup();
        });
      },
      showCredSetup: function() {
        $("#WelcomeDialog").children().hide();
        $("#WelcomeSettings").show();
        $("#CredSetupAccount").focus()[0].select();
        this.updateSubmitBtn();
      }
    });
    return WelcomeDialog;
  });

}).call(this);

define('ide/subviews/NavigationTpl',['handlebars'], function(Handlebars){ var __TEMPLATE__, TEMPLATE={};

__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", escapeExpression=this.escapeExpression;


  buffer += "<aside id=\"navigation\">\n  <nav>\n    <button class=\"off-canvas-tab\" id=\"off-canvas-app\">"
    + escapeExpression(helpers.i18n.call(depth0, "NAV_TIT_APPS", {hash:{},data:data}))
    + "</button>\n    <button class=\"off-canvas-tab selected\" id=\"off-canvas-stack\">"
    + escapeExpression(helpers.i18n.call(depth0, "NAV_TIT_STACKS", {hash:{},data:data}))
    + "</button>\n  </nav>\n\n  <section class=\"scroll-wrap\">\n    <div class=\"scrollbar-veritical-wrap\"><div class=\"scrollbar-veritical-thumb\"></div></div>\n    <div class=\"scroll-content\">\n      <ul class=\"scroll-content hide\" id=\"nav-app-region\"></ul>\n      <div class=\"scroll-content\" id=\"nav-stack\">\n        <ul id=\"nav-stack-region\"></ul>\n        <div id=\"nav-show-empty\">Show unused regions</div>\n        <ul id=\"nav-region-empty-list\" class=\"hide\"></ul>\n      </div>\n    </div>\n  </section>\n</aside>\n<button id=\"off-canvas-menu\" class=\"icon-menu\"></button>\n<div id=\"off-canvas-overlay\"></div>";
  return buffer;
  };
TEMPLATE.navigation=Handlebars.template(__TEMPLATE__);


__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<li data-region=\""
    + escapeExpression(((stack1 = (depth0 && depth0.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n	<h3 class=\"nav-group-title\">"
    + escapeExpression(((stack1 = (depth0 && depth0.regionName)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.data)),stack1 == null || stack1 === false ? stack1 : stack1.length)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</h3>\n	<ul class=\"nav-item-list app-list\">\n	";
  stack1 = helpers.each.call(depth0, (depth0 && depth0.data), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ul>\n</li>";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<li data-id=\""
    + escapeExpression(((stack1 = (depth0 && depth0.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" class=\"truncate nav-truncate icon-app-";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.progressing), {hash:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" title=\""
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ["
    + escapeExpression(((stack1 = (depth0 && depth0.stateDesc)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "]\">"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.usage), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</li>";
  return buffer;
  }
function program3(depth0,data) {
  
  
  return "pending";
  }

function program5(depth0,data) {
  
  
  return escapeExpression(helpers.tolower.call(depth0, (depth0 && depth0.stateDesc), {hash:{},data:data}));
  }

function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<i class=\"icon-app-type-"
    + escapeExpression(((stack1 = (depth0 && depth0.usage)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></i>";
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = "";
  buffer += "\n<div class=\"nav-empty\">"
    + escapeExpression(helpers.i18n.call(depth0, "DASH_LBL_NO_APP", {hash:{},data:data}))
    + "</div>\n";
  return buffer;
  }

  stack1 = helpers.each.call(depth0, depth0, {hash:{},inverse:self.program(9, program9, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  };
TEMPLATE.applist=Handlebars.template(__TEMPLATE__);


__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var stack1;
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.data)),stack1 == null || stack1 === false ? stack1 : stack1.length), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<li data-region=\""
    + escapeExpression(((stack1 = (depth0 && depth0.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n	<h3 class=\"nav-group-title\">"
    + escapeExpression(((stack1 = (depth0 && depth0.regionName)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.data)),stack1 == null || stack1 === false ? stack1 : stack1.length)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")<button class=\"icon-new-stack tooltip\" data-tooltip='"
    + escapeExpression(helpers.i18n.call(depth0, "IDE_COM_CREATE_NEW_STACK", {hash:{},data:data}))
    + "'></button></h3>\n	<ul class=\"nav-item-list stack-list\">\n	";
  stack1 = helpers.each.call(depth0, (depth0 && depth0.data), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</ul>\n</li>";
  return buffer;
  }
function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<li data-id=\""
    + escapeExpression(((stack1 = (depth0 && depth0.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" class=\"truncate nav-truncate icon-stack-nav\">"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</li>";
  return buffer;
  }

  stack1 = helpers.each.call(depth0, depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  };
TEMPLATE.stacklist=Handlebars.template(__TEMPLATE__);


__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var stack1;
  stack1 = helpers.unless.call(depth0, ((stack1 = (depth0 && depth0.data)),stack1 == null || stack1 === false ? stack1 : stack1.length), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<li class=\"nav-group-title\" data-region=\""
    + escapeExpression(((stack1 = (depth0 && depth0.region)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = (depth0 && depth0.regionName)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " (0) <button class=\"icon-new-stack tooltip\" data-tooltip='"
    + escapeExpression(helpers.i18n.call(depth0, "IDE_COM_CREATE_NEW_STACK", {hash:{},data:data}))
    + "'></button></li>";
  return buffer;
  }

  stack1 = helpers.each.call(depth0, depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  };
TEMPLATE.regionlist=Handlebars.template(__TEMPLATE__);


return TEMPLATE; });
(function() {
  define('ide/subviews/Navigation',["./NavigationTpl", 'backbone'], function(NavPartsTpl) {
    return Backbone.View.extend({
      events: {
        "click #off-canvas-app": "showNavApp",
        "click #off-canvas-stack": "showNavStack",
        'click .stack-list li, .app-list li': 'openOps',
        'click #nav-show-empty': 'showEmptyRegion',
        'click .icon-new-stack': 'createStack'
      },
      initialize: function() {
        this.setElement($(NavPartsTpl.navigation()).appendTo("#wrapper").eq(0));
        $("#off-canvas-menu").click(_.bind(this.showOffCanvas, this));
        $("#off-canvas-overlay").click(_.bind(this.hideOffCanvas, this));
        this.updateStackList();
        this.updateAppList();
        this.listenTo(App.model.stackList(), "update", function() {
          if (this.showing) {
            this.updateStackList();
          } else {
            this.stackDirty = true;
          }
        });
        this.listenTo(App.model.appList(), "update change:state", function() {
          console.log("Navigation updated due to appList update", arguments);
          if (this.showing) {
            this.updateAppList();
          } else {
            this.appDirty = true;
          }
        });
      },
      showOffCanvas: function() {
        if ($("#wrapper").hasClass("off-canvas")) {
          return $("wrapper").removeClass("off-canvas");
        }
        if (this.stackDirty) {
          this.updateStackList();
        }
        if (this.appDirty) {
          this.updateAppList();
        }
        this.showing = true;
        this.stackDirty = this.appDirty = false;
        if ($("#nav-app-region").children(".nav-empty").length) {
          this.showNavStack();
        } else {
          this.showNavApp();
        }
        $("#wrapper").addClass("off-canvas");
      },
      hideOffCanvas: function() {
        $("#wrapper").removeClass("off-canvas");
        return this.showing = false;
      },
      showNavApp: function() {
        $("#nav-app-region").show();
        $("#nav-stack").hide();
        $("#off-canvas-app").toggleClass("selected", true);
        $("#off-canvas-stack").toggleClass("selected", false);
      },
      showNavStack: function() {
        $("#nav-app-region").hide();
        $("#nav-stack").show();
        $("#off-canvas-app").toggleClass("selected", false);
        $("#off-canvas-stack").toggleClass("selected", true);
      },
      showEmptyRegion: function() {
        $("#nav-show-empty").hide();
        $("#nav-region-empty-list").show();
      },
      updateStackList: function() {
        var list;
        list = App.model.stackList().groupByRegion(true);
        $('#nav-stack-region').html($.trim(NavPartsTpl.stacklist(list)));
        return $('#nav-region-empty-list').html(NavPartsTpl.regionlist(list));
      },
      updateAppList: function() {
        return $('#nav-app-region').html(NavPartsTpl.applist(App.model.appList().groupByRegion()));
      },
      openOps: function(event) {
        this.hideOffCanvas();
        App.openOps($(event.currentTarget).attr("data-id"));
      },
      createStack: function(event) {
        var region;
        region = $(event.currentTarget).closest("li").attr("data-region");
        if (!region) {
          return;
        }
        this.hideOffCanvas();
        App.createOps(region);
      }
    });
  });

}).call(this);

define('ide/subviews/AppTpl',['handlebars'], function(Handlebars){ var __TEMPLATE__, TEMPLATE={};

__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, escapeExpression=this.escapeExpression, functionType="function";


  buffer += "<header class=\"modal-header\" style=\"width:390px;\"><h3>"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_TIP_DELETE_STACK", {hash:{},data:data}))
    + "</h3><i class=\"modal-close\">&times;</i></header>\n<div class=\"modal-body modal-text-wraper\" style=\"width:390px;\">\n  <div class=\"modal-center-align-helper\">\n      <div class=\"modal-text-major\">"
    + escapeExpression(((stack1 = (depth0 && depth0.msg)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n  </div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn modal-close btn-red\" id=\"confirmRmStack\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_DELETE_STACK", {hash:{},data:data}))
    + "</button>\n  <button class=\"btn modal-close btn-silver\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_CANCEL", {hash:{},data:data}))
    + "</button>\n</div>";
  return buffer;
  };
TEMPLATE.removeStackConfirm=Handlebars.template(__TEMPLATE__);


__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, escapeExpression=this.escapeExpression, functionType="function";


  buffer += "<header class=\"modal-header\" style=\"width:390px;\"><h3>"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_TIP_DUPLICATE_STACK", {hash:{},data:data}))
    + "</h3><i class=\"modal-close\">&times;</i></header>\n<div class=\"modal-body modal-text-wraper\" style=\"width:390px;\">\n  <div class=\"modal-center-align-helper\">\n    <div class=\"modal-control-group\">\n      <label class=\"modal-text-major\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BODY_DUPLICATE_STACK", {hash:{},data:data}))
    + "</label>\n      <input id=\"confirmDupStackIpt\" class=\"input\" type=\"text\" value=\""
    + escapeExpression(((stack1 = (depth0 && depth0.newName)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n    </div>\n  </div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn btn-red\" id=\"confirmDupStack\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_DUPLICATE_STACK", {hash:{},data:data}))
    + "</button>\n  <button class=\"btn modal-close btn-silver\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_CANCEL", {hash:{},data:data}))
    + "</button>\n</div>";
  return buffer;
  };
TEMPLATE.dupStackConfirm=Handlebars.template(__TEMPLATE__);


__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, escapeExpression=this.escapeExpression, functionType="function";


  buffer += "<header class=\"modal-header\" style=\"width:390px;\"><h3>"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_TIP_START_APP", {hash:{},data:data}))
    + "</h3><i class=\"modal-close\">&times;</i></header>\n<div class=\"modal-body modal-text-wraper\" style=\"width:390px;\">\n  <div class=\"modal-center-align-helper\">\n      <div class=\"modal-text-major\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BODY_START_APP_LEFT", {hash:{},data:data}))
    + " "
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BODY_START_APP_RIGHT", {hash:{},data:data}))
    + "</div>\n  </div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn modal-close btn-blue\" id=\"confirmStartApp\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_START_APP", {hash:{},data:data}))
    + "</button>\n  <button class=\"btn modal-close btn-silver\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_CANCEL", {hash:{},data:data}))
    + "</button>\n</div>";
  return buffer;
  };
TEMPLATE.startAppConfirm=Handlebars.template(__TEMPLATE__);


__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  
  return escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_TIT_STOP_PRD_APP", {hash:{},data:data}));
  }

function program3(depth0,data) {
  
  
  return escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_TIT_STOP_APP", {hash:{},data:data}));
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <div class=\"modal-body\" style=\"width:390px;\">\n    <p><b style=\"color:#ec3c38;\">"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(helpers.i18n.call(depth0, "POP_CONFIRM_PROD_APP_WARNING_MSG", {hash:{},data:data}))
    + "</b>"
    + escapeExpression(helpers.i18n.call(depth0, "POP_CONFIRM_STOP_PROD_APP_MSG", {hash:{},data:data}))
    + " "
    + escapeExpression(helpers.i18n.call(depth0, "POP_CONFIRM_STOP_ASG", {hash:{},data:data}))
    + "</p>\n    <p>"
    + escapeExpression(helpers.i18n.call(depth0, "POP_CONFIRM_STOP_PROD_APP_INPUT_LBL", {hash:{},data:data}))
    + "</p>\n    <div><input class=\"input\" style=\"width:351px;\" id=\"appNameConfirmIpt\"/></div>\n  </div>\n";
  return buffer;
  }

function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <div class=\"modal-body modal-text-wraper\" style=\"width:390px;\"> <div class=\"modal-center-align-helper\">\n    <div class=\"modal-text-major\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BODY_STOP_APP_LEFT", {hash:{},data:data}))
    + " "
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BODY_STOP_APP_RIGHT", {hash:{},data:data}))
    + "</div>\n  </div> </div>\n";
  return buffer;
  }

function program9(depth0,data) {
  
  
  return "disabled";
  }

  buffer += "<header class=\"modal-header\" style=\"width:390px;\"><h3>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.production), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</h3><i class=\"modal-close\">&times;</i></header>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.production), {hash:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<div class=\"modal-footer\">\n  <button class=\"btn modal-close btn-red\" id=\"confirmStopApp\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.production), {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_STOP_APP", {hash:{},data:data}))
    + "</button>\n  <button class=\"btn modal-close btn-silver\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_CANCEL", {hash:{},data:data}))
    + "</button>\n</div>";
  return buffer;
  };
TEMPLATE.stopAppConfirm=Handlebars.template(__TEMPLATE__);


__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  
  return escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_TIT_TERMINATE_PRD_APP", {hash:{},data:data}));
  }

function program3(depth0,data) {
  
  
  return escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_TIT_TERMINATE_APP", {hash:{},data:data}));
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <div class=\"modal-body\" style=\"width:390px;\">\n    <p><b style=\"color:#ec3c38;\">"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(helpers.i18n.call(depth0, "POP_CONFIRM_PROD_APP_WARNING_MSG", {hash:{},data:data}))
    + "</b>"
    + escapeExpression(helpers.i18n.call(depth0, "POP_CONFIRM_TERMINATE_PROD_APP_MSG", {hash:{},data:data}))
    + "</p>\n    <p>"
    + escapeExpression(helpers.i18n.call(depth0, "POP_CONFIRM_TERMINATE_PROD_APP_INPUT_LBL", {hash:{},data:data}))
    + "</p>\n    <div><input class=\"input\" style=\"width:351px;\" id=\"appNameConfirmIpt\"/></div>\n  </div>\n";
  return buffer;
  }

function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <div class=\"modal-body modal-text-wraper\" style=\"width:390px;\">\n    <div class=\"modal-center-align-helper\"> <div class=\"modal-text-major\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BODY_TERMINATE_APP_LEFT", {hash:{},data:data}))
    + " "
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BODY_TERMINATE_APP_RIGHT", {hash:{},data:data}))
    + "</div>\n  </div> </div>\n";
  return buffer;
  }

function program9(depth0,data) {
  
  
  return "disabled";
  }

  buffer += "<header class=\"modal-header\" style=\"width:390px;\"><h3>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.production), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</h3><i class=\"modal-close\">&times;</i></header>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.production), {hash:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<div class=\"modal-footer\">\n  <button id=\"appTerminateConfirm\" class=\"btn btn-red modal-close\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.production), {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_TERMINATE_APP", {hash:{},data:data}))
    + "</button>\n  <button class=\"btn modal-close btn-silver\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_CANCEL", {hash:{},data:data}))
    + "</button>\n</div>";
  return buffer;
  };
TEMPLATE.terminateAppConfirm=Handlebars.template(__TEMPLATE__);


__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<section class=\"disconnected-msg\">\n  <div>Connection lost. Attempting to reconnect…</div>\n  <div>Changes made now may not be saved.</div>\n</section>";
  };
TEMPLATE.disconnectedMsg=Handlebars.template(__TEMPLATE__);


__TEMPLATE__ =function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<header class=\"modal-header\" style=\"width:390px;\"><h3>Force to delete app</h3><i class=\"modal-close\">&times;</i></header>\n<div class=\"modal-body modal-text-wraper\" style=\"width:390px;\">\n  <div class=\"modal-center-align-helper\">\n      <div class=\"modal-text-major\">The app "
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " failed to terminate. Do you want to force deleting it? After force deleting it, you need to manually manage the resource in aws console.</div>\n  </div>\n</div>\n<div class=\"modal-footer\">\n  <button class=\"btn modal-close btn-red\" id=\"forceTerminateApp\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_DELETE_STACK", {hash:{},data:data}))
    + "</button>\n  <button class=\"btn modal-close btn-silver\">"
    + escapeExpression(helpers.i18n.call(depth0, "TOOL_POP_BTN_CANCEL", {hash:{},data:data}))
    + "</button>\n</div>";
  return buffer;
  };
TEMPLATE.forceTerminateApp=Handlebars.template(__TEMPLATE__);


return TEMPLATE; });

/*
----------------------------
  The View for application
----------------------------
 */

(function() {
  define('ide/ApplicationView',["backbone", "./subviews/SessionDialog", "./subviews/HeaderView", "./subviews/WelcomeDialog", "./subviews/SettingsDialog", "./subviews/Navigation", "./subviews/AppTpl", 'i18n!/nls/lang.js'], function(Backbone, SessionDialog, HeaderView, WelcomeDialog, SettingsDialog, Navigation, AppTpl, lang) {
    return Backbone.View.extend({
      el: $("body")[0],
      events: {
        "click .click-select": "selectText"
      },
      initialize: function() {
        this.header = new HeaderView();
        new Navigation();
        this.listenTo(App.user, "change:state", this.toggleWelcome);
        this.listenTo(App.model.appList(), "change:terminateFail", this.askForForceTerminate);

        /* env:dev                                                                           env:dev:end */

        /* env:debug */
        require(["./ide/subviews/DebugTool"], function(DT) {
          return new DT();
        });

        /* env:debug:end */
        $(window).on("beforeunload", this.checkUnload);
        $(document).on('keydown', this.globalKeyEvent);
      },
      checkUnload: function() {
        if (App.canQuit()) {
          return void 0;
        } else {
          return lang.ide.BEFOREUNLOAD_MESSAGE;
        }
      },
      globalKeyEvent: function(event) {
        var nodeName;
        nodeName = event.target.nodeName.toLowerCase();
        if (nodeName === "input" || nodeName === "textarea" || event.target.contentEditable === 'true') {
          return;
        }
        switch (event.which) {
          case 8:
            return false;
          case 191:
            modal(MC.template.shortkey(), true);
            return false;
        }
      },
      toggleWSStatus: function(isConnected) {
        if (isConnected) {
          return $(".disconnected-msg").remove();
        } else {
          if ($(".disconnected-msg").show().length > 0) {
            return;
          }
          return $(AppTpl.disconnectedMsg()).appendTo("body").on("mouseover", function() {
            $(".disconnected-msg").addClass("hovered");
            $("body").on("mousemove.disconnectedmsg", function(e) {
              var msg, pos, x, y;
              msg = $(".disconnected-msg");
              if (!msg.length) {
                $("body").off("mousemove.disconnectedmsg");
                return;
              }
              pos = msg.offset();
              x = e.pageX;
              y = e.pageY;
              if (x < pos.left || y < pos.top || x >= pos.left + msg.outerWidth() || y >= pos.top + msg.outerHeight()) {
                $("body").off("mousemove.disconnectedmsg");
                msg.removeClass("hovered");
              }
            });
          });
        }
      },
      toggleWelcome: function() {
        if (App.user.isFirstVisit()) {
          new WelcomeDialog();
        }
      },
      askForAwsCredential: function() {
        return new WelcomeDialog({
          askForCredential: true
        });
      },
      showSessionDialog: function() {
        return (new SessionDialog()).promise();
      },
      selectText: function(event) {
        var e, range;
        try {
          range = document.body.createTextRange();
          range.moveToElementText(event.currentTarget);
          range.select();
          console.warn("Select text by document.body.createTextRange");
        } catch (_error) {
          e = _error;
          if (window.getSelection) {
            range = document.createRange();
            range.selectNode(event.currentTarget);
            window.getSelection().addRange(range);
            console.warn("Select text by document.createRange");
          }
        }
        return false;
      },
      deleteStack: function(id, name) {
        name = name || App.model.stackList().get(id).get("name");
        modal(AppTpl.removeStackConfirm({
          msg: sprintf(lang.ide.TOOL_POP_BODY_DELETE_STACK, name)
        }));
        $("#confirmRmStack").on("click", function() {
          var opsModel, p;
          opsModel = App.model.stackList().get(id);
          p = opsModel.remove();
          if (opsModel.isPersisted()) {
            return p.then(function() {
              return notification("info", sprintf(lang.ide.TOOL_MSG_ERR_DEL_STACK_SUCCESS, name));
            }, function() {
              return notification("error", sprintf(lang.ide.TOOL_MSG_ERR_DEL_STACK_FAILED, name));
            });
          }
        });
      },
      duplicateStack: function(id) {
        var opsModel;
        opsModel = App.model.stackList().get(id);
        if (!opsModel) {
          return;
        }
        opsModel.fetchJsonData().then(function() {
          return App.openOps(App.model.createStackByJson(opsModel.getJsonData()));
        }, function() {
          return notification("error", "Cannot duplicate the stack, please retry.");
        });
      },
      startApp: function(id) {
        var name;
        name = App.model.appList().get(id).get("name");
        modal(AppTpl.startAppConfirm({
          name: name
        }));
        $("#confirmStartApp").on("click", function() {
          App.model.appList().get(id).start().fail(function(err) {
            var error;
            error = err.awsError ? err.error + "." + err.awsError : err.error;
            notification("Fail to start your app \"" + name + "\". (ErrorCode: " + error + ")");
          });
        });
      },
      stopApp: function(id) {
        var app, name;
        app = App.model.appList().get(id);
        name = app.get("name");
        modal(AppTpl.stopAppConfirm({
          name: name,
          production: app.get("usage") === "production"
        }));
        $("#confirmStopApp").on("click", function() {
          app.stop().fail(function(err) {
            var error;
            error = err.awsError ? err.error + "." + err.awsError : err.error;
            notification("Fail to stop your app \"" + name + "\". (ErrorCode: " + error + ")");
          });
        });
        $("#appNameConfirmIpt").on("keyup change", function() {
          if ($("#appNameConfirmIpt").val() === name) {
            $("#confirmStopApp").removeAttr("disabled");
          } else {
            $("#confirmStopApp").attr("disabled", "disabled");
          }
        });
      },
      terminateApp: function(id) {
        var app, name;
        app = App.model.appList().get(id);
        name = app.get("name");
        modal(AppTpl.terminateAppConfirm({
          name: name,
          production: app.get("usage") === "production"
        }));
        $("#appNameConfirmIpt").on("keyup change", function() {
          if ($("#appNameConfirmIpt").val() === name) {
            $("#appTerminateConfirm").removeAttr("disabled");
          } else {
            $("#appTerminateConfirm").attr("disabled", "disabled");
          }
        });
        $("#appTerminateConfirm").on("click", function() {
          app.terminate().fail(function(err) {
            var error;
            error = err.awsError ? err.error + "." + err.awsError : err.error;
            return notification("Fail to terminate your app \"" + name + "\". (ErrorCode: " + error + ")");
          });
        });
      },
      askForForceTerminate: function(model) {
        if (!model.get("terminateFail")) {
          return;
        }
        modal(AppTpl.forceTerminateApp({
          name: model.get("name")
        }));
        $("#forceTerminateApp").on("click", function() {
          model.terminate(true).fail(function(err) {
            var error;
            error = err.awsError ? err.error + "." + err.awsError : err.error;
            return notification("Fail to terminate your app \"" + name + "\". (ErrorCode: " + error + ")");
          });
        });
      }
    });
  });

}).call(this);


/*
----------------------------
  The Model for stack / app
----------------------------

  This model represent a stack or an app. It contains serveral methods to manipulate the stack / app
 */

(function() {
  define('OpsModel',["ApiRequest", "constant", "CloudResources", "ThumbnailUtil", "backbone"], function(ApiRequest, constant, CloudResources, ThumbUtil) {
    var OpsModel, OpsModelState, OpsModelStateDesc;
    OpsModelState = {
      UnRun: 0,
      Running: 1,
      Stopped: 2,
      Initializing: 3,
      Starting: 4,
      Updating: 5,
      Stopping: 6,
      Terminating: 7,
      Destroyed: 8,
      Saving: 9
    };
    OpsModelStateDesc = ["", "Running", "Stopped", "Starting", "Starting", "Updating", "Stopping", "Terminating", "", "Saving"];
    OpsModel = Backbone.Model.extend({
      defaults: function() {
        return {
          updateTime: +(new Date()),
          region: "",
          state: OpsModelState.UnRun,
          stoppable: true,
          name: ""
        };
      },
      initialize: function(attr, options) {
        if (options) {
          if (options.initJsonData) {
            this.__initJsonData();
          }
          if (options.jsonData) {
            this.__setJsonData(options.jsonData);
          }
        }

        /* env:dev                                                                                                                        env:dev:end */

        /* env:debug */
        this.listenTo(this, "change:state", function() {
          return console.log("OpsModel's state changed", this, MC.prettyStackTrace());
        });

        /* env:debug:end */
      },
      url: function() {
        if (this.get("id")) {
          return "ops/" + (this.get('id'));
        } else {
          return "ops/" + this.cid + "/unsaved";
        }
      },
      isStack: function() {
        return this.attributes.state === OpsModelState.UnRun;
      },
      isApp: function() {
        return this.attributes.state !== OpsModelState.UnRun;
      },
      isImported: function() {
        return !!this.attributes.importVpcId;
      },
      testState: function(state) {
        return this.attributes.state === state;
      },
      getStateDesc: function() {
        return OpsModelStateDesc[this.attributes.state];
      },
      toJSON: function(options) {
        var o;
        o = Backbone.Model.prototype.toJSON.call(this);
        o.stateDesc = OpsModelStateDesc[o.state];
        o.regionName = constant.REGION_SHORT_LABEL[o.region];
        if (this.isProcessing()) {
          o.progressing = true;
        }
        if (options) {
          if (options.thumbnail) {
            o.thumbnail = ThumbUtil.fetch(o.id);
          }
        }
        return o;
      },
      isPersisted: function() {
        return !!this.get("id");
      },
      isExisting: function() {
        var state;
        state = this.get("state");
        if (state === OpsModelState.Destroyed) {
          console.warn("There's probably a bug existing that the destroyed opsmodel is still be using by someone.");
        }
        return !!(this.get("id") && state !== OpsModelState.Destroyed);
      },
      getVpcId: function() {
        var comp, uid, _ref;
        if (this.get("importVpcId")) {
          return this.get("importVpcId");
        }
        if (!this.__jsonData) {
          return void 0;
        }
        _ref = this.__jsonData.component;
        for (uid in _ref) {
          comp = _ref[uid];
          if (comp.type === constant.RESTYPE.VPC) {
            return comp.resource.VpcId;
          }
        }
        return void 0;
      },
      getThumbnail: function() {
        return ThumbUtil.fetch(this.get("id"));
      },
      saveThumbnail: function(thumb) {
        if (thumb) {
          ThumbUtil.save(this.get("id"), thumb);
          this.trigger("change");
        } else {
          ThumbUtil.save(this.get("id"), "");
        }
      },
      hasJsonData: function() {
        return !!this.__jsonData;
      },
      getJsonData: function() {
        return this.__jsonData;
      },
      fetchJsonData: function() {
        var d, sampleId, self;
        if (this.__jsonData) {
          d = Q.defer();
          d.resolve(this);
          return d.promise;
        }
        self = this;
        if (this.get("sampleId")) {
          sampleId = this.get("sampleId");
          return ApiRequest('stackstore_fetch_stackstore', {
            sub_path: "master/stack/" + sampleId + "/" + sampleId + ".json"
          }).then(function(result) {
            var e, j;
            try {
              j = JSON.parse(result);
              delete j.id;
              delete j.signature;
              if (!self.collection.isNameAvailable(j.name)) {
                j.name = self.collection.getNewName(j.name);
              }
              self.attributes.region = j.region;
              self.__setJsonData(j);
            } catch (_error) {
              e = _error;
              j = null;
              self.attributes.region = "us-east-1";
              self.__initJsonData();
            }
            if (j) {
              try {
                self.set("name", j.name);
              } catch (_error) {
                e = _error;
              }
            }
            return self;
          });
        } else if (this.isImported()) {
          return CloudResources("OpsResource", this.getVpcId()).init(this.get("region")).fetchForceDedup().then(function() {
            var json;
            json = self.generateJsonFromRes();
            self.__setJsonData(json);
            self.attributes.name = json.name;
            return self;
          });
        } else if (this.isStack()) {
          return ApiRequest("stack_info", {
            region_name: this.get("region"),
            stack_ids: [this.get("id")]
          }).then(function(ds) {
            return self.__setJsonData(ds[0]);
          });
        } else {
          return ApiRequest("app_info", {
            region_name: this.get("region"),
            app_ids: [this.get("id")]
          }).then(function(ds) {
            return self.__setJsonData(ds[0]);
          });
        }
      },
      __setJsonData: function(json) {
        var newLayout;
        if (!json) {
          this.__destroy();
          throw new McError(ApiRequest.Errors.MissingDataInServer, "Stack/App doesn't exist.");
        }
        if (!json.agent) {
          json.agent = {
            enabled: false,
            module: {
              repo: App.user.get("repo"),
              tag: App.user.get("tag")
            }
          };
        }
        if (!json.property) {
          json.property = {
            stoppable: true
          };
        }

        /*
        Old JSON will have structure like :
        layout : {
          component : { node : {}, group : {} }
          size : []
        }
        New JSON will have structure like :
        layout : {
          xxx  : {}
          size : []
        }
         */
        if (json.layout && json.layout.component) {
          newLayout = $.extend({}, json.layout.component.node, json.layout.component.group);
          newLayout.size = json.layout.size;
          json.layout = newLayout;
        }
        if (json.layout && !json.layout.size) {
          json.layout.size = [240, 240];
        }
        if ((json.version || "").split("-").length < 3) {
          json.version = "2013-09-13";
        }
        this.__jsonData = json;
        if (this.attributes.name !== json.name) {
          this.set("name", json.name);
        }
        return this;
      },
      generateJsonFromRes: function() {
        var c, json, l, res;
        res = CloudResources.getAllResourcesForVpc(this.get("region"), this.getVpcId(), this.__jsonData);
        if (this.__jsonData) {
          c = this.__jsonData.component;
          l = this.__jsonData.layout;
          delete this.__jsonData.component;
          delete this.__jsonData.layout;
          json = $.extend(true, {}, this.__jsonData);
          this.__jsonData.component = c;
          this.__jsonData.layout = l;
        } else {
          json = this.__createRawJson();
        }
        json.component = res.component;
        json.layout = res.layout;
        json.name = this.get("name") || res.theVpc.name;
        return json;
      },
      save: function(newJson, thumbnail) {
        var api, d, nameClash, self;
        if (this.isApp() || this.testState(OpsModelState.Saving)) {
          return this.__returnErrorPromise();
        }
        if (!newJson) {
          newJson = this.__jsonData;
        }
        this.set("state", OpsModelState.Saving);
        nameClash = this.collection.where({
          name: newJson.name
        }) || [];
        if (nameClash.length > 1 || (nameClash[0] && nameClash[0] !== this)) {
          d = Q.defer();
          d.reject(McError(ApiRequest.Errors.StackRepeatedStack, "Stack name has already been used."));
          return d.promise;
        }
        api = this.get("id") ? "stack_save" : "stack_create";
        if (newJson.state !== "Enabled") {
          console.warn("The json's state isnt `Enabled` when saving the stack", this, newJson);
          newJson.state = "Enabled";
        }
        newJson.id = this.get("id");
        self = this;
        return ApiRequest(api, {
          region_name: this.get("region"),
          spec: newJson
        }).then(function(res) {
          var attr;
          attr = {
            name: newJson.name,
            updateTime: +(new Date()),
            stoppable: newJson.property.stoppable,
            state: OpsModelState.UnRun
          };
          if (!self.get("id")) {
            attr.id = res;
            newJson.id = res;
          }
          if (thumbnail) {
            ThumbUtil.save(self.id || attr.id, thumbnail);
          }
          self.set(attr);
          self.__jsonData = newJson;
          self.trigger("jsonDataSaved", self);
          if (attr.id) {
            self.collection.__triggerUpdate(self);
          }
          return self;
        }, function(err) {
          self.set("state", OpsModelState.UnRun);
          throw err;
        });
      },
      remove: function() {
        var d, self;
        if (this.isPersisted() && this.isApp()) {
          return this.__returnErrorPromise();
        }
        this.__destroy();
        if (!this.get("id")) {
          d = Q.defer();
          d.resolve();
          return d.promise;
        }
        self = this;
        return ApiRequest("stack_remove", {
          region_name: this.get("region"),
          stack_id: this.get("id")
        }).fail(function() {
          this.set("state", OpsModelState.UnRun);
          return App.model.stackList().add(self);
        });
      },
      run: function(toRunJson, appName) {
        var region;
        region = this.get("region");
        toRunJson.id = this.get("id") || "";
        return ApiRequest("stack_run_v2", {
          region_name: region,
          stack: toRunJson,
          app_name: appName
        }).then(function(res) {
          var m;
          m = new OpsModel({
            name: appName,
            requestId: res[0],
            state: OpsModelState.Initializing,
            progress: 0,
            region: region,
            usage: toRunJson.usage,
            updateTime: +(new Date()),
            stoppable: toRunJson.property.stoppable,
            resource_diff: false
          });
          App.model.appList().add(m);
          return m;
        });
      },
      duplicate: function(name) {
        var attr, collection, thumbnail;
        if (this.isApp()) {
          return;
        }
        thumbnail = ThumbUtil.fetch(this.get("id"));
        attr = $.extend(true, {}, this.attributes, {
          name: name,
          updateTime: +(new Date())
        });
        collection = this.collection;
        return ApiRequest("stack_save_as", {
          region_name: this.get("region"),
          stack_id: this.get("id"),
          new_name: name || this.collection.getNewName()
        }).then(function(id) {
          if (thumbnail) {
            ThumbUtil.save(id, thumbnail);
          }
          attr.id = id;
          return collection.add(new OpsModel(attr));
        });
      },
      stop: function() {
        var self;
        if (!this.isApp() || this.get("state") !== OpsModelState.Running) {
          return this.__returnErrorPromise();
        }
        self = this;
        this.set("state", OpsModelState.Stopping);
        this.attributes.progress = 0;
        return ApiRequest("app_stop", {
          region_name: this.get("region"),
          app_id: this.get("id"),
          app_name: this.get("name")
        }).fail(function(err) {
          self.set("state", OpsModelState.Running);
          throw err;
        });
      },
      start: function() {
        var self;
        if (!this.isApp() || this.get("state") !== OpsModelState.Stopped) {
          return this.__returnErrorPromise();
        }
        self = this;
        this.set("state", OpsModelState.Starting);
        this.attributes.progress = 0;
        return ApiRequest("app_start", {
          region_name: this.get("region"),
          app_id: this.get("id"),
          app_name: this.get("name")
        }).fail(function(err) {
          self.set("state", OpsModelState.Stopped);
          throw err;
        });
      },
      terminate: function(force) {
        var oldState, self;
        if (force == null) {
          force = false;
        }
        if (!this.isApp()) {
          return this.__returnErrorPromise();
        }
        oldState = this.get("state");
        this.set("state", OpsModelState.Terminating);
        this.attributes.progress = 0;
        this.attributes.terminateFail = false;
        self = this;
        return ApiRequest("app_terminate", {
          region_name: this.get("region"),
          app_id: this.get("id"),
          app_name: this.get("name"),
          flag: force
        }).then(function() {
          if (force) {
            self.__destroy();
          }
        }, function(err) {
          if (err.error < 0) {
            throw err;
          }
          self.set({
            state: oldState,
            terminateFail: true
          });
          throw err;
        });
      },
      update: function(newJson, fastUpdate) {
        var errorHandler, oldState, self;
        if (!this.isApp()) {
          return this.__returnErrorPromise();
        }
        if (this.__updateAppDefer) {
          console.error("The app is already updating!");
          return this.__updateAppDefer.promise;
        }
        oldState = this.get("state");
        this.set("state", OpsModelState.Updating);
        this.attributes.progress = 0;
        this.__updateAppDefer = Q.defer();
        self = this;
        ApiRequest("app_update", {
          region_name: this.get("region"),
          spec: newJson,
          app_id: this.get("id"),
          fast_update: fastUpdate
        }).fail(function(error) {
          return self.__updateAppDefer.reject(error);
        });
        errorHandler = function(error) {
          self.__updateAppDefer = null;
          self.attributes.progress = 0;
          self.set({
            state: oldState
          });
          throw error;
        };
        return this.__updateAppDefer.promise.then(function() {
          self.__jsonData = null;
          return self.fetchJsonData().then(function() {
            self.__updateAppDefer = null;
            self.importVpcId = void 0;
            return self.set({
              name: newJson.name,
              state: OpsModelState.Running
            });
          }, errorHandler);
        }, errorHandler);
      },
      saveApp: function(newJson) {
        var oldState, self;
        if (!this.isApp()) {
          return this.__returnErrorPromise();
        }
        if (this.__saveAppDefer) {
          console.error("The app is already saving!");
          return this.__saveAppDefer.promise;
        }
        newJson.changed = false;
        if (newJson.state !== this.getStateDesc()) {
          console.warn("The new app json's state isnt the same as the app", this, newJson);
          newJson.state = this.getStateDesc();
        }
        console.assert((newJson.id || "").indexOf("stack-") === -1, "The newJson has wrong appid, in saveApp()");
        if (newJson.id) {
          if (newJson.id !== this.get("id")) {
            console.warn("The newJson has different id, in saveApp()");
          }
          newJson.id = this.get("id");
        } else {
          newJson.id = "";
        }
        oldState = this.get("state");
        this.set("state", OpsModelState.Saving);
        this.attributes.progress = 0;
        this.__saveAppDefer = Q.defer();
        self = this;
        ApiRequest("app_save_info", {
          spec: newJson
        }).then(function(res) {
          if (!self.id) {
            self.attributes.requestId = res[0];
          }
          self.attributes.importVpcId = void 0;
        }, function(error) {
          return self.__saveAppDefer.reject(error);
        });
        return this.__saveAppDefer.promise.then(function() {
          self.__jsonData = newJson;
          self.attributes.requestId = void 0;
          self.set({
            name: newJson.name,
            state: oldState,
            usage: newJson.usage
          });
          self.__saveAppDefer = null;
        }, function(error) {
          self.__saveAppDefer = null;
          self.attributes.requestId = void 0;
          self.attributes.progress = 0;
          self.set({
            state: oldState
          });
          throw error;
        });
      },
      setStatusProgress: function(steps, totalSteps) {
        var progress;
        progress = parseInt(steps * 100.0 / totalSteps);
        if (this.attributes.progress !== progress) {
          this.attributes.progress = progress;
          this.trigger("change:progress", this, progress);
        }
      },
      isProcessing: function() {
        var state;
        state = this.attributes.state;
        return state === OpsModelState.Initializing || state === OpsModelState.Stopping || state === OpsModelState.Updating || state === OpsModelState.Terminating || state === OpsModelState.Starting || state === OpsModelState.Saving;
      },
      setStatusWithApiResult: function(state) {
        console.info("OpsModel's state changes due to ApiRequest:", state, this);
        return this.set("state", OpsModelState[state]);
      },
      setStatusWithWSEvent: function(operation, state, error) {
        var d, self, toState;
        console.info("OpsModel's state changes due to WS event:", operation, state, error, this);
        switch (operation) {
          case "launch":
            if (state.completed) {
              toState = OpsModelState.Running;
            } else if (state.failed) {
              toState = OpsModelState.Destroyed;
            }
            break;
          case "stop":
            if (state.completed) {
              toState = OpsModelState.Stopped;
            } else if (state.failed) {
              toState = OpsModelState.Running;
            }
            break;
          case "update":
            if (!this.__updateAppDefer) {
              console.warn("UpdateAppDefer is null when setStatusWithWSEvent with `update` event.");
              return;
            }
            if (!state.completed) {
              d = this.__updateAppDefer;
              this.__updateAppDefer = null;
              d.reject(McError(ApiRequest.Errors.OperationFailure, error));
            } else {
              this.__jsonData = null;
              self = this;
              this.fetchJsonData().then(function() {
                d = self.__updateAppDefer;
                self.__updateAppDefer = null;
                return d.resolve();
              });
            }
            return;
          case "save":
            if (!this.__saveAppDefer) {
              console.warn("SaveAppDefer is null when setStatusWithWSEvent with `save` event.");
              return;
            }
            d = this.__saveAppDefer;
            this.__saveAppDefer = null;
            if (state.completed) {
              d.resolve();
            } else {
              d.reject(McError(ApiRequest.Errors.OperationFailure, error));
            }
            return;
          case "terminate":
            if (state.completed) {
              toState = OpsModelState.Destroyed;
            } else {
              toState = OpsModelState.Stopped;
              this.attributes.terminateFail = false;
              this.set("terminateFail", true);
            }
            break;
          case "start":
            if (state.completed) {
              toState = OpsModelState.Running;
            } else {
              toState = OpsModelState.Stopped;
            }
        }
        if (error) {
          this.attributes.opsActionError = error;
        }
        if (toState === OpsModelState.Destroyed) {
          this.__destroy();
        } else if (toState) {
          this.attributes.progress = 0;
          this.set("state", toState);
        }
      },

      /*
       Internal Methods
       */
      destroy: function() {
        return console.info("OpsModel's destroy() doesn't do anything. You probably want to call remove(), stop() or terminate()");
      },
      __destroy: function() {
        if (this.attributes.state === OpsModelState.Destroyed) {
          return;
        }
        ThumbUtil.remove(this.get("id"));
        this.attributes.state = OpsModelState.Destroyed;
        return this.trigger('destroy', this, this.collection);
      },
      __returnErrorPromise: function() {
        var d;
        d = Q.defer();
        d.resolve(McError(ApiRequest.Errors.InvalidMethodCall, "The method is not supported by this model."));
        return d.promise;
      },
      __createRawJson: function() {
        return {
          id: this.get("id") || "",
          name: this.get("name"),
          description: "",
          region: this.get("region"),
          platform: "ec2-vpc",
          state: "Enabled",
          version: "2014-02-17",
          component: {},
          layout: {
            size: [240, 240]
          },
          agent: {
            enabled: true,
            module: {
              repo: App.user.get("repo"),
              tag: App.user.get("tag")
            }
          },
          property: {
            stoppable: true
          }
        };
      },
      __initJsonData: function() {
        var comp, component, id, json, l, layout, vpcId, vpcRef;
        json = this.__createRawJson();
        vpcId = MC.guid();
        vpcRef = "@{" + vpcId + ".resource.VpcId}";
        layout = {
          VPC: {
            coordinate: [5, 3],
            size: [60, 60]
          },
          RTB: {
            coordinate: [50, 5],
            groupUId: vpcId
          }
        };
        component = {
          KP: {
            type: "AWS.EC2.KeyPair",
            name: "DefaultKP",
            resource: {
              KeyName: "DefaultKP",
              KeyFingerprint: ""
            }
          },
          SG: {
            type: "AWS.EC2.SecurityGroup",
            name: "DefaultSG",
            resource: {
              IpPermissions: [
                {
                  IpProtocol: "tcp",
                  IpRanges: "0.0.0.0/0",
                  FromPort: "22",
                  ToPort: "22"
                }
              ],
              IpPermissionsEgress: [
                {
                  FromPort: "0",
                  IpProtocol: "-1",
                  IpRanges: "0.0.0.0/0",
                  ToPort: "65535"
                }
              ],
              Default: true,
              GroupId: "",
              GroupName: "DefaultSG",
              GroupDescription: 'default VPC security group',
              VpcId: vpcRef
            }
          },
          ACL: {
            type: "AWS.VPC.NetworkAcl",
            name: "DefaultACL",
            resource: {
              AssociationSet: [],
              Default: true,
              NetworkAclId: "",
              VpcId: vpcRef,
              EntrySet: [
                {
                  RuleAction: "allow",
                  Protocol: -1,
                  CidrBlock: "0.0.0.0/0",
                  Egress: true,
                  IcmpTypeCode: {
                    Type: "",
                    Code: ""
                  },
                  PortRange: {
                    To: "",
                    From: ""
                  },
                  RuleNumber: 100
                }, {
                  RuleAction: "allow",
                  Protocol: -1,
                  CidrBlock: "0.0.0.0/0",
                  Egress: false,
                  IcmpTypeCode: {
                    Type: "",
                    Code: ""
                  },
                  PortRange: {
                    To: "",
                    From: ""
                  },
                  RuleNumber: 100
                }, {
                  RuleAction: "deny",
                  Protocol: -1,
                  CidrBlock: "0.0.0.0/0",
                  Egress: true,
                  IcmpTypeCode: {
                    Type: "",
                    Code: ""
                  },
                  PortRange: {
                    To: "",
                    From: ""
                  },
                  RuleNumber: 32767
                }, {
                  RuleAction: "deny",
                  Protocol: -1,
                  CidrBlock: "0.0.0.0/0",
                  Egress: false,
                  IcmpTypeCode: {
                    Type: "",
                    Code: ""
                  },
                  PortRange: {
                    To: "",
                    From: ""
                  },
                  RuleNumber: 32767
                }
              ]
            }
          },
          VPC: {
            type: "AWS.VPC.VPC",
            name: "vpc",
            resource: {
              VpcId: "",
              CidrBlock: "10.0.0.0/16",
              DhcpOptionsId: "",
              EnableDnsHostnames: false,
              EnableDnsSupport: true,
              InstanceTenancy: "default"
            }
          },
          RTB: {
            type: "AWS.VPC.RouteTable",
            name: "RT-0",
            resource: {
              VpcId: vpcRef,
              RouteTableId: "",
              AssociationSet: [
                {
                  Main: "true",
                  SubnetId: "",
                  RouteTableAssociationId: ""
                }
              ],
              PropagatingVgwSet: [],
              RouteSet: [
                {
                  InstanceId: "",
                  NetworkInterfaceId: "",
                  Origin: 'CreateRouteTable',
                  GatewayId: 'local',
                  DestinationCidrBlock: '10.0.0.0/16'
                }
              ]
            }
          }
        };
        for (id in component) {
          comp = component[id];
          if (id === "VPC") {
            comp.uid = vpcId;
          } else {
            comp.uid = MC.guid();
          }
          json.component[comp.uid] = comp;
          if (layout[id]) {
            l = layout[id];
            l.uid = comp.uid;
            json.layout[comp.uid] = l;
          }
        }
        this.__jsonData = json;
      }
    });
    OpsModel.State = OpsModelState;
    return OpsModel;
  });

}).call(this);


/*
----------------------------
  The collection for stack / app
----------------------------

  This collection will trigger an "update" event when the list ( containing all visible items ) is changed.
 */

(function() {
  define('ide/submodels/OpsCollection',["OpsModel", "constant", "backbone"], function(OpsModel, constant) {
    return Backbone.Collection.extend({
      model: OpsModel,
      newNameTmpl: "untitled",
      comparator: function(m1, m2) {
        return -(m1.attributes.updateTime - m2.attributes.updateTime);
      },
      initialize: function() {
        this.on("change:updateTime", this.sort, this);
        this.on("add remove", this.__triggerUpdate, this);
        this.on("change:id", this.__triggerUpdate, this);
        this.__debounceUpdate = _.debounce(function() {
          return this.trigger("update");
        });
      },
      getNewName: function(possibleName) {
        var base, nameMap, nameMatch, newName, tmpl;
        nameMap = this.groupBy("name");
        base = 0;
        if (possibleName) {
          nameMatch = possibleName.match(/(.+)(-\d*)$/);
          tmpl = nameMatch ? nameMatch[1] : possibleName;
        } else {
          tmpl = this.newNameTmpl;
        }
        newName = tmpl + "-0";
        while (true) {
          if (nameMap[newName]) {
            base += 1;
          } else {
            break;
          }
          newName = tmpl + "-" + base;
        }
        return newName;
      },
      isNameAvailable: function(name) {
        return !this.findWhere({
          name: name
        });
      },
      groupByRegion: function(includeEmptyRegion, toJSON, includeEveryOps) {
        var R, list, m, models, r, regionMap, regions, _i, _j, _len, _len1, _ref, _ref1;
        if (includeEmptyRegion == null) {
          includeEmptyRegion = false;
        }
        if (toJSON == null) {
          toJSON = true;
        }
        if (includeEveryOps == null) {
          includeEveryOps = false;
        }
        regionMap = {};
        _ref = this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          m = _ref[_i];
          if (!includeEveryOps && !m.isExisting()) {
            continue;
          }
          r = m.attributes.region;
          list = regionMap[r] || (regionMap[r] = []);
          list.push(toJSON ? m.toJSON() : m);
        }
        regions = [];
        _ref1 = constant.REGION_KEYS;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          R = _ref1[_j];
          models = regionMap[R];
          if (!models && !includeEmptyRegion) {
            continue;
          }
          regions.push({
            region: R,
            regionName: constant.REGION_SHORT_LABEL[R],
            data: models || []
          });
        }
        return regions;
      },
      filterRecent: function(toJSON) {
        var filters, m, now, time, _i, _len, _ref;
        if (toJSON == null) {
          toJSON = false;
        }
        now = Math.round(+(new Date()) / 1000);
        filters = [];
        _ref = this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          m = _ref[_i];
          time = m.get("updateTime");
          if (now - time >= 2592000) {
            break;
          }
          if (toJSON) {
            m = m.toJSON();
            m.formatedTime = MC.intervalDate(time);
          }
          filters.push(m);
        }
        return filters;
      },
      __triggerUpdate: function(model) {
        if (!model) {
          return;
        }
        if (this.indexOf(model) !== -1 && !model.isExisting()) {
          return;
        }
        this.__debounceUpdate();
      }
    });
  });

}).call(this);


/*
----------------------------
  The Model for application
----------------------------

  This model holds all the data of the user in our database. For example, stack list / app list / notification things and extra.
 */

(function() {
  define('ide/ApplicationModel',["./submodels/OpsCollection", "OpsModel", "ApiRequest", "backbone", "constant", "ThumbnailUtil"], function(OpsCollection, OpsModel, ApiRequest, Backbone, constant, ThumbUtil) {
    return Backbone.Model.extend({
      defaults: function() {
        return {
          __websocketReady: false,
          notification: [],
          stackList: new OpsCollection(),
          appList: new OpsCollection()
        };
      },
      markNotificationRead: function() {
        var i, _i, _len, _ref;
        _ref = this.attributes.notification;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          i.readed = true;
        }
      },
      stackList: function() {
        return this.attributes.stackList;
      },
      appList: function() {
        return this.attributes.appList;
      },
      getOpsModelById: function(opsId) {
        return this.attributes.appList.get(opsId) || this.attributes.stackList.get(opsId);
      },
      clearImportOps: function() {
        return this.attributes.appList.remove(this.attributes.appList.find(function(m) {
          return m.isImported();
        }));
      },
      createImportOps: function(region, vpcId) {
        var m;
        m = this.attributes.appList.findWhere({
          importVpcId: vpcId
        });
        if (m) {
          return m;
        }
        m = new OpsModel({
          name: "",
          importVpcId: vpcId,
          region: region,
          state: OpsModel.State.Running
        });
        this.attributes.appList.add(m);
        return m;
      },
      createSampleOps: function(sampleId) {
        var m;
        m = new OpsModel({
          sampleId: sampleId
        });
        this.attributes.stackList.add(m);
        return m;
      },
      createStack: function(region) {
        var m;
        console.assert(constant.REGION_KEYS.indexOf(region) >= 0, "Region is not recongnised when creating stack:", region);
        m = new OpsModel({
          name: this.stackList().getNewName(),
          region: region
        }, {
          initJsonData: true
        });
        this.attributes.stackList.add(m);
        return m;
      },
      createStackByJson: function(json) {
        var m;
        if (!this.attributes.stackList.isNameAvailable(json.name)) {
          json.name = this.stackList().getNewName(json.name);
        }
        m = new OpsModel({
          name: json.name,
          region: json.region
        }, {
          jsonData: json
        });
        this.attributes.stackList.add(m);
        return m;
      },
      getPriceData: function(awsRegion) {
        return (this.__appdata[awsRegion] || {}).price;
      },
      getOsFamilyConfig: function(awsRegion) {
        return (this.__appdata[awsRegion] || {}).osFamilyConfig;
      },
      getInstanceTypeConfig: function(awsRegion) {
        return (this.__appdata[awsRegion] || {}).instanceTypeConfig;
      },
      getStateModule: function(repo, tag) {
        return this.__stateModuleData[repo + ":" + tag];
      },

      /*
        Internal methods
       */
      initialize: function() {
        this.__appdata = {};
        this.__stateModuleData = {};
        this.__initializeNotification();
      },
      fetch: function() {
        var ap, appdata, self, sp;
        self = this;
        sp = ApiRequest("stack_list", {
          region_name: null
        }).then(function(res) {
          return self.get("stackList").set(self.__parseListRes(res));
        });
        ap = ApiRequest("app_list", {
          region_name: null
        }).then(function(res) {
          return self.get("appList").set(self.__parseListRes(res));
        });
        appdata = ApiRequest("aws_aws", {
          fields: ["region", "price", "instance_types"]
        }).then(function(res) {
          var cpu, i, instanceTypeConfig, storage, typeInfo, _i, _j, _len, _len1, _ref;
          for (_i = 0, _len = res.length; _i < _len; _i++) {
            i = res[_i];
            instanceTypeConfig = {};
            self.__appdata[i.region] = {
              price: i.price,
              osFamilyConfig: i.instance_types.sort,
              instanceTypeConfig: instanceTypeConfig
            };
            _ref = i.instance_types.info || [];
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
              typeInfo = _ref[_j];
              if (!typeInfo) {
                continue;
              }
              cpu = typeInfo.cpu || {};
              typeInfo.name = typeInfo.description;
              typeInfo.formated_desc = [typeInfo.name || "", cpu.units + " ECUs", cpu.cores + " vCPUs", typeInfo.memory + " GiB memory"];
              typeInfo.description = typeInfo.formated_desc.join(", ");
              storage = typeInfo.storage;
              if (storage && storage.ssd === true) {
                typeInfo.description += ", " + storage.count + " x " + storage.size + " GiB SSD Storage Capacity";
              }
              instanceTypeConfig[typeInfo.typeName] = typeInfo;
            }
          }
        });
        return Q.all([sp, ap]).then(function() {
          var e;
          try {
            ThumbUtil.cleanup(self.appList().pluck("id").concat(self.stackList().pluck("id")));
          } catch (_error) {
            e = _error;
          }
        });
      },
      fetchStateModule: function(repo, tag) {
        var d, data, self;
        data = this.getStateModule(repo, tag);
        if (data) {
          d = Q.defer();
          d.resolve(data);
          return d.promise;
        }
        self = this;
        return ApiRequest("state_module", {
          mod_repo: repo,
          mod_tag: tag
        }).then(function(d) {
          var e;
          try {
            d = JSON.parse(d);
          } catch (_error) {
            e = _error;
            throw McError(ApiRequest.Errors.InvalidRpcReturn, "Can't load state data. Please retry.");
          }
          self.__stateModuleData[repo + ":" + tag] = d;
          return d;
        });
      },
      __parseListRes: function(res) {
        var ops, r, _i, _len;
        r = [];
        for (_i = 0, _len = res.length; _i < _len; _i++) {
          ops = res[_i];
          r.push({
            id: ops.id,
            updateTime: ops.time_update,
            region: ops.region,
            usage: ops.usage,
            name: ops.name,
            state: OpsModel.State[ops.state] || OpsModel.State.UnRun,
            stoppable: !(ops.property && ops.property.stoppable === false)
          });
        }
        return r;
      },
      __initializeNotification: function() {
        var self;
        self = this;
        return App.WS.on("requestChange", function(idx, dag) {
          return self.__processSingleNotification(idx, dag);
        });
      },
      __triggerNotification: _.debounce(function() {
        return this.trigger("change:notification");
      }, 400),
      __processSingleNotification: function(idx) {
        var i, info_list, item, ops, req, same_req, space, _i, _len;
        req = App.WS.collection.request.findOne({
          '_id': idx
        });
        if (!req) {
          return;
        }
        item = this.__parseRequestInfo(req);
        if (!item) {
          return;
        }
        this.__handleRequestChange(item);
        if (item.operation === "save") {
          return;
        }
        info_list = this.attributes.notification;
        for (idx = _i = 0, _len = info_list.length; _i < _len; idx = ++_i) {
          i = info_list[idx];
          if (i.id === item.id) {
            same_req = i;
            break;
          }
        }
        if (same_req && _.isEqual(same_req.state, item.state)) {
          return;
        }
        item.readed = !App.WS.isReady();
        if (!item.readed && App.workspaces) {
          space = App.workspaces.getAwakeSpace();
          ops = this.appList().get(item.targetId) || this.stackList().get(item.targetId);
          item.readed = space.isWorkingOn(ops);
        }
        info_list.splice(idx, 1);
        info_list.splice(0, 0, item);
        if (info_list.length > 30) {
          info_list.length = 30;
        }
        this.__triggerNotification();
        return null;
      },
      __parseRequestInfo: function(req) {
        var dag, duration, i, request, time_begin, time_end, _i, _len, _ref;
        if (!req.brief) {
          return;
        }
        dag = req.dag;
        request = {
          id: req.id,
          region: constant.REGION_SHORT_LABEL[req.region],
          time: req.time_end,
          operation: constant.OPS_CODE_NAME[req.code],
          targetId: dag && dag.spec ? dag.spec.id : req.rid,
          targetName: req.brief.split(" ")[2] || "",
          state: {
            processing: true
          },
          readed: true
        };
        switch (req.state) {
          case constant.OPS_STATE.OPS_STATE_FAILED:
            request.error = req.data;
            request.state = {
              failed: true
            };
            break;
          case constant.OPS_STATE.OPS_STATE_INPROCESS:
            request.time = req.time_begin;
            request.step = 0;
            if (req.dag && req.dag.step) {
              request.totalSteps = req.dag.step.length;
              _ref = req.dag.step;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                i = _ref[_i];
                if (i[1] === "done") {
                  ++request.step;
                }
              }
            } else {
              request.totalSteps = 1;
            }
            break;
          case constant.OPS_STATE.OPS_STATE_DONE:
            if (request.operation === "save") {
              request.targetId = req.data;
            }
            request.state = {
              completed: true,
              terminated: req.code === 'Forge.App.Terminate'
            };
            break;
          case constant.OPS_STATE.OPS_STATE_PENDING:
            request.state = {
              pending: true
            };
            request.time = "";
        }
        if (request.time) {
          request.time = MC.dateFormat(new Date(request.time * 1000), "hh:mm yyyy-MM-dd");
          if (req.state !== constant.OPS_STATE.OPS_STATE_INPROCESS) {
            time_begin = parseInt(req.time_begin, 10);
            time_end = parseInt(req.time_end, 10);
            if (!isNaN(time_begin) && !isNaN(time_end) && time_end >= time_begin) {
              duration = time_end - time_begin;
              if (duration < 60) {
                request.duration = "Took " + duration + " sec.";
              } else {
                request.duration = "Took " + (Math.round(duration / 60)) + " min.";
              }
            }
          }
        }
        return request;
      },
      __handleRequestChange: function(request) {
        var theApp;
        if (!App.WS.isReady() && !request.state.processing) {
          return;
        }
        if (request.state.pending) {
          return;
        }
        theApp = this.appList().get(request.targetId);
        if (!theApp) {
          theApp = this.appList().findWhere({
            requestId: request.id
          });
          if (theApp && request.targetId) {
            theApp.set("id", request.targetId);
          }
        }
        if (!theApp) {
          return;
        }
        if (!request.state.processing && !theApp.isProcessing()) {
          return;
        }
        if (theApp.testState(OpsModel.State.Terminating) && request.operation !== "terminate") {
          console.error("We recevied a request notification, which operation is not `terminate`. But the app is terminating.", request);
          return;
        }
        if (request.state.processing) {
          return theApp.setStatusProgress(request.step, request.totalSteps);
        } else {
          return theApp.setStatusWithWSEvent(request.operation, request.state, request.error);
        }
      }
    });
  });

}).call(this);


/*
----------------------------
  User is a model containing user's data. Nothing more, nothing less.
  Currently most of the data is stored in cookie. But in the future,
  it might just fetch user data at the beginning.
----------------------------
 */

(function() {
  define('ide/User',["ApiRequest", "backbone"], function(ApiRequest) {
    var UserState;
    UserState = {
      NotFirstTime: 2
    };
    return Backbone.Model.extend({
      initialize: function() {
        this.set({
          usercode: $.cookie("usercode"),
          username: MC.base64Decode($.cookie("usercode")),
          session: $.cookie("session_id")
        });
      },
      hasCredential: function() {
        return !!this.get("account");
      },
      isFirstVisit: function() {
        return !(UserState.NotFirstTime & this.get("state"));
      },
      userInfoAccuired: function(result) {
        var idx, res, t, _i, _len, _ref;
        res = {
          email: MC.base64Decode(result.email),
          repo: result.mod_repo,
          tag: result.mod_tag,
          state: parseInt(result.state, 10),
          intercomHash: result.intercom_secret,
          account: result.account_id,
          awsAccessKey: result.access_key,
          awsSecretKey: result.secret_key,
          tokens: result.tokens || [],
          defaultToken: ""
        };
        if (result.account_id === "demo_account") {
          res.account = res.awsAccessKey = res.awsSecretKey = "";
        }
        _ref = res.tokens;
        for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
          t = _ref[idx];
          if (!t.name) {
            res.defaultToken = t.token;
            res.tokens.splice(idx, 1);
            break;
          }
        }
        this.set(res);
        if (this.isFirstVisit()) {
          ApiRequest("account_update_account", {
            attributes: {
              state: this.get("state") | UserState.NotFirstTime
            }
          });
        }
      },
      bootIntercom: function() {
        var intId;
        if (!window.Intercom) {
          intId = setInterval((function(_this) {
            return function() {
              if (window.Intercom) {
                console.log("Intercom Loaded, Booting Intercom");
                clearInterval(intId);
                _this.bootIntercom();
              }
            };
          })(this), 1000);
          return;
        }
        window.Intercom("boot", {
          app_id: "3rp02j1w",
          email: this.get("email"),
          username: this.get("username"),
          user_hash: this.get("intercomHash"),
          widget: {
            'activator': '#support'
          }
        });
      },
      fetch: function() {
        var self;
        self = this;
        return ApiRequest("session_login", {
          username: this.get("username"),
          password: this.get("session")
        }).then(function(result) {
          self.userInfoAccuired(result);

          /* env:prod */
          self.bootIntercom();

          /* env:prod:end */
          if (self.hasCredential()) {
            return ApiRequest("ec2_DescribeRegions").fail(function() {});
          }
        }, function(err) {
          if (err.error < 0) {
            if (err.error === ApiRequest.Errors.Network500) {
              window.location = "/500";
            } else {
              window.location.reload();
            }
          } else {
            App.logout();
          }
          throw err;
        });
      },
      acquireSession: function(password) {
        return ApiRequest("session_login", {
          username: this.get("username"),
          password: password
        }).then((function(_this) {
          return function(result) {
            $.cookie("session_id", result.session_id, {
              expires: 30,
              path: '/'
            });
            _this.set("session", result.session_id);
            _this.userInfoAccuired(result);
            _this.trigger("SessionUpdated");
          };
        })(this));
      },
      logout: function() {
        var cValue, ckey, def, domain, _ref;
        domain = {
          "domain": window.location.hostname.replace("ide", ""),
          "path": "/"
        };
        def = {
          "path": "/"
        };
        _ref = $.cookie();
        for (ckey in _ref) {
          cValue = _ref[ckey];
          $.removeCookie(ckey, domain);
          $.removeCookie(ckey, def);
        }
      },
      changePassword: function(oldPwd, newPwd) {
        return ApiRequest("account_update_account", {
          attributes: {
            password: oldPwd,
            new_password: newPwd
          }
        });
      },
      validateCredential: function(accessKey, secretKey) {
        var d;
        ApiRequest("account_validate_credential", {
          access_key: accessKey,
          secret_key: secretKey
        });
        d = Q.defer();
        d.resolve();
        return d.promise;
      },
      changeCredential: function(account, accessKey, secretKey, force) {
        var self;
        if (account == null) {
          account = "";
        }
        if (accessKey == null) {
          accessKey = "";
        }
        if (secretKey == null) {
          secretKey = "";
        }
        if (force == null) {
          force = false;
        }
        self = this;
        return ApiRequest("account_set_credential", {
          access_key: accessKey,
          secret_key: secretKey,
          account_id: account,
          force_update: force
        }).then(function() {
          var attr;
          attr = {
            account: account,
            awsAccessKey: accessKey,
            awsSecretKey: secretKey
          };
          if (attr.awsAccessKey.length > 6) {
            attr.awsAccessKey = (new Array(accessKey.length - 6)).join("*") + accessKey.substr(-6);
          }
          if (attr.awsSecretKey.length > 6) {
            attr.awsSecretKey = (new Array(secretKey.length - 6)).join("*") + secretKey.substr(-6);
          }
          self.set(attr);
          self.trigger("change:credential");
        });
      },
      createToken: function() {
        var base, nameMap, newName, self, t, tmpl, _i, _len, _ref;
        tmpl = "MyToken";
        base = 1;
        nameMap = {};
        _ref = this.attributes.tokens;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
          nameMap[t.name] = true;
        }
        while (true) {
          newName = tmpl + base;
          if (nameMap[newName]) {
            base += 1;
          } else {
            break;
          }
        }
        self = this;
        return ApiRequest("token_create", {
          token_name: newName
        }).then(function(res) {
          self.attributes.tokens.splice(0, 0, {
            name: res[0],
            token: res[1]
          });
        });
      },
      removeToken: function(token) {
        var idx, self, t, _i, _len, _ref;
        _ref = this.attributes.tokens;
        for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
          t = _ref[idx];
          if (t.token === token) {
            break;
          }
        }
        self = this;
        return ApiRequest("token_remove", {
          token: token,
          token_name: t.name
        }).then(function(res) {
          idx = self.attributes.tokens.indexOf(t);
          if (idx >= 0) {
            self.attributes.tokens.splice(idx, 1);
          }
        });
      },
      updateToken: function(token, newName) {
        var self;
        self = this;
        return ApiRequest("token_update", {
          token: token,
          new_token_name: newName
        }).then(function(res) {
          var idx, t, _i, _len, _ref;
          _ref = self.attributes.tokens;
          for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
            t = _ref[idx];
            if (t.token === token) {
              t.name = newName;
              break;
            }
          }
        });
      }
    });
  });

}).call(this);

(function() {
  define('ide/subviews/WorkspaceView',["backbone", "jquerysort"], function() {
    return Backbone.View.extend({
      el: $("#tabbar-wrapper")[0],
      events: {
        "click li": "onClick",
        "click .icon-close": "onClose"
      },
      initialize: function(options) {
        var self;
        self = this;
        this.$el.find("#ws-tabs").dragsort({
          horizontal: true,
          dragSelectorExclude: ".fixed, .icon-close",
          dragEnd: function() {
            self.updateTabOrder();
          }
        });
      },
      updateTabOrder: function() {
        return this.trigger("orderChanged", this.tabOrder());
      },
      tabOrder: function() {
        return _.map(this.$el.find("li"), function(li) {
          return li.id;
        });
      },
      setTabIndex: function(id, isFixed, idx) {
        var $after, $group, $tgt;
        $tgt = this.$el.find("#" + id);
        if (!$tgt.length) {
          return;
        }
        if (isFixed) {
          $group = $("#ws-fixed-tabs");
        } else {
          $group = $("#ws-tabs");
          idx -= $("#ws-fixed-tabs").children().length;
        }
        $after = $group.children().eq(idx);
        if ($after.length) {
          $tgt.insertBefore($after);
        } else {
          $group.append($tgt);
        }
      },
      addTab: function(data, index, fixed) {
        var $parent, $tgt, tpl;
        if (index == null) {
          index = -1;
        }
        if (fixed == null) {
          fixed = false;
        }
        $parent = fixed ? $("#ws-fixed-tabs") : $("#ws-tabs");
        tpl = "<li class='" + data.klass + "' id='" + data.id + "'><span class='truncate'>" + data.title + "</span>";
        if (data.closable) {
          tpl += '<i class="icon-close" title="Close Tab"></i>';
        }
        $tgt = $parent.children().eq(index);
        if ($tgt.length) {
          return $(tpl + "</li>").insertAfter($tgt);
        } else {
          return $(tpl + "</li>").appendTo($parent);
        }
      },
      removeTab: function(id) {
        return this.$el.find("#" + id).remove();
      },
      updateTab: function(id, title, klass) {
        var $tgt;
        $tgt = this.$el.find("#" + id);
        if (title !== void 0 || title !== null) {
          $tgt.children("span").text(title);
        }
        if (klass !== void 0 || klass !== null) {
          if ($tgt.hasClass("active")) {
            klass += " active";
          }
          $tgt.attr("class", klass);
        }
      },
      activateTab: function(id) {
        this.$el.find(".active").removeClass("active");
        this.$el.find("#" + id).addClass("active");
      },
      onClick: function(evt) {
        this.trigger("click", evt.currentTarget.id);
      },
      onClose: function(evt) {
        this.trigger("close", $(evt.currentTarget).closest("li")[0].id);
        return false;
      },
      showLoading: function() {
        return $("#GlobalLoading").show();
      },
      hideLoading: function() {
        return $("#GlobalLoading").hide();
      }
    });
  });

}).call(this);

(function() {
  define('ide/WorkspaceManager',["./subviews/WorkspaceView", "underscore"], function(WorkspaceView) {
    var WorkspaceManager;
    WorkspaceManager = (function() {
      function WorkspaceManager() {
        var self;
        this.view = new WorkspaceView();
        self = this;
        this.view.on("orderChanged", function(order) {
          return self.__updateOrder(order);
        });
        this.view.on("click", function(id) {
          return self.awakeWorkspace(id);
        });
        this.view.on("close", function(id) {
          return self.remove(id);
        });
        this.__spaces = [];
        this.__spacesById = {};
        this.__awakeSpace = null;
        return this;
      }

      WorkspaceManager.prototype.__updateOrder = function(order) {
        var self;
        self = this;
        this.__spaces = order.map(function(id) {
          return self.__spacesById[id];
        });
      };

      WorkspaceManager.prototype.spaces = function() {
        return this.__spaces.slice(0);
      };

      WorkspaceManager.prototype.get = function(id) {
        return this.__spacesById[id];
      };

      WorkspaceManager.prototype.setIndex = function(workspace, idx) {
        this.view.setTabIndex(workspace.id, workspace.isFixed(), idx);
        this.__updateOrder(this.view.tabOrder());
      };

      WorkspaceManager.prototype.add = function(workspace) {
        this.__spacesById[workspace.id] = workspace;
        this.view.addTab({
          title: workspace.title(),
          id: workspace.id,
          closable: !workspace.isFixed(),
          klass: workspace.tabClass()
        }, -1, workspace.isFixed());
        this.__updateOrder(this.view.tabOrder());
        if (this.__spaces.length === 1) {
          this.awakeWorkspace(workspace);
        }
        return workspace;
      };

      WorkspaceManager.prototype.getAwakeSpace = function() {
        return this.__awakeSpace;
      };

      WorkspaceManager.prototype.awakeWorkspace = function(workspace) {
        var promise;
        if (!workspace) {
          return;
        }
        if (_.isString(workspace)) {
          workspace = this.__spacesById[workspace];
        }
        if (this.__awakeSpace === workspace) {
          return;
        }
        if (workspace.isRemoved()) {
          return;
        }
        if (this.__awakeSpace) {
          this.__awakeSpace.sleep();
        }
        this.__awakeSpace = workspace;
        this.__updateUrl();
        this.view.activateTab(workspace.id);
        promise = workspace.awake();
        if (promise && promise.then && promise.isFulfilled && !promise.isFulfilled()) {
          promise.then((function(_this) {
            return function() {
              return _this.view.hideLoading();
            };
          })(this));
          this.view.showLoading();
        } else {
          this.view.hideLoading();
        }
      };

      WorkspaceManager.prototype.update = function(workspace) {
        if (!workspace) {
          return;
        }
        if (workspace === this.__awakeSpace) {
          this.__updateUrl(true);
        }
        this.view.updateTab(workspace.id, workspace.title(), workspace.tabClass());
        return workspace;
      };

      WorkspaceManager.prototype.remove = function(workspace, force) {
        var id;
        if (!workspace) {
          return;
        }
        if (_.isString(workspace)) {
          workspace = this.__spacesById[workspace];
        }
        if (!force && !workspace.isRemovable()) {
          return;
        }
        id = workspace.id;
        this.view.removeTab(id);
        delete this.__spacesById[id];
        this.__spaces.splice(this.__spaces.indexOf(workspace), 1);
        workspace.stopListening();
        workspace.cleanup();
        if (this.__awakeSpace === workspace) {
          this.__awakeSpace = null;
          this.awakeWorkspace(this.__spaces[this.__spaces.length - 1]);
        }
        return workspace;
      };

      WorkspaceManager.prototype.find = function(attribute) {
        return _.find(this.__spaces, function(space) {
          return space.isWorkingOn(attribute);
        });
      };

      WorkspaceManager.prototype.hasUnsaveSpaces = function() {
        return this.__spaces.some(function(ws) {
          return ws.isModified();
        });
      };

      WorkspaceManager.prototype.__updateUrl = function(replace) {
        if (replace == null) {
          replace = false;
        }
        return Router.navigate(this.__awakeSpace.url(), {
          replace: replace
        });
      };

      return WorkspaceManager;

    })();
    return WorkspaceManager;
  });

}).call(this);


/*
----------------------------
  This is the core / entry point / controller of the whole IDE.
----------------------------

  It contains some basical logics to maintain the IDE. And it holds other components
  to provide other functionality
 */

(function() {
  define('ide/Application',["ApiRequest", "./Websocket", "./ApplicationView", "./ApplicationModel", "./User", "./subviews/SettingsDialog", "CloudResources", "./WorkspaceManager", "OpsModel", "JsonExporter", "constant", "underscore"], function(ApiRequest, Websocket, ApplicationView, ApplicationModel, User, SettingsDialog, CloudResources, WorkspaceManager, OpsModel, JsonExporter, constant) {
    var VisualOps;
    VisualOps = function() {
      if (window.App) {
        console.error("Application is already created.");
        return;
      }
      window.App = this;
    };
    VisualOps.prototype.initialize = function() {
      var fetchModel;
      this.__createUser();
      this.__createWebsocket();
      this.workspaces = new WorkspaceManager();
      this.model = new ApplicationModel();
      this.__view = new ApplicationView();
      fetchModel = this.model.fetch().fail(function(err) {
        notification("Cannot load application data. Please reload your browser.");
        throw err;
      });
      return Q.all([this.user.fetch(), fetchModel]);
    };
    VisualOps.prototype.__createWebsocket = function() {
      this.WS = new Websocket();
      this.WS.on("Disconnected", (function(_this) {
        return function() {
          return _this.acquireSession();
        };
      })(this));
      this.WS.on("StatusChanged", (function(_this) {
        return function(isConnected) {
          console.info("Websocket Status changed, isConnected:", isConnected);
          if (_this.__view) {
            return _this.__view.toggleWSStatus(isConnected);
          }
        };
      })(this));
    };
    VisualOps.prototype.__createUser = function() {
      this.user = new User();
      this.user.on("SessionUpdated", (function(_this) {
        return function() {
          return _this.WS.subscribe();
        };
      })(this));
      this.user.on("change:credential", (function(_this) {
        return function() {
          return _this.discardAwsCache();
        };
      })(this));
    };
    VisualOps.prototype.acquireSession = function() {
      return this.__view.showSessionDialog();
    };
    VisualOps.prototype.logout = function() {
      var p;
      App.user.logout();
      p = window.location.pathname;
      if (p === "/") {
        p = window.location.hash.replace("#", "/");
      }
      if (p && p !== "/") {
        window.location.href = "/login?ref=" + p;
      } else {
        window.location.href = "/login";
      }
    };
    VisualOps.prototype.canQuit = function() {
      return !this.workspaces.hasUnsaveSpaces();
    };
    VisualOps.prototype.showSettings = function(tab) {
      return new SettingsDialog({
        defaultTab: tab
      });
    };
    VisualOps.prototype.showSettings.TAB = SettingsDialog.TAB;
    VisualOps.prototype.askForAwsCredential = function() {
      return this.__view.askForAwsCredential();
    };
    VisualOps.prototype.deleteStack = function(id, name) {
      return this.__view.deleteStack(id, name);
    };
    VisualOps.prototype.duplicateStack = function(id) {
      return this.__view.duplicateStack(id);
    };
    VisualOps.prototype.startApp = function(id) {
      return this.__view.startApp(id);
    };
    VisualOps.prototype.stopApp = function(id) {
      return this.__view.stopApp(id);
    };
    VisualOps.prototype.terminateApp = function(id) {
      return this.__view.terminateApp(id);
    };
    VisualOps.prototype.discardAwsCache = function() {
      App.model.clearImportOps();
      return CloudResources.invalidate();
    };
    VisualOps.prototype.importJson = function(json) {
      var result;
      result = JsonExporter.importJson(json);
      if (_.isString(result)) {
        return result;
      }
      return this.openOps(this.model.createStackByJson(result));
    };
    VisualOps.prototype.openOps = function(opsModel, refresh) {
      var editor;
      if (!opsModel) {
        return;
      }
      if (_.isString(opsModel)) {
        opsModel = this.model.getOpsModelById(opsModel);
      }
      if (!opsModel) {
        console.warn("The OpsModel is not found when opening.");
        return;
      }
      if (opsModel.testState(OpsModel.State.Destroyed)) {
        console.error("The OpsModel is destroyed", opsModel);
        return;
      }
      editor = this.workspaces.find(opsModel);
      if (editor && refresh) {
        editor.remove();
        editor = null;
      }
      if (!editor) {
        editor = new OpsEditor(opsModel);
      }
      editor.activate();
      return editor;
    };
    VisualOps.prototype.createOps = function(region) {
      var editor;
      if (!region) {
        return;
      }
      editor = new OpsEditor(this.model.createStack(region));
      editor.activate();
      return editor;
    };
    return VisualOps;
  });

}).call(this);

(function() {
  define('Workspace',["backbone"], function() {
    var Workspace, wsid;
    wsid = 0;
    Workspace = (function() {
      function Workspace(attributes) {
        var ws, _i, _len, _ref;
        _ref = App.workspaces.spaces();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ws = _ref[_i];
          if (ws instanceof this.constructor && ws.isWorkingOn(attributes)) {
            console.info("Found a workspace that is working on, ", attributes, ws);
            return ws;
          }
        }
        this.id = "space_" + (++wsid);
        this.initialize(attributes);
        App.workspaces.add(this);
        return this;
      }

      Workspace.prototype.isAwake = function() {
        return App.workspaces.getAwakeSpace() === this;
      };

      Workspace.prototype.index = function() {
        return App.workspaces.spaces().indexOf(this);
      };

      Workspace.prototype.setIndex = function(idx) {
        return App.workspaces.setIndex(this, idx);
      };

      Workspace.prototype.isRemoved = function() {
        return !!this.__isRemoved;
      };

      Workspace.prototype.remove = function() {
        if (this.__isRemoved) {
          return;
        }
        this.__isRemoved = true;
        return App.workspaces.remove(this, true);
      };

      Workspace.prototype.updateTab = function() {
        return App.workspaces.update(this);
      };

      Workspace.prototype.activate = function() {
        return App.workspaces.awakeWorkspace(this);
      };


      /*
        Methods that should be override
       */

      Workspace.prototype.initialize = function(attributes) {};

      Workspace.prototype.isFixed = function() {
        return false;
      };

      Workspace.prototype.isModified = function() {
        return false;
      };

      Workspace.prototype.tabClass = function() {
        return "";
      };

      Workspace.prototype.title = function() {
        return "";
      };

      Workspace.prototype.awake = function() {
        if (this.view) {
          return this.view.$el.show();
        }
      };

      Workspace.prototype.sleep = function() {
        $(document.activeElement).filter("input, textarea").blur();
        if (this.view) {
          return this.view.$el.hide();
        }
      };

      Workspace.prototype.cleanup = function() {
        if (this.view) {
          this.view.remove();
        } else {
          console.warn("Cannot find @view when workspace is about to remove:", this);
        }
      };

      Workspace.prototype.isRemovable = function() {
        return true;
      };

      Workspace.prototype.isWorkingOn = function(attributes) {
        return false;
      };

      Workspace.prototype.updateUrl = function() {
        if (this.isAwake()) {
          Router.navigate(this.url(), {
            replace: true
          });
        }
      };

      return Workspace;

    })();
    _.extend(Workspace.prototype, Backbone.Events);
    return Workspace;
  });

}).call(this);

(function() {
  define('ide/Router',["backbone"], function() {
    return Backbone.Router.extend({
      routes: {
        "": "openDashboard"
      },
      initialize: function() {
        this.route(/^ops\/([^/]+$)/, "openOps");
        this.route(/^store\/([^/]+$)/, "openStore");
      },
      openStore: function(id) {
        var opsModel;
        opsModel = App.model.stackList().findWhere({
          sampleId: id
        });
        if (!opsModel) {
          opsModel = App.model.createSampleOps(id);
        }
        Router.navigate(opsModel.url(), {
          replace: true
        });
        App.openOps(opsModel);
      },
      openOps: function(id) {
        if (!App.openOps(id)) {
          Router.navigate("/", {
            replace: true
          });
        }
      },
      openDashboard: function() {
        if (window.Dashboard) {
          return window.Dashboard.activate();
        }
      },
      start: function() {
        if (!Backbone.history.start({
          pushState: true
        })) {
          console.warn("URL doesn't match any routes.");
          this.navigate("/", {
            replace: true
          });
        }
        this.route(/^ops\/([^/]+)/, "openOps");
      },
      execute: function() {
        this.__forceReplace = true;
        Backbone.Router.prototype.execute.apply(this, arguments);
        this.__forceReplace = false;
      },
      navigate: function(fragment, options) {
        if (this.__forceReplace) {
          options = options || {};
          options.replace = true;
        }
        return Backbone.Router.prototype.navigate.apply(this, arguments);
      }
    });
  });

}).call(this);

(function() {
  define('ide/AppBundle',["./Application", "OpsModel", "Workspace", "./Router"], function(Application) {
    return Application;
  });

}).call(this);

