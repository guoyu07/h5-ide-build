define(["handlebars"],function(e){var t=function(e,t,n,r,i){function l(e,t){var n="",r;return n+='\n		<header id="process-title" class="overlay-text" data-tab-id="'+a((r=e&&e.id,typeof r===u?r.apply(e):r))+'">\n			Loading resources...\n		</header>\n		',n}function c(e,t){return'\n			<div class="loading-spinner"></div>\n			'}function h(e,t){return'\n				<div class="overlay-content-wrap">\n					<div class="overlay-text" style="margin-top:200px;">Oops! There has been some issue loading the tab. Please close this tab and try again.</div>\n				</div>\n			'}function p(e,t){var r="",i;r+="\n\n				",i=n["if"].call(e,e&&e.timeout,{hash:{},inverse:f.noop,fn:f.program(8,d,t),data:t});if(i||i===0)r+=i;return r+="\n\n			",r}function d(e,t){return'\n				<div class="long-lag-message">It takes longer to load resources since your system is quite signiﬁcant.</br>\n	Just sit back and we are off to go soon!</div>\n				'}this.compilerInfo=[4,">= 1.0.0"],n=this.merge(n,e.helpers),i=i||{};var s="",o,u="function",a=this.escapeExpression,f=this;s+='<div id="process-panel">\n	<section id="process-container">\n\n		',o=n.unless.call(t,t&&t.overtime,{hash:{},inverse:f.noop,fn:f.program(1,l,i),data:i});if(o||o===0)s+=o;s+='\n\n		<div id="process-body">\n\n			',o=n.unless.call(t,t&&t.overtime,{hash:{},inverse:f.noop,fn:f.program(3,c,i),data:i});if(o||o===0)s+=o;s+="\n\n			",o=n["if"].call(t,t&&t.overtime,{hash:{},inverse:f.program(7,p,i),fn:f.program(5,h,i),data:i});if(o||o===0)s+=o;return s+="\n\n		</div>\n\n	</section>\n</div>",s};return e.template(t)});