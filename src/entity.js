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

    order_by() {
        this.db.order_by(...arguments);
        return this;
    }

    group_by() {
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

    insert_ignore(data, onDuplicateKeyClause) {
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

    list() {
        return new Promise((resolve, reject) => {
            this.db.get(this.tableName, (error, rows, fields) => {
                if(error) {reject(error);}
                else {
                    this.cache(rows);
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

    get() {
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
                        this.cache(rows);
                        resolve(rows[0]);
                }
            });
        });
    }
}
