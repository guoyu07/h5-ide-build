(function(){define(["jquery","event"],function(e,t){var n,r,i;return n=function(){return require(["./component/session/session_view"],function(e){var t;if(modal&&modal.isPopup())return;return t=new e,t.render(),t.on("CLOSE_POPUP",function(){return i(t)}),t.on("OPEN_RECONNECT",function(){return r()})})},r=function(){return require(["./component/session/reconnect_view","./component/session/model"],function(e,n){var r,s;if(modal&&modal.isPopup())return;return s=new e,r=new n,s.render(),s.on("RE_LOGIN",function(e){return r.relogin(e)}),s.on("CLOSE_POPUP",function(){return i(s,r)}),r.on("RE_LOGIN_SCUCCCESS",function(){t.trigger(t.UPDATE_APP_LIST),t.trigger(t.UPDATE_DASHBOARD),t.trigger(t.RECONNECT_WEBSOCKET),s.close(),MC.data.is_loading_complete||(window.location.href="/")}),r.on("RE_LOGIN_FAILED",function(){return s.invalid()})})},i=function(e,t){void 0,e.off(),e.undelegateEvents(),e=null;if(!t)return;t.off(),t=null},{loadModule:n,unLoadModule:i}})}).call(this);