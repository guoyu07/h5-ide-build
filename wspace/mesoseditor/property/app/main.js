define(["Design","../base/main","./view","./app_view","constant","CloudResources","event"],function(e,t,n,r,i,s){return t.extend({handleTypes:[i.RESTYPE.MRTHAPP],initStack:function(t){return this.view=n,this.model=e.instance().component(t),this.view.isAppEdit=!1,null},initApp:function(t){var n;return this.view=r,this.model=e.instance().component(t),n=this.model.path(),this.view.appData=s(e.instance().credentialId(),i.RESTYPE.MRTHAPP,e.instance().serialize().id).filter(function(e){return e.get("id")===n}),this.view.isAppEdit=!1,null},initAppEdit:function(t){var r;return this.view=n,this.view.isAppEdit=!0,this.model=e.instance().component(t),this.view.model=e.instance().component(t),r=this.view.model.path(),this.view.appData=s(e.instance().credentialId(),i.RESTYPE.MRTHAPP,e.instance().serialize().id).filter(function(e){return e.get("id")===r}),null}})});