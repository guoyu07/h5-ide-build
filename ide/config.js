(function(){(function(){var e,t,n,r,i,s,o,u,a;if(!window)return;n=window.location;if(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.exec(n.hostname)){void 0;return}t=n.hostname.split("."),t.length>=3?window.MC_DOMAIN=t[t.length-2]+"."+t[t.length-1]:window.MC_DOMAIN=n.hostname,window.MC_API_HOST=n.protocol+"//api."+window.MC_DOMAIN,window.language=window.version="";if(n.hostname.toLowerCase().indexOf("visualops.io")>=0&&n.protocol==="http:"){window.location=n.href.replace("http:","https:");return}e=function(e){return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*"+encodeURIComponent(e).replace(/[\-\.\+\*]/g,"\\$&")+"\\s*\\=\\s*([^;]*).*$)|^.*$"),"$1"))||null};if(!e("usercode")||!e("session_id")){r=window.location.pathname,r==="/"&&(r=window.location.hash.replace("#","/")),r&&r!=="/"?window.location.href="/login?ref="+r:window.location.href="/login";return}s=document.getElementsByTagName("script");for(u=0,a=s.length;u<a;u++){i=s[u],o=i.getAttribute("data-main");if(o){window.version=o.split("?")[1];break}}return window.version==="#{version}"&&(window.version="dev"),window.language=document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*lang\\s*\\=\\s*([^;]*).*$)|^.*$"),"$1")||"en-us",null})(),require.config({baseUrl:"/",waitSeconds:30,locale:language,urlArgs:"v="+version,shim:{underscore:{exports:"_"},Meteor:{deps:["underscore"],exports:"Meteor"}},bundles:{"vender/requirejs/requirelib":["i18n"],"vender/vender":["jquery","backbone","underscore","handlebars","sprintf","Meteor","crypto","q","svg"],"lib/lib":["MC","constant","MC.canvas","MC.validate","lib/handlebarhelpers","event"],"ui/ui":["UI.tooltip","UI.scrollbar","UI.bubble","UI.modal","UI.table","UI.tablist","UI.selectbox","UI.searchbar","UI.filter","UI.radiobuttons","UI.notification","UI.multiinputbox","UI.canvg","UI.sortable","UI.parsley","UI.errortip","UI.dnd","jqpagination","jquerysort","jqtimepicker","jqdatetimepicker","UI.modalplus","UI.nanoscroller"],"api/api":["ApiRequest","ApiRequestR"],"service/service":["base_model","state_model","keypair_model","instance_model","result_vo","stack_service","state_service","ami_service","ebs_service","instance_service","keypair_service","customergateway_service"],"component/Exporter":["ThumbnailUtil","JsonExporter"],"component/Validation":["validation","component/trustedadvisor/gui/main"],"component/StateStatus":["state_status"],"component/AwsDialog":["component/sgrule/SGRulePopup","component/dbsbgroup/DbSubnetGPopup","appAction","og_manage","og_manage_app","og_dropdown"],"component/stateeditor/stateeditor":[],"component/sharedrescomp":["kp_dropdown","kp_manage","kp_upload","sns_dropdown","sns_manage","combo_dropdown","toolbar_modal","dhcp","snapshotManager","sslcert_manage","sslcert_dropdown","ResDiff","DiffTree","rds_pg","rds_snapshot"],"cloudres/CrBundle":["CloudResources"],"ide/AppBundle":["ide/Application","Workspace","OpsModel","ide/Router"],"workspaces/Dashboard":[],"workspaces/editor/PropertyPanel":["workspaces/editor/subviews/PropertyPanel"],"workspaces/editor/framework/DesignBundle":["Design"],"workspaces/OpsEditor":[]},bundleExcludes:{"component/AwsDialog":["Design"],"component/stateeditor/stateeditor":["Design"],"component/sharedrescomp":["Design"],"component/Validation":["Design"],"workspaces/editor/PropertyPanel":["Design"],"workspaces/editor/framework/DesignBundle":[],"workspaces/editor/subviews/PropertyPanel":["component/sgrule/SGRulePopup"]}}),requirejs.onError=function(e){var t,n,r,i;e=e||{requireType:"timeout"};if(e.requireType==="timeout"){i=e.requireModules||[];for(n=0,r=i.length;n<r;n++)t=i[n],requirejs.undef(t);return require(e.requireModules||[],function(){})}return void 0},require(["ide/Application","cloudres/CrBundle","workspaces/Dashboard","workspaces/OpsEditor","ide/Router","MC","MC.canvas","lib/aws"],function(e,t,n,r,i){return window.Router=new i,window.OpsEditor=r,(new e).initialize().then(function(){window.Router.start(),window.Dashboard=new n})},function(e){e=e||{requireType:"timeout"},e.requireType==="timeout"?(requirejs.onError=function(){},void 0,window.location.reload()):void 0})}).call(this);