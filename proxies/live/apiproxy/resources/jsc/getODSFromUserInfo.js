var userRole = context.getVariable('user_role');
var userInfo = context.getVariable('UserInfo');
var parsedInfo = JSON.parse(userInfo);

var orgCode = parsedInfo.nhsid_nrbac_roles.find(role => role.person_roleid === userRole).org_code

context.setVariable('user_org_code', orgCode);
