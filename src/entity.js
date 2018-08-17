/**
 * Created by Andrea on 8/27/2017.
 */

import database from './database';
import {o} from 'atp-sugar';
import typeOf from "type-of";
import isNumber from 'is-number';

export default class Entity {
    constructor(dbName, tableName) {
        this._db = null;
        this.dbName = dbName;
        this.tableName = tableName;
    }

    db() {
        if(!this._db) {
            this._db = database(this.dbName);
        }
        return this._db;
    }

    table() {
        return this.tableName;
    }

    select() {
        this.db().select(...arguments);
        return this;
    }

    where() {
        this.db().where(...arguments);
        return this;
    }

    orderBy() {
        this.db().order_by(...arguments);
        return this;
    }

    groupBy() {
        this.db().group_by(...arguments);
        return this;
    }

    join() {
        this.db().join(...arguments);
        return this;
    }

    limit() {
        this.db().limit(...arguments);
        return this;
    }

    query(query) {
        return new Promise((resolve, reject) => {
            this.db().query(query, (error, results) => {
                if(error) {reject(error);}
                else {resolve(results);}
            });
        });
    }

    update(data) {
        return new Promise((resolve, reject) => {
            this.db().update(this.tableName, data, error => {
                if(error) {reject(error);}
                else {resolve();}
            });
        });
    }

    delete() {
        return new Promise((resolve, reject) => {
            this.db().delete(this.tableName, error => {
                if(error) {reject(error);}
                else {resolve();}
            });
        });
    }

    insert(data) {
        return new Promise((resolve, reject) => {
            this.db().insert(this.tableName, data, (error, info) => {
                if(error) {reject(error);}
                else {resolve(info);}
            });
        });
    }

    insertIgnore(data, onDuplicateKeyClause) {
        return new Promise((resolve, reject) => {
            this.db().insert_ignore(this.tableName, data, (error, info) => {
                if(error) {reject(error);}
                else {resolve(info);}
            }, onDuplicateKeyClause);
        });
    }

    count() {
        return new Promise((resolve, reject) => {
            this.db().count(this.tableName, (error, rows, fields) => {
                if(error) {reject(error);}
                else {resolve(rows);}
            });
        });
    }

    filter(filters) {
        let offset = 0;
        let pageSize = 999999999999;
        o(filters).map((value, key) => {
            switch(key) {
                case 'columns':  this.select(value);           break;
                case 'sort':     this.orderBy(value);          break;
                case 'offset':   offset = parseInt(value);     break;
                case 'perPage':  pageSize = parseInt(value);   break;
                default:         this.filterField(key, value); break;
            }
        });

        this.limit(pageSize, offset);

        return this;
    }

    filterField(key, value) {
        if(isNumber(value) || typeOf(value) === 'boolean') {
            this.where(key, value);
        } else {
            this.where(`${key} like "%${value}%"`);
        }
    }

    list() {
        return new Promise((resolve, reject) => {
            try {
                this.db().get(this.tableName, (error, rows, fields) => {
                    if(error) {reject(error);}
                    else {
                        resolve(rows);
                    }
                });
            } catch(e) {
                reject(e);
            }
        });
    }

    getById(id) {
        return this.getByIndex('id', id);
    }

    getByIndex(column, val) {
        return this.where(column, val).get();
    }

    get() {
        return new Promise((resolve, reject) => {
            try {
                this.db().get(this.tableName, (error, rows, fields) => {
                    if(error) {reject(error);}
                    else if(rows.length === 0) {
                        reject({
                            syscall: 'getOne',
                            code: 'NOTFOUND'
                        });
                    }
                    else {
                        resolve(rows[0]);
                    }
                });
            } catch(e) {
                reject(e);
            }
        });
    }
}
