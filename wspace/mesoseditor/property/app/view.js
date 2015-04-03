define(["../base/view","./container","./template/stack","i18n!/nls/lang.js","constant","UI.modalplus"],function(e,t,n,r,i){var s;return s=e.extend({events:{"click .open-container":"openContainer","click #mesos-add-health-check":"addHealthCheck","click .mesos-health-check-item-remove":"removeHealthCheck","change .mesos-name":"updateAttribute","change .mesos-cpus":"updateAttribute","change .mesos-mem":"updateAttribute","change .mesos-instances":"updateAttribute","change #property-res-desc":"updateAttribute","change .mesos-update-min-health-capacity":"updateAttribute","change .mesos-update-max-over-capacity":"updateAttribute","change .execution-command":"updateExecutionSetting",'change [data-name="argument"]':"updateExecutionSetting","OPTION_CHANGE #property-execution-setting":"updateExecutionSetting","click .selection-arguments .ipt-controls a":"updateExecutionSetting","change #mesos-health-checks-list li input.input":"updateHealthCheck","OPTION_CHANGE .mesos-health-check-protocol":"updateHealthCheck","change .mesos-constraints input":"updateConstraints","change .mesos-constraints select":"updateConstraints","click .mesos-constraints .ipt-controls a":"updateConstraints","change .mesos-env-key":"updateAdvance","change .mesos-env-value":"updateAdvance","change .mesos-port":"updateAdvance","change .mesos-executor":"updateAdvance","change .mesos-uri":"updateAdvance","click .mesos-envs .ipt-controls a":"updateAdvance","change #property-res-desc":"updateDescription","change .update-tooltip":"updateTooltip","keyup .update-tooltip":"updateTooltip","click .ipt-controls a":"removeEmptyTooltip"},initialize:function(e){},openContainer:function(){var e,n,r;return n=this.model,e=this.isAppEdit?(r=this.appData[0])!=null?typeof r.toJSON=="function"?r.toJSON():void 0:void 0:void 0,this.container=(new t({model:n,appData:e})).render()},render:function(){var e;return e=this.model.toJSON(),e.isCommand=e.cmd||e.args?e.cmd:!0,this.$el.html(n(e)),this.updateHealthCheck(!0),this.model.get("name")},addHealthCheck:function(){var e,t;return e=this.$el.find("#mesos-health-checks-list"),t=e.find("li.template").eq(0).clone().show().removeClass("template"),t.find(".mesos-health-check-protocol .selection").text("HTTP").end().find(".mesos-health-check-path").val("").show().end().find(".mesos-health-check-port-index").val("0").show().end().find(".health-check-command").val("").hide().end().find(".mesos-health-check-grace-period").val("300").end().find(".mesos-health-check-interval").val("60").end().find(".mesos-health-check-timeout").val("20").end().find("mesos-health-check-max-fail").val("0").end().appendTo(e),this.updateHealthCheck()},removeHealthCheck:function(e){return $(e.currentTarget).parents("li").remove(),this.updateHealthCheck()},updateAttribute:function(e){var t,n,r,i,s;if(e){t=$(e.currentTarget);if(t.data("bind")){if((s=t.data("bind"))==="maximumOverCapacity"||s==="minimumHealthCapacity")return i=this.model.get("upgradeStrategy")||{},i[t.data("bind")]=+t.val(),this.model.set("upgradeStrategy",i);n=t.data("bind"),r=t.val();if(n==="cpus"||n==="mem"||n==="instances")r=+r;return this.model.set(n,r)}}},updateConstraints:function(){var e;return e=[],this.$el.find(".mesos-constraints .multi-ipt-row").each(function(t,n){var r,i,s;r=$(n).find(".mesos-constraints-attribute").val(),i=$(n).find(".mesos-constraints-operator").val(),s=$(n).find(".mesos-constraints-value").val();if(r!==""||s!=="")return e.push([r,i,s])}),this.model.set("constraints",e)},updateProtocol:function(e){var t,n;return t=e.parents("li"),n=t.find(".mesos-health-check-protocol").find(".selection").text(),n?n==="HTTP"?(t.find(".health-check-option").show(),t.find(".health-check-command").hide()):n==="TCP"?(t.find(".health-check-option").hide(),t.find(".health-check-port-index").show()):(t.find(".health-check-option").hide(),t.find(".health-check-command").show()):!1},updateHealthCheck:function(e){var t,n,r;return r=this,e&&(e.currentTarget?(t=$(e.currentTarget),this.updateProtocol(t)):$("#mesos-health-checks-list li").not(".template").find(".mesos-health-check-protocol").each(function(e,t){return r.updateProtocol($(t))})),n=[],this.$el.find("#mesos-health-checks-list>li").not(".template").each(function(e,t){var r,i,s,o,u,a,f,l,c,h;return r=$(t),c=r.find(".mesos-health-check-protocol .selection").text().toUpperCase(),f=r.find(".mesos-health-check-path").val(),l=+r.find(".mesos-health-check-port-index").val(),s=+r.find(".mesos-health-check-grace-period").val(),u=+r.find(".mesos-health-check-interval").val(),h=+r.find(".mesos-health-check-timeout").val(),a=+r.find(".mesos-health-check-max-fail").val(),i={value:r.find(".mesos-health-check-command").val()},o={protocol:c,path:f,portIndex:l,gracePeriodSeconds:s,intervalSeconds:u,timeoutSeconds:h,maxConsecutiveFailures:a,command:i},c==="HTTP"&&delete o.command,c==="TCP"&&(delete o.command,delete o.path),c==="COMMAND"&&(delete o.path,delete o.portIndex),n.push(o)}),this.model.set("healthChecks",n)},updateExecutionSetting:function(){var e,t,n,r;return n=this,e=$("#property-execution-setting"),r=e.find(".selection").text().toLowerCase(),this.$el.find(".selection-command, .selection-arguments").hide(),this.$el.find(".selection-"+r).show(),r==="command"?(n.model.set("cmd",$(".execution-command").val()),n.model.set("args",[])):(t=[],this.$el.find(".selection-arguments .multi-ipt-row").not(".template").find("input").each(function(e,n){if(n.value)return t.push(n.value)}),n.model.set("args",t),n.model.set("cmd",""))},updateAdvance:function(){var e,t,n,r;return e={},this.$el.find(".mesos-envs .multi-ipt-row").each(function(t,n){var r,i;r=$(n).find(".mesos-env-key").val(),i=$(n).find(".mesos-env-value").val();if(r&&i)return e[r]=i}),n=[],this.$el.find(".mesos-port").each(function(e,t){if(t.value)return n.push(+t.value)}),t=this.$el.find(".mesos-executor").val(),r=[],this.$el.find(".mesos-uri").each(function(e,t){if(t.value)return r.push(t.value)}),this.model.set({env:e}),this.model.set({ports:n}),this.model.set({executor:t}),this.model.set({uris:r})},updateDescription:function(){var e;return e=this.$el.find("#property-res-desc").val(),this.model.setDescription(e)},updateTooltip:function(e){var t;return t=$(e.currentTarget),t.attr("data-tooltip",t.val())},removeEmptyTooltip:function(){var e;return e=$("input.update-tooltip"),e.each(function(e,t){return $(t).attr("data-tooltip",$(t).val())})}}),new s});