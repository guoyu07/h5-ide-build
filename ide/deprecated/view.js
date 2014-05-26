(function(){define(["event","i18n!nls/lang.js","common_handle","UI.notification","UI.tour","backbone","jquery","handlebars","underscore"],function(e,t,n){var r,i;return r=Backbone.View.extend({el:$("#main"),delay:null,open_fail:!1,initialize:function(){return $(window).on("beforeunload",this.beforeunloadEvent),$(document).on("keydown",this.globalKeyEvent),$(window).on("focus",function(){if(App&&App.openSampleStack)return App.openSampleStack()})},showMain:function(){var e,t;t=this,void 0,$("#waiting-bar-wrapper").hasClass("waiting-bar")&&this.toggleWaiting(),this.delay&&clearTimeout(this.delay),MC.data.loading_wrapper_html||(MC.data.loading_wrapper_html=$("#loading-bar-wrapper").html());if($("#loading-bar-wrapper").html().trim()==="")return;return e=$("#loading-bar-wrapper").find("div"),e.fadeOut("normal",function(){return e.remove(),$("#wrapper").removeClass("main-content")}),this.open_fail||delete MC.open_failed_list[MC.data.current_tab_id],this.open_fail=!1,null},showLoading:function(t,n){var r;return void 0,$("#loading-bar-wrapper").html(n?MC.template.loadingTransparent():MC.data.loading_wrapper_html),r=this,this.delay=setTimeout(function(){void 0;if($("#loading-bar-wrapper").html().trim()!=="")return r.open_fail=!0,e.trigger(e.SWITCH_MAIN),e.trigger(e.SHOW_DESIGN_OVERLAY,"OPEN_TAB_FAIL",t)},3e4),null},toggleWaiting:function(){return void 0,$("#waiting-bar-wrapper").removeClass("waiting-bar"),this.hideStatubar()},showDashbaordTab:function(){return void 0,void 0,MC.data.dashboard_type==="OVERVIEW_TAB"?this.showOverviewTab():this.showRegionTab(),this.hideStatubar()},showOverviewTab:function(){return void 0,$("#tab-content-dashboard").addClass("active"),$("#tab-content-region").removeClass("active"),$("#tab-content-design").removeClass("active"),$("#tab-content-process").removeClass("active")},showRegionTab:function(){return void 0,$("#tab-content-region").addClass("active"),$("#tab-content-dashboard").removeClass("active"),$("#tab-content-design").removeClass("active"),$("#tab-content-process").removeClass("active")},showTab:function(){return void 0,$("#tab-content-design").addClass("active"),$("#tab-content-dashboard").removeClass("active"),$("#tab-content-region").removeClass("active"),$("#tab-content-process").removeClass("active"),this.hideStatubar(),null},showProcessTab:function(){return void 0,$("#tab-content-process").addClass("active"),$("#tab-content-dashboard").removeClass("active"),$("#tab-content-region").removeClass("active"),$("#tab-content-design").removeClass("active"),this.hideStatubar()},beforeunloadEvent:function(){var e,n,r;if(MC.browser==="msie"&&MC.browserVersion===10)return;if(!(App&&App.user&&App.user.get("session")))return;return n=!0,e=null,!_.isEmpty(MC.common.other.canvasData.data())&&!_.isEmpty(MC.common.other.canvasData.origin())&&(r=Tabbar.current)!=="dashboard"&&r!=="appview"&&r!=="process"?(MC.common.other.canvasData.isModified()?n=!1:void 0,e=MC.common.other.canvasData.get("id")):void 0,_.each(MC.tab,function(t,r){return void 0,r.split("-")[0]==="appview"?void 0:!_.isEqual(t.data,t.origin_data)&&r!==e?n=!1:void 0,n}),void 0,n?void 0:t.ide.BEFOREUNLOAD_MESSAGE},hideStatubar:function(){void 0;if($.trim($("#status-bar-modal").html()))return $("#status-bar-modal").empty(),$("#status-bar-modal").hide(),e.trigger(e.UNLOAD_TA_MODAL)},globalKeyEvent:function(e){var t;t=e.target.nodeName.toLowerCase();if(e.which===8&&t!=="input"&&t!=="textarea"&&e.target.contentEditable!=="true")return!1;if(e.which===191&&t!=="input"&&t!=="textarea"&&e.target.contentEditable!=="true")return modal(MC.template.shortkey(),!0),!1}}),i=new r,i})}).call(this);