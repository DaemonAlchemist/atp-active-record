/**
 * Created by Andrea on 8/27/2017.
 */

import database from './database';

export default class Entity {
    constructor(dbName, tableName) {
        this.db = database(dbName);
        this.tableName = tableName;
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

    list() {
        return new Promise(callback => {
            this.db.get(this.tableName, (err, rows, field) => callback([err, rows, field]));
        });
    }

    getById(id) {
        return this.where('id', id).get();
    }

    get() {
        return new Promise(callback => {
            this.db.get(this.tableName, (err, rows, field) => {
                callback([err, rows[0], field]);
            });
        });
    }
}
