import common from './common.json';
import header from './header.json';
import summary from './project-module/summary.json';
import epic from './project-module/epic.json';
import notification from './project-module/notification.json';
import role from './project-module/role.json';
import project from './project-module/project.json';
import team from './project-module/team.json';
import sprint from './project-module/sprint.json';
import issue from './project-module/issue.json';
import hr from './hr.json';


export default {
  ...common,
  ...header,
  ...summary,
  ...epic,
  ...notification,
  ...role,
  ...project,
  ...team,
  ...sprint,
  ...issue,  ...hr,

};