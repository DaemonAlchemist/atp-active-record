/**
 * Created by Andrea on 8/27/2017.
 */

import Db from 'mysql-activerecord';
import config from "atp-config";

let connections = {};

export default name => {
  if(typeof connections[name] === 'undefined') {
      connections[name] = new Db.Adapter(config.get(
          'mysql.connection.' + (config.isset("mysql.connection." + name) ? name : "default")
      ));
  }
  return connections[name];
};
