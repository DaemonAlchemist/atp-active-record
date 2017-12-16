/**
 * Created by Andrea on 11/1/2017.
 */

import {o} from 'atp-sugar';
import validator from 'atp-validator';
import {respondWith} from 'atp-rest';

const sortingStandard = model => ({
    nextSortOrder: () => new Promise((resolve, reject) => {
        model.select("MAX(sortOrder) + 1 as nextSortOrder")
            .limit(1)
            .list(false)
            .then(result => {
                resolve(result.length > 0 ? result[0].nextSortOrder : 0);
            })
            .catch(reject);
    }),

    remove: id => new Promise((resolve, reject) => {
        //Get the existing arc to get its parentId
        model.getById(id)
            .then(obj => {
                //Remove the object from its parent
                model.where({id}).limit(1).update({sortOrder: null})
                    .then(() => {
                        //Decrement sortOrder for all higher siblings
                        model.query(
                            "update " + model.table() +
                            " set sortOrder = sortOrder - 1" +
                            " where sortOrder>" + obj.sortOrder +
                            " and id<>" + id
                        ).then(() => {
                            model.getSiblings(id)
                                .then(siblings => {
                                    resolve(siblings);
                                }).catch(reject);
                        }).catch(reject);
                    }).catch(reject);
            }).catch(reject);
    }),

    getSiblings: id => model
        .select(['id', 'sortOrder'])
        .where("id <> " + id)
        .list(),

    insertFirst: id => new Promise((resolve, reject) => {
        model.where({id})
            .limit(1)
            .update({sortOrder: 0})
            .then(() => {
                model.query(
                    "update " + model.table() +
                    " set sortOrder = sortOrder + 1" +
                    " where id<>" + id
                ).then(() => {
                    model.getSiblings(id)
                        .then(siblings => {
                            resolve(siblings);
                        }).catch(reject);
                }).catch(reject);
            }).catch(reject);
    }),

    insertAfter: (targetId, id) => new Promise((resolve, reject) => {
        model.getById(targetId)
            .then(targetObj => {
                const sortOrder = targetObj.sortOrder + 1;
                model.query(
                    "update " + model.table() +
                    " set sortOrder = sortOrder + 1" +
                    " where sortOrder>=" + sortOrder +
                    " and id<>" + id
                ).then(() => {
                    model.where({id}).limit(1).update({sortOrder})
                        .then(() => {
                            model.getSiblings(id)
                                .then(resolve).catch(reject);
                        }).catch(reject);
                }).catch(reject);
            }).catch(reject);
    }),

    create: post => (req, res) => {
        model.nextSortOrder().then(sortOrder => {
            req.body.sortOrder = sortOrder;
            post(req, res);
        });
    },

    move: permissions => (req, res) => {
        validator()
            .loggedIn(req)
            .hasPermission(permissions.update, req)
            .validMoveRequest(req)
            .then(
                () => {
                    const action = req.body.action;
                    const targetId = req.body.targetId;
                    const sourceId = req.body.sourceId;

                    //TODO:  Add validation so that an object can't be moved into one of its descendants (no loops)
                    //new model().getParents(sourceId);

                    model.remove(sourceId).then(oldSiblings => {
                        o(action).switch({
                            into: () => model.insertFirst(sourceId),
                            after: () => model.insertAfter(targetId, sourceId),
                            default: () => {throw "Invalid move mode " + mode;}
                        }).then(newSiblings => {
                            model
                                .select(['id', 'sortOrder'])
                                .getById(sourceId)
                                .then(sourceObj => {
                                    respondWith.Success(req, res)(oldSiblings.concat(newSiblings, sourceObj));
                                }).catch(respondWith.InternalServerError(req, res));
                        }).catch(respondWith.InternalServerError(req, res));
                    }).catch(respondWith.InternalServerError(req, res));
                },
                respondWith.Error(req, res)
            );
    }
});

const sortingHierarchical = (model, parentFieldName) => ({
    nextSortOrder: parentId => new Promise((resolve, reject) => {
        model.select("MAX(sortOrder) + 1 as nextSortOrder")
            .groupBy(parentFieldName)
            .where({[parentFieldName]: parentId})
            .limit(1)
            .list(false)
            .then(result => {
                resolve(result.length > 0 ? result[0].nextSortOrder : 0);
            })
            .catch(reject);
    }),

    removeFromParent: id => new Promise((resolve, reject) => {
        //Get the existing arc to get its parentId
        model.getById(id)
            .then(obj => {
                const parentId = obj[parentFieldName];
                //Remove the object from its parent
                model.where({id}).limit(1).update({[parentFieldName]: null})
                    .then(() => {
                        //Decrement sortOrder for all higher siblings
                        model.query(
                            "update " + model.table() +
                            " set sortOrder = sortOrder - 1" +
                            " where " + parentFieldName + "=" + parentId +
                            " and sortOrder>" + obj.sortOrder +
                            " and id<>" + id
                        ).then(() => {
                            model.getSiblings(parentId, id)
                                .then(siblings => {
                                    resolve(siblings);
                                }).catch(reject);
                        }).catch(reject);
                    }).catch(reject);
            }).catch(reject);
    }),

    getSiblings: (parentId, id) => model
        .select(['id', 'sortOrder'])
        .where({[parentFieldName]: parentId}).where("id <> " + id)
        .list(),

    getParents: (id, level = 10) => new Promise((resolve, reject) => {
        const sql = "select "
            + [...Array(level+1).keys()].map(i => "p" + i + ".id as parent" + i).join(',')
            + " from " + model.table() + " p0 "
            + [...Array(level).keys()].map(i =>
                "left join " + model.table() + " p" + (i+1) + " on p" + (i+1) + ".id=p" + i + "." + parentFieldName
            ).join(" ")
            + " where p0.id=" + id;
        model.query(sql).then(
            results => {
                const parents = o(results[0]).filter(v => v).values();
                resolve(parents);
            },
            reject
        );
    }),

    insertInto: (parentId, id) => new Promise((resolve, reject) => {
        model.where({id})
            .limit(1)
            .update({[parentFieldName]: parentId, sortOrder: 0})
            .then(() => {
                model.query(
                    "update " + model.table() +
                    " set sortOrder = sortOrder + 1" +
                    " where " + parentFieldName + "=" + parentId +
                    " and id<>" + id
                ).then(() => {
                    model.getSiblings(parentId, id)
                        .then(siblings => {
                            resolve(siblings);
                        }).catch(reject);
                }).catch(reject);
            }).catch(reject);
    }),

    insertAfter: (targetId, id) => new Promise((resolve, reject) => {
        model.getById(targetId)
            .then(targetObj => {
                const parentId = targetObj[parentFieldName];
                const sortOrder = targetObj.sortOrder + 1;
                model.query(
                    "update " + model.table() +
                    " set sortOrder = sortOrder + 1" +
                    " where " + parentFieldName + "=" + parentId +
                    " and sortOrder>=" + sortOrder +
                    " and id<>" + id
                ).then(() => {
                    model.where({id}).limit(1).update({[parentFieldName]: parentId, sortOrder})
                        .then(() => {
                            model.getSiblings(parentId, id)
                                .then(resolve).catch(reject);
                        }).catch(reject);
                }).catch(reject);
            }).catch(reject);
    }),

    create: post => (req, res) => {
        model.nextSortOrder(req.body[parentFieldName]).then(sortOrder => {
            req.body.sortOrder = sortOrder;
            post(req, res);
        });
    },

    move: permissions => (req, res) => {
        validator()
            .loggedIn(req)
            .hasPermission(permissions.update, req)
            .validMoveRequest(req)
            .then(
                () => {
                    const action = req.body.action;
                    const targetId = req.body.targetId;
                    const sourceId = req.body.sourceId;

                    //TODO:  Add validation so that an object can't be moved into one of its descendants (no loops)
                    //new model().getParents(sourceId);

                    model.removeFromParent(sourceId).then(oldSiblings => {
                        o(action).switch({
                            into: () => model.insertInto(targetId, sourceId),
                            after: () => model.insertAfter(targetId, sourceId),
                            default: () => {throw "Invalid move mode " + mode;}
                        }).then(newSiblings => {
                            model
                                .select(['id', parentFieldName, 'sortOrder'])
                                .getById(sourceId)
                                .then(sourceObj => {
                                    respondWith.Success(req, res)(oldSiblings.concat(newSiblings, sourceObj));
                                }).catch(respondWith.InternalServerError(req, res));
                        }).catch(respondWith.InternalServerError(req, res));
                    }).catch(respondWith.InternalServerError(req, res));
                },
                respondWith.Error(req, res)
            );
    }
});

export const sorting = (model, parentFieldName) => parentFieldName
    ? sortingHierarchical(model, parentFieldName)
    : sortingStandard(model);