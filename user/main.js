(function(){var e,t,n,r,i,s,o,u,a,f,l,c,h,p,d,v,m,g,y,b,w,E,S,x,T,N,C,k,L,A;e="api.visualops.io",t="http://",N=!1,g=!0,N=g,t="https://",b=window.location,window.language=window.version="";if(N&&b.protocol==="http:"){window.location=b.href.replace("http:","https:");return}n={expires:30,path:"/"},A=null,a=function(e){return window.btoa(unescape(encodeURIComponent(e)))},u=function(e){return decodeURIComponent(escape(window.atob(e)))},f=function(){return $.cookie("usercode")&&$.cookie("username")&&$.cookie("session_id")&&$.cookie("account_id")&&$.cookie("mod_repo")&&$.cookie("mod_tag")&&$.cookie("state")&&$.cookie("has_cred")?!0:!1},w=function(){return document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*lang\\s*\\=\\s*([^;]*).*$)|^.*$"),"$1")||"en-us"},h="reset",k=function(e){var t,n,r;return t=window.location.hash.split("#").pop().split("/"),n=window.location.pathname.split("/"),n.shift(),void 0,typeof e[r=n[0]]=="function"?e[r](n,t):void 0},p=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t,n;return t=Math.random()*16|0,n=e==="x"?t:t&3|8,n.toString(16)}).toUpperCase()},o=function(n){return A=$.ajax({url:t+e+n.url,dataType:"json",type:"POST",data:JSON.stringify({jsonrpc:"2.0",id:p(),method:n.method||"",params:n.data||{}}),success:function(e){return n.success(e.result[1],e.result[0])},error:function(e,t,r){return void 0,n.error(t,-1)}}),void 0},Handlebars.registerHelper("i18n",function(e){return(typeof m=="function"?m(e):void 0)||e}),E=function(e){return $.ajax({url:"./nls/"+w()+"/lang.js",jsonp:!1,dataType:"jsonp",jsonpCallback:"define",beforeSend:function(){var e;return e=Handlebars.compile($("#loading-template").html()),$("#main-body").html(e())},success:function(e){return window.langsrc=e,void 0},error:function(e){return window.location="/500",void 0}}).done(function(){return void 0,e()})},window.onhashchange=function(){return y()},m=function(e){return langsrc[h][e]},S=function(e){var t;return t=Handlebars.compile($(e).html()),$("#main-body").html(t())},y=function(){var e,t,n,o;return o=navigator.userAgent.toLowerCase(),e=/(chrome)[ \/]([\w.]+)/.exec(o)||/(webkit)[ \/]([\w.]+)/.exec(o)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(o)||/(msie) ([\w.]+)/.exec(o)||o.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(o)||[],n={chrome:10,webkit:6,msie:10,mozilla:4,opera:10},e[1]==="webkit"&&(t=/version\/([\d\.]+).*safari/.exec(o),t&&(e[2]=t[1])),(parseInt(e[2],10)||0)>=n[e[1]]||$("header").after('<div id="unsupported-browser"><p>MadeiraCloud IDE does not support the browser you are using.</p> <p>For a better experience, we suggest you use the latest version of <a href="https://www.google.com/intl/en/chrome/browser/" target="_blank">Chrome</a>, <a href="http://www.mozilla.org/en-US/firefox/all/" target="_blank">Firefox</a> or <a href="http://windows.microsoft.com/en-us/internet-explorer/download-ie" target="_blank">IE</a>.</p></div>'),k({reset:function(e,t){var n;return h="reset",n=t[0],n==="password"?l(t[1],function(e){return e?(void 0,S("#password-template"),$("form.box-body").find("input").eq(0).focus(),$("#reset-form").on("submit",function(e){return e.preventDefault(),L()&&($("#reset-password").attr("disabled",!0).val(langsrc.reset.reset_waiting),r(t,$("#reset-pw").val()),void 0),!1})):(window.location.hash="expire",void 0)}):n==="expire"?S("#expire-template"):n==="email"?(S("#email-template"),$("form.box-body").find("input").eq(0).focus()):n==="success"?S("#success-template"):(S("#default-template"),$("#reset-pw-email").focus(),$("#reset-pw-email").keyup(function(){return this.value?$("#reset-btn").removeAttr("disabled"):$("#reset-btn").attr("disabled",!0)}),$("#reset-form").on("submit",function(){return void 0,$("#reset-pw-email").off("keyup"),$("#reset-btn").attr("disabled",!0),$("#reset-pw-email").attr("disabled",!0),$("#reset-btn").val(window.langsrc.reset.reset_waiting),x($("#reset-pw-email").val()),!1}))},login:function(e,t){var n,r,s,o;return f()&&(window.location="/"),h="login",void 0,S("#login-template"),r=$("#login-user"),n=$("#login-password"),o=$("#login-btn").attr("disabled",!1),$("#login-form input").eq(0).focus(),s=function(){if($(this).val().trim())return $(this).parent().removeClass("error")},r.on("keyup",s),n.on("keyup",s),$("#login-form").on("submit",function(e){return e.preventDefault(),r.val()&&n.val()?($(".error-msg").hide(),$(".control-group").removeClass("error"),o.attr("disabled",!0).val(langsrc.reset.reset_waiting),i([r.val(),n.val()],function(e){return $("#error-msg-1").show(),o.attr("disabled",!1).val(langsrc.login["login-btn"])})):($("#error-msg-2").show(),r.val().trim()?r.parent().removeClass("error"):r.parent().addClass("error"),n.val().trim()?n.parent().removeClass("error"):n.parent().addClass("error"),!1)})},register:function(e,t){var n,r,i,o,u,a,l,p,d,v,m,g;return h="register",void 0,t[0]==="success"?(S("#success-template"),$("#register-get-start").click(function(){return window.location="/",void 0}),!1):(f()&&(window.location="/"),S("#register-template"),r=$("#register-form"),r.find("input").eq(0).focus(),o=$("#register-username"),n=$("#register-email"),i=$("#register-password"),g=void 0,v=void 0,$("#register-btn").attr("disabled",!1),d=function(e,t){var n,r;return r=o.val(),n=$("#username-verification-status"),r.trim()!==""?/[^A-Za-z0-9\_]{1}/.test(r)!==!0?r.length>40?(n.removeClass("verification-status").addClass("error-status").text(langsrc.register.username_maxlength),t?t(0):!1):(n.hasClass("error-status")&&n.removeClass("verification-status").removeClass("error-status").text(""),t?a(r,n,t):!0):(n.removeClass("verification-status").addClass("error-status").text(langsrc.register.username_not_matched),t?t(0):!1):(n.removeClass("verification-status").addClass("error-status").text(langsrc.register.username_required),t?t(0):!1)},l=function(e,t,r){var i,s,o;return i=n.val(),o=$("#email-verification-status"),s=/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,i.trim()!==""?s.test(i)?(o.hasClass("error-status")&&o.removeClass("verification-status").removeClass("error-status").text(""),t?u(i,o,t):!0):(o.removeClass("verification-status").addClass("error-status").text(langsrc.register.email_not_valid),t?t(0):!1):(o.removeClass("verification-status").addClass("error-status").text(langsrc.register.email_required),t?t(0):!1)},p=function(e,t){var n,r;return n=i.val(),r=$("#password-verification-status"),n!==""?n.length>5?(r.removeClass("verification-status").removeClass("error-status").text(""),t?t(1):!0):(r.removeClass("verification-status").addClass("error-status").text(langsrc.register.password_shorter),t?t(0):!1):(r.removeClass("verification-status").addClass("error-status").text(langsrc.register.password_required),t?t():!1)},a=function(e,t,n){return A!=null&&A.abort(),window.clearTimeout(g),void 0,g=window.setTimeout(function(){return c([e,null],function(e){return e?e==="error"?void 0:(t.removeClass("verification-status").addClass("error-status").text(langsrc.register.username_taken),typeof n=="function"?n(0):void 0):d()?(t.removeClass("error-status").addClass("verification-status").show().text(langsrc.register.username_available),typeof n=="function"?n(1):void 0):!1})},500),void 0},u=function(e,t,n){return A!=null&&A.abort(),window.clearTimeout(v),v=window.setTimeout(function(){return c([null,e],function(e){return e?e==="error"?void 0:(t.removeClass("verification-status").addClass("error-status").text(langsrc.register.email_used),typeof n=="function"?n(0):void 0):l()?(t.removeClass("error-status").addClass("verification-status").show().text(langsrc.register.email_available),typeof n=="function"?n(1):void 0):!1})},500),void 0},m=function(e){return e&&($(".verification-status").removeAttr("style"),$(".error-status").removeClass("error-status")),$("#register-btn").attr("disabled",!1).val(langsrc.register["register-btn"])},o.on("keyup",function(e){return d(e,function(e){return e||m(),e})}),n.on("keyup",function(e){return l(e,function(e){return e||m(),e})}),i.on("keyup",function(e){return p(e,function(e){return e||m(),e})}),r.on("submit",function(e){var t,r,u;return e.preventDefault(),$(".error-msg").removeAttr("style"),o.next().hasClass("error-status")||n.next().hasClass("error-status")?(void 0,!1):(u=d(),t=l(),r=p(),u&&t&&r?($("#register-btn").attr("disabled",!0).val(langsrc.register.reginster_waiting),void 0,d(e,function(t){return t?l(e,function(r){return r?p(e,function(e){if(!e)return m(),!1;if(t&&r&&e)return void 0,s([o.val(),i.val(),n.val()],function(e){return m(!0),$("#register-status").show().text(langsrc.service["ERROR_CODE_"+e+"_MESSAGE"]),!1})}):(m(),!1)}):(m(),!1)})):!1)}))}})},L=function(){var e,t;return e=$("#password-verification-status"),t=$("#reset-pw").val(),e.removeClass("error-status"),t!==""?t.length>5?(e.hide(),!0):(e.addClass("error-status").show().text(langsrc.reset.reset_password_shorter),!1):(e.addClass("error-status").show().text(langsrc.reset.reset_password_required),!1)},C=function(){return void 0,$("#reset-pw-email").attr("disabled",!1),$("#reset-btn").attr("disabled",!1).val(window.langsrc.reset.reset_btn),$("#email-verification-status").removeClass("verification-status").addClass("error-msg").show().text(langsrc.reset.reset_error_state),!1},d=function(e){return void 0},v=function(e){return window.location="/500",void 0},l=function(e,t){return o({url:"/account/",method:"check_validation",data:[e,"reset"],success:function(e,n){return n?(d(n),t(!1)):(void 0,t(!0))},error:function(e){return v(e)}})},T=function(e){var t,r,i,s;r={usercode:e[0],username:u(e[0]),email:e[1],user_hash:e[2],session_id:e[3],account_id:e[4],mod_repo:e[5],mod_tag:e[6],state:e[7],has_cred:e[8]},s=[];for(t in r)i=r[t],s.push($.cookie(t,i,n));return s},s=function(e,t){return void 0,o({url:"/account/",method:"register",data:e,success:function(e,n){return n?t(n):(T(e),window.location.hash="success",void 0)},error:function(e){return v(e)}})},i=function(e,t){return o({url:"/session/",method:"login",data:e,success:function(e,n){return n?t(n):(T(e),window.location="/",void 0)},error:function(e){return v(e)}})},x=function(e){return c([e,null],function(t){return t?o({url:"/account/",method:"reset_password",data:[e],success:function(e,t){return t?(d(t),C(),!1):(void 0,window.location.hash="email",!0)},error:function(e){return v(e)}}):(C(),!1)})},c=function(e,t){return o({url:"/account/",method:"check_repeat",data:e,success:function(e,n){return void 0,t(n)},error:function(e){return void 0,t("error")}})},r=function(e,t){return o({url:"/account/",method:"update_password",data:[e[1],t],success:function(e,t){return void 0,t?d(t):(window.location.hash="success",void 0)},error:function(e){return v(e)}}),void 0},E(y)}).call(this);