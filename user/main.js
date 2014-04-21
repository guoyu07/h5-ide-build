(function() {
  var API_HOST, API_PROTO, COOKIE_OPTION, ajaxChangePassword, ajaxLogin, ajaxRegister, api, base64Decode, base64Encode, checkAllCookie, checkPassKey, checkUserExist, deepth, guid, handleErrorCode, handleNetError, i18n, ideHttps, init, l, langType, loadLang, render, sendEmail, setCredit, shouldIdeHttps, showErrorMessage, userRoute, validPassword, xhr;

  API_HOST = "api.visualops.io";

  API_PROTO = "http://";

  shouldIdeHttps = false;

  ideHttps = true;


  /* env:debug */

  API_HOST = "api.mc3.io";

  ideHttps = false;


  /* env:debug:end */


  /* env:dev                                                  env:dev:end */


  /* AHACKFORRELEASINGPUBLICVERSION */

  shouldIdeHttps = ideHttps;

  API_PROTO = "https://";


  /* AHACKFORRELEASINGPUBLICVERSION */

  l = window.location;

  window.language = window.version = "";

  if (shouldIdeHttps && l.protocol === "http:") {
    window.location = l.href.replace("http:", "https:");
    return;
  }

  COOKIE_OPTION = {
    expires: 30,
    path: '/'
  };

  xhr = null;

  base64Encode = function(string) {
    return window.btoa(unescape(encodeURIComponent(string)));
  };

  base64Decode = function(string) {
    return decodeURIComponent(escape(window.atob(string)));
  };

  checkAllCookie = function() {
    if ($.cookie('usercode') && $.cookie('username') && $.cookie('session_id') && $.cookie('account_id') && $.cookie('mod_repo') && $.cookie('mod_tag') && $.cookie('state') && $.cookie('has_cred')) {
      return true;
    } else {
      return false;
    }
  };

  langType = function() {
    return document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + "lang\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1") || "en-us";
  };

  deepth = 'reset';

  userRoute = function(routes) {
    var hashArray, pathArray, _name;
    hashArray = window.location.hash.split('#').pop().split('/');
    pathArray = window.location.pathname.split('/');
    pathArray.shift();
    console.log(pathArray, hashArray);
    return typeof routes[_name = pathArray[0]] === "function" ? routes[_name](pathArray, hashArray) : void 0;
  };

  guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r, v;
      r = Math.random() * 16 | 0;
      v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    }).toUpperCase();
  };

  api = function(option) {
    xhr = $.ajax({
      url: API_PROTO + API_HOST + option.url,
      dataType: 'json',
      type: 'POST',
      data: JSON.stringify({
        jsonrpc: '2.0',
        id: guid(),
        method: option.method || '',
        params: option.data || {}
      }),
      success: function(res) {
        return option.success(res.result[1], res.result[0]);
      },
      error: function(xhr, status, error) {
        console.log(error);
        return option.error(status, -1);
      }
    });
    return console.log('Sending Ajax Request');
  };

  Handlebars.registerHelper('i18n', function(str) {
    return (typeof i18n === "function" ? i18n(str) : void 0) || str;
  });

  loadLang = function(cb) {
    return $.ajax({
      url: './nls/' + langType() + '/lang.js',
      jsonp: false,
      dataType: "jsonp",
      jsonpCallback: "define",
      beforeSend: function() {
        var template;
        template = Handlebars.compile($("#loading-template").html());
        return $("#main-body").html(template());
      },
      success: function(data) {
        window.langsrc = data;
        return console.log('Success', data);
      },
      error: function(error) {
        window.location = "/500";
        return console.log(error, "error");
      }
    }).done(function() {
      console.log('Loaded!', langsrc);
      return cb();
    });
  };

  window.onhashchange = function() {
    return init();
  };

  i18n = function(str) {
    return langsrc[deepth][str];
  };

  render = function(tempName) {
    var template;
    template = Handlebars.compile($(tempName).html());
    return $("#main-body").html(template());
  };

  init = function() {
    var browser, safari, support, ua;
    ua = navigator.userAgent.toLowerCase();
    browser = /(chrome)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
    support = {
      chrome: 10,
      webkit: 6,
      msie: 10,
      mozilla: 4,
      opera: 10
    };
    if (browser[1] === "webkit") {
      safari = /version\/([\d\.]+).*safari/.exec(ua);
      if (safari) {
        browser[2] = safari[1];
      }
    }
    if ((parseInt(browser[2], 10) || 0) < support[browser[1]]) {
      $("header").after('<div id="unsupported-browser"><p>MadeiraCloud IDE does not support the browser you are using.</p> <p>For a better experience, we suggest you use the latest version of <a href="https://www.google.com/intl/en/chrome/browser/" target="_blank">Chrome</a>, <a href="http://www.mozilla.org/en-US/firefox/all/" target="_blank">Firefox</a> or <a href="http://windows.microsoft.com/en-us/internet-explorer/download-ie" target="_blank">IE</a>.</p></div>');
    }
    return userRoute({
      "reset": function(pathArray, hashArray) {
        var hashTarget;
        deepth = 'reset';
        hashTarget = hashArray[0];
        if (hashTarget === 'password') {
          return checkPassKey(hashArray[1], function(result) {
            if (result) {
              console.log('Right Verify Code!');
              render("#password-template");
              $('form.box-body').find('input').eq(0).focus();
              return $('#reset-form').on('submit', function(e) {
                e.preventDefault();
                if (validPassword()) {
                  $("#reset-password").attr('disabled', true).val(langsrc.reset.reset_waiting);
                  ajaxChangePassword(hashArray, $("#reset-pw").val());
                  console.log('jump...');
                }
                return false;
              });
            } else {
              window.location.hash = "expire";
              return console.log("Error Verify Code!");
            }
          });
        } else if (hashTarget === "expire") {
          return render('#expire-template');
        } else if (hashTarget === "email") {
          render("#email-template");
          return $('form.box-body').find('input').eq(0).focus();
        } else if (hashTarget === "success") {
          return render("#success-template");
        } else {
          render('#default-template');
          $("#reset-pw-email").focus();
          $('#reset-pw-email').keyup(function() {
            if (this.value) {
              return $('#reset-btn').removeAttr('disabled');
            } else {
              return $("#reset-btn").attr('disabled', true);
            }
          });
          return $('#reset-form').on('submit', function() {
            console.log('sendding....');
            $('#reset-pw-email').off('keyup');
            $("#reset-btn").attr('disabled', true);
            $("#reset-pw-email").attr('disabled', true);
            $('#reset-btn').val(window.langsrc.reset.reset_waiting);
            sendEmail($("#reset-pw-email").val());
            return false;
          });
        }
      },
      'login': function(pathArray, hashArray) {
        var $password, $user, checkValid, submitBtn;
        if (checkAllCookie()) {
          window.location = '/';
        }
        deepth = 'login';
        console.log(pathArray, hashArray);
        render("#login-template");
        $user = $("#login-user");
        $password = $("#login-password");
        submitBtn = $("#login-btn").attr('disabled', false);
        $("#login-form input").eq(0).focus();
        checkValid = function() {
          if ($(this).val().trim()) {
            return $(this).parent().removeClass('error');
          }
        };
        $user.on('keyup', checkValid);
        $password.on('keyup', checkValid);
        return $("#login-form").on('submit', function(e) {
          e.preventDefault();
          if ($user.val() && $password.val()) {
            $(".error-msg").hide();
            $(".control-group").removeClass('error');
            submitBtn.attr('disabled', true).val(langsrc.reset.reset_waiting);
            return ajaxLogin([$user.val(), $password.val()], function(statusCode) {
              $('#error-msg-1').show();
              return submitBtn.attr('disabled', false).val(langsrc.login['login-btn']);
            });
          } else {
            $("#error-msg-2").show();
            if (!$user.val().trim()) {
              $user.parent().addClass('error');
            } else {
              $user.parent().removeClass('error');
            }
            if (!$password.val().trim()) {
              $password.parent().addClass('error');
            } else {
              $password.parent().removeClass('error');
            }
            return false;
          }
        });
      },
      'register': function(pathArray, hashArray) {
        var $email, $form, $password, $username, ajaxCheckEmail, ajaxCheckUsername, checkEmail, checkPassword, checkUsername, emailTimeout, resetRegForm, usernameTimeout;
        deepth = 'register';
        console.log(pathArray, hashArray);
        if (hashArray[0] === 'success') {
          render("#success-template");
          $('#register-get-start').click(function() {
            window.location = "/";
            return console.log('Getting start...');
          });
          return false;
        }
        if (checkAllCookie()) {
          window.location = '/';
        }
        render('#register-template');
        $form = $("#register-form");
        $form.find('input').eq(0).focus();
        $username = $('#register-username');
        $email = $('#register-email');
        $password = $('#register-password');
        usernameTimeout = void 0;
        emailTimeout = void 0;
        $('#register-btn').attr('disabled', false);
        checkUsername = function(e, cb) {
          var status, username;
          username = $username.val();
          status = $('#username-verification-status');
          if (username.trim() !== "") {
            if (/[^A-Za-z0-9\_]{1}/.test(username) !== true) {
              if (username.length > 40) {
                status.removeClass('verification-status').addClass('error-status').text(langsrc.register.username_maxlength);
                if (cb) {
                  return cb(0);
                } else {
                  return false;
                }
              } else {
                if (status.hasClass('error-status')) {
                  status.removeClass('verification-status').removeClass('error-status').text("");
                }
                if (cb) {
                  return ajaxCheckUsername(username, status, cb);
                } else {
                  return true;
                }
              }
            } else {
              status.removeClass('verification-status').addClass('error-status').text(langsrc.register.username_not_matched);
              if (cb) {
                return cb(0);
              } else {
                return false;
              }
            }
          } else {
            status.removeClass('verification-status').addClass('error-status').text(langsrc.register.username_required);
            if (cb) {
              return cb(0);
            } else {
              return false;
            }
          }
        };
        checkEmail = function(e, cb, weak) {
          var email, reg_str, status;
          email = $email.val();
          status = $("#email-verification-status");
          reg_str = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if (email.trim() !== "") {
            if (reg_str.test(email)) {
              if (status.hasClass('error-status')) {
                status.removeClass('verification-status').removeClass('error-status').text("");
              }
              if (cb) {
                return ajaxCheckEmail(email, status, cb);
              } else {
                return true;
              }
            } else {
              status.removeClass('verification-status').addClass('error-status').text(langsrc.register.email_not_valid);
              if (cb) {
                return cb(0);
              } else {
                return false;
              }
            }
          } else {
            status.removeClass('verification-status').addClass('error-status').text(langsrc.register.email_required);
            if (cb) {
              return cb(0);
            } else {
              return false;
            }
          }
        };
        checkPassword = function(e, cb) {
          var password, status;
          password = $password.val();
          status = $("#password-verification-status");
          if (password !== "") {
            if (password.length > 5) {
              status.removeClass('verification-status').removeClass('error-status').text("");
              if (cb) {
                return cb(1);
              } else {
                return true;
              }
            } else {
              status.removeClass('verification-status').addClass('error-status').text(langsrc.register.password_shorter);
              if (cb) {
                return cb(0);
              } else {
                return false;
              }
            }
          } else {
            status.removeClass('verification-status').addClass('error-status').text(langsrc.register.password_required);
            if (cb) {
              return cb();
            } else {
              return false;
            }
          }
        };
        ajaxCheckUsername = function(username, status, cb) {
          if (xhr != null) {
            xhr.abort();
          }
          window.clearTimeout(usernameTimeout);
          console.log('aborted!', usernameTimeout);
          usernameTimeout = window.setTimeout(function() {
            return checkUserExist([username, null], function(statusCode) {
              if (!statusCode) {
                if (!checkUsername()) {
                  return false;
                }
                status.removeClass('error-status').addClass('verification-status').show().text(langsrc.register.username_available);
                return typeof cb === "function" ? cb(1) : void 0;
              } else if (statusCode === 'error') {
                return console.log('Net Work Error while');
              } else {
                status.removeClass('verification-status').addClass('error-status').text(langsrc.register.username_taken);
                return typeof cb === "function" ? cb(0) : void 0;
              }
            });
          }, 500);
          return console.log('Setup a new validation request');
        };
        ajaxCheckEmail = function(email, status, cb) {
          if (xhr != null) {
            xhr.abort();
          }
          window.clearTimeout(emailTimeout);
          emailTimeout = window.setTimeout(function() {
            return checkUserExist([null, email], function(statusCode) {
              if (!statusCode) {
                if (!checkEmail()) {
                  return false;
                }
                status.removeClass('error-status').addClass('verification-status').show().text(langsrc.register.email_available);
                return typeof cb === "function" ? cb(1) : void 0;
              } else if (statusCode === 'error') {
                return console.log("NetWork Error");
              } else {
                status.removeClass('verification-status').addClass('error-status').text(langsrc.register.email_used);
                return typeof cb === "function" ? cb(0) : void 0;
              }
            });
          }, 500);
          return console.log('Set up a new validation request');
        };
        resetRegForm = function(force) {
          if (force) {
            $(".verification-status").removeAttr('style');
            $('.error-status').removeClass('error-status');
          }
          return $('#register-btn').attr('disabled', false).val(langsrc.register['register-btn']);
        };
        $username.on('keyup blur change', function(e) {
          return checkUsername(e, function(a) {
            if (!a) {
              resetRegForm();
            }
            return a;
          });
        });
        $email.on('keyup blur change', function(e) {
          return checkEmail(e, function(a) {
            if (!a) {
              resetRegForm();
            }
            return a;
          });
        });
        $password.on('keyup blur change', function(e) {
          return checkPassword(e, function(a) {
            if (!a) {
              resetRegForm();
            }
            return a;
          });
        });
        return $form.on('submit', function(e) {
          var emailResult, passwordResult, userResult;
          e.preventDefault();
          $('.error-msg').removeAttr('style');
          if ($username.next().hasClass('error-status') || $email.next().hasClass('error-status')) {
            console.log("Error Message Exist");
            return false;
          }
          userResult = checkUsername();
          emailResult = checkEmail();
          passwordResult = checkPassword();
          if (!(userResult && emailResult && passwordResult)) {
            return false;
          }
          $('#register-btn').attr('disabled', true).val(langsrc.register.reginster_waiting);
          console.log('check user input here.');
          return checkUsername(e, function(usernameAvl) {
            if (!usernameAvl) {
              resetRegForm();
              return false;
            }
            return checkEmail(e, function(emailAvl) {
              if (!emailAvl) {
                resetRegForm();
                return false;
              }
              return checkPassword(e, function(passwordAvl) {
                if (!passwordAvl) {
                  resetRegForm();
                  return false;
                }
                if (usernameAvl && emailAvl && passwordAvl) {
                  console.log('Success!!!!!');
                  return ajaxRegister([$username.val(), $password.val(), $email.val()], function(statusCode) {
                    resetRegForm(true);
                    $("#register-status").show().text(langsrc.service['ERROR_CODE_' + statusCode + '_MESSAGE']);
                    return false;
                  });
                }
              });
            });
          });
        });
      }
    });
  };

  validPassword = function() {
    var status, value;
    status = $("#password-verification-status");
    value = $("#reset-pw").val();
    status.removeClass('error-status');
    if (value !== "") {
      if (value.length > 5) {
        status.hide();
        return true;
      } else {
        status.addClass("error-status").show().text(langsrc.reset.reset_password_shorter);
        return false;
      }
    } else {
      status.addClass("error-status").show().text(langsrc.reset.reset_password_required);
      return false;
    }
  };

  showErrorMessage = function() {
    console.log('showErrorMessage');
    $('#reset-pw-email').attr('disabled', false);
    $("#reset-btn").attr('disabled', false).val(window.langsrc.reset.reset_btn);
    $("#email-verification-status").removeClass('verification-status').addClass("error-msg").show().text(langsrc.reset.reset_error_state);
    return false;
  };

  handleErrorCode = function(statusCode) {
    return console.error('ERROR_CODE_MESSAGE', langsrc.service["ERROR_CODE_" + statusCode + "_MESSAGE"]);
  };

  handleNetError = function(status) {
    window.location = '/500';
    return console.error(status, "Net Work Error, Redirecting...");
  };

  checkPassKey = function(keyToValid, fn) {
    return api({
      url: '/account/',
      method: 'check_validation',
      data: [keyToValid, 'reset'],
      success: function(result, statusCode) {
        if (!statusCode) {
          console.log(result);
          return fn(true);
        } else {
          handleErrorCode(statusCode);
          return fn(false);
        }
      },
      error: function(status) {
        return handleNetError(status);
      }
    });
  };

  setCredit = function(result) {
    var cValue, ckey, domain, key, session_info, value, _ref;
    domain = {
      "domain": window.location.hostname.replace("ide", "")
    };
    _ref = $.cookie();
    for (ckey in _ref) {
      cValue = _ref[ckey];
      if (ckey !== "notice-sn") {
        $.removeCookie(ckey, domain);
      }
    }
    session_info = {
      usercode: result[0],
      username: base64Decode(result[0]),
      email: result[1],
      user_hash: result[2],
      session_id: result[3],
      account_id: result[4],
      mod_repo: result[5],
      mod_tag: result[6],
      state: result[7],
      has_cred: result[8]
    };
    for (key in session_info) {
      value = session_info[key];
      $.cookie(key, value, COOKIE_OPTION);
    }
    return $.cookie("has_session", !!session_info.session_id, {
      domain: window.location.hostname.replace("ide", ""),
      path: "/",
      expires: 30
    });
  };

  ajaxRegister = function(params, errorCB) {
    console.log(params);
    return api({
      url: '/account/',
      method: 'register',
      data: params,
      success: function(result, statusCode) {
        if (!statusCode) {
          setCredit(result);
          window.location.hash = "success";
          return console.log('registered successfully');
        } else {
          return errorCB(statusCode);
        }
      },
      error: function(status) {
        return handleNetError(status);
      }
    });
  };

  ajaxLogin = function(params, errorCB) {
    return api({
      url: '/session/',
      method: 'login',
      data: params,
      success: function(result, statusCode) {
        if (!statusCode) {
          setCredit(result);
          window.location = '/';
          return console.log('Login Now!');
        } else {
          return errorCB(statusCode);
        }
      },
      error: function(status) {
        return handleNetError(status);
      }
    });
  };

  sendEmail = function(params) {
    return checkUserExist([params, null], function(statusCode) {
      if (!statusCode) {
        showErrorMessage();
        return false;
      }
      return api({
        url: '/account/',
        method: 'reset_password',
        data: [params],
        success: function(result, statusCode) {
          if (!statusCode) {
            console.log(result, statusCode);
            window.location.hash = 'email';
            return true;
          } else {
            handleErrorCode(statusCode);
            showErrorMessage();
            return false;
          }
        },
        error: function(status) {
          return handleNetError(status);
        }
      });
    });
  };

  checkUserExist = function(params, fn) {
    return api({
      url: '/account/',
      method: 'check_repeat',
      data: params,
      success: function(result, statusCode) {
        console.log(result, statusCode);
        return fn(statusCode);
      },
      error: function(status) {
        console.log('Net Work Error');
        return fn('error');
      }
    });
  };

  ajaxChangePassword = function(hashArray, newPw) {
    api({
      url: "/account/",
      method: "update_password",
      data: [hashArray[1], newPw],
      success: function(result, statusCode) {
        console.log(result, statusCode);
        if (!statusCode) {
          window.location.hash = 'success';
          return console.log('Password Updated Successfully');
        } else {
          return handleErrorCode(statusCode);
        }
      },
      error: function(status) {
        return handleNetError(status);
      }
    });
    return console.log('Updating Password...');
  };

  loadLang(init);

}).call(this);
