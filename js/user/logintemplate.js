define(["handlebars"],function(e){var t=function(e,t,n,r,i){this.compilerInfo=[4,">= 1.0.0"],n=this.merge(n,e.helpers),i=i||{};var s="",o=this.escapeExpression;return s+='<div id="login-box" class="box-wrapper clearfix">\n	<div id="login-title" class="box-header">\n		<h2>'+o(n.i18n.call(t,"login",{hash:{},data:i}))+'</h2><div id="login-register"  class="title-link">'+o(n.i18n.call(t,"login-register",{hash:{},data:i}))+'<a href="/register" id="link-register">'+o(n.i18n.call(t,"link-register",{hash:{},data:i}))+'</a></div>\n	</div>\n	<form id="login-form" method="post" class="box-body">\n		<div class="error-msg" id="error-msg-1">'+o(n.i18n.call(t,"error-msg-1",{hash:{},data:i}))+'</div>\n		<div class="error-msg" id="error-msg-2">'+o(n.i18n.call(t,"error-msg-2",{hash:{},data:i}))+'</div>\n		<div class="control-group">\n			<input autocomplete="off" id="login-user" placeholder="'+o(n.i18n.call(t,"login-user",{hash:{},data:i}))+'" type="text" class="account-input" name="user_name"/>\n			<label for="login-user" class="icon-user login-label"></label>\n		</div>\n		<div class="control-group">\n			<input autocomplete="off" id="login-password" placeholder="'+o(n.i18n.call(t,"login-password",{hash:{},data:i}))+'" type="password" class="account-input" name="password"/>\n			<label for="login-password" class="icon-password login-label"></label>\n		</div>\n		<div class="account-btn-wrap">\n			<a href="/reset" id="link-foget" class="footer-link">'+o(n.i18n.call(t,"link-foget",{hash:{},data:i}))+'</a>\n			<input id="login-btn" type="submit" value="'+o(n.i18n.call(t,"login-btn",{hash:{},data:i}))+'" class="btn btn-primary btn-large account-btn" data-loading-text="'+o(n.i18n.call(t,"login-loading",{hash:{},data:i}))+'" disabled/>\n		</div>\n	</form>\n</div>\n<div id="footer-push"></div>\n',s};return e.template(t)});