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
        this.cache = indices.reduce((combined, column) => combined.merge({[column]: {}}), o({})).raw;
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

    update() {
        this.db.update(this.tableName, ...arguments);
        return this;
    }

    delete() {
        this.db.delete(this.tableName, ...arguments);
        return this;
    }

    insert() {
        this.db.insert(this.tableName, ...arguments);
        return this;
    }

    insert_ignore() {
        this.db.insert_ignore(this.tableName, ...arguments);
        return this;
    }

    count() {
        this.db.count(this.tableName, ...arguments);
        return this;
    }

    cache(rows) {
        rows.forEach(data => {
            this.indices.forEach(column => {
                this.cache[column][data[column]] = data;
            });
        });
    }

    list() {
        return new Promise(callback => {
            this.db.get(this.tableName, (err, rows, field) => {
                this.cache(rows);
                callback([err, rows, field]);
            });
        });
    }

    getById(id) {
        return this.getByIndex('id', id);
    }

    getByIndex(column, val) {
        return typeof this.cache[column][val] !== 'undefined'
            ? new Promise(resolve => resolve([null, this.cache[column][val], column]))
            : this.where(column, val).get();
    }
    get() {
        return new Promise(callback => {
            this.db.get(this.tableName, (err, rows, field) => {
                const data = rows[0];
                this.cache([data]);
                callback([err, rows[0], field]);
            });
        });
    }
}
