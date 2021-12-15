var userRole = context.getVariable('user_role');
var userInfo = context.getVariable('UserInfo');
var parsedInfo = JSON.parse(userInfo);

var name = parsedInfo.name

var selectedRole = parsedInfo.nhsid_nrbac_roles.find(role => role.person_roleid === userRole)
var orgCode = selectedRole.org_code
var roleCode = selectedRole.role_code

context.setVariable('user_org_code', orgCode);
context.setVariable('user_role_code', roleCode);
context.setVariable('user_name', name);
