/**
 * Created by Andrea on 8/27/2017.
 */

import database from './database';
import {o} from 'atp-sugar';

export default class Entity {
    constructor(dbName, tableName, indices = []) {
        this.db = database(dbName);
        this.tableName = tableName;
        this.indices = ['id'].concat(indices);
        this._cache = this.indices.reduce((combined, column) => combined.merge({[column]: {}}), o({})).raw;
    }

    select() {
        this.db.select(...arguments);
        return this;
    }

    where() {
        this.db.where(...arguments);
        return this;
    }

    orderBy() {
        this.db.order_by(...arguments);
        return this;
    }

    groupBy() {
        this.db.group_by(...arguments);
        return this;
    }

    join() {
        this.db.join(...arguments);
        return this;
    }

    limit() {
        this.db.limit(...arguments);
        return this;
    }

    query(query) {
        return new Promise((resolve, reject) => {
            this.db.query(query, (error, results) => {
                if(error) {reject(error);}
                else {resolve(results);}
            });
        });
    }

    update(data) {
        return new Promise((resolve, reject) => {
            this.db.update(this.tableName, data, error => {
                if(error) {reject(error);}
                else {resolve();}
            });
        });
    }

    delete() {
        return new Promise((resolve, reject) => {
            this.db.delete(this.tableName, error => {
                if(error) {reject(error);}
                else {resolve();}
            });
        });
    }

    insert(data) {
        return new Promise((resolve, reject) => {
            this.db.insert(this.tableName, data, (error, info) => {
                if(error) {reject(error);}
                else {resolve(info);}
            });
        });
    }

    insertIgnore(data, onDuplicateKeyClause) {
        return new Promise((resolve, reject) => {
            this.db.insert_ignore(this.tableName, data, (error, info) => {
                if(error) {reject(error);}
                else {resolve(info);}
            }, onDuplicateKeyClause);
        });
    }

    count() {
        return new Promise((resolve, reject) => {
            this.db.count(this.tableName, (error, rows, fields) => {
                if(error) {reject(error);}
                else {resolve(rows);}
            });
        });
    }

    cache(rows) {
        rows.forEach(data => {
            this.indices.forEach(column => {
                this._cache[column][data[column]] = data;
            });
        });
    }

    filter(filters) {
        let offset = 0;
        let pageSize = 999999999999;
        o(filters).map((value, key) => {
            switch(key) {
                case 'columns':  this.select(value);     break;
                case 'sort':     this.orderBy(value);    break;
                case 'offset':   offset = value;         break;
                case 'pageSize': pageSize = value;       break;
                default:         this.where(key, value); break;
            }
        });

        this.limit(pageSize, offset);

        return this;
    }

    list(cacheResults = true) {
        return new Promise((resolve, reject) => {
            this.db.get(this.tableName, (error, rows, fields) => {
                if(error) {reject(error);}
                else {
                    if(cacheResults) this.cache(rows);
                    resolve(rows);
                }
            });
        });
    }

    getById(id) {
        return this.getByIndex('id', id);
    }

    getByIndex(column, val) {
        return typeof this._cache[column][val] !== 'undefined'
            ? new Promise(resolve => resolve([null, this.cache[column][val], column]))
            : this.where(column, val).get();
    }

    get(cacheResults = true) {
        return new Promise((resolve, reject) => {
            this.db.get(this.tableName, (error, rows, fields) => {
                if(error) {reject(error);}
                else if(rows.length === 0) {
                    reject({
                        syscall: 'getOne',
                        code: 'NOTFOUND'
                    });
                }
                else {
                    if(cacheResults) this.cache(rows);
                    resolve(rows[0]);
                }
            });
        });
    }
}
