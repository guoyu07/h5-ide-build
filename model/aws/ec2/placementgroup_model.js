(function(){define(["backbone","underscore","placementgroup_service","base_model"],function(e,t,n,r){var i,s;return i=e.Model.extend({initialize:function(){return t.extend(this,r)},CreatePlacementGroup:function(e,t,r,i,s,o){var u;return o==null&&(o="cluster"),u=this,e.model=u,n.CreatePlacementGroup(e,t,r,i,s,o,function(t){if(!!t.is_error)return void 0,u.pub(t);if(e.sender&&e.sender.trigger)return e.sender.trigger("EC2_PG_CREATE_PLA_GRP_RETURN",t)})},DeletePlacementGroup:function(e,t,r,i,s){var o;return o=this,e.model=o,n.DeletePlacementGroup(e,t,r,i,s,function(t){if(!!t.is_error)return void 0,o.pub(t);if(e.sender&&e.sender.trigger)return e.sender.trigger("EC2_PG_DELETE_PLA_GRP_RETURN",t)})},DescribePlacementGroups:function(e,t,r,i,s,o){var u;return s==null&&(s=null),o==null&&(o=null),u=this,e.model=u,n.DescribePlacementGroups(e,t,r,i,s,o,function(t){if(!!t.is_error)return void 0,u.pub(t);if(e.sender&&e.sender.trigger)return e.sender.trigger("EC2_PG_DESC_PLA_GRPS_RETURN",t)})}}),s=new i,s})}).call(this);