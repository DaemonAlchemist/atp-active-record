/**
 * Created by Andrea on 9/3/2017.
 */

import {error} from 'atp-validator';

export default (action, reject) => err => {
    reject(error(
        "An error occurred: " + action + " => " + err.syscall + "[" + err.code + "]",
        500
    ));
};
