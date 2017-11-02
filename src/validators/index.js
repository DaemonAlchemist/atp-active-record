/**
 * Created by Andy on 9/12/2017.
 */

import {validate} from 'atp-validator';
import validator from 'atp-validator';

export default {
    validCollectionFilters: filters => validate(
        (resolve, reject) => {
            validator()
                .check("columns")
                    .isOptional(filters.columns, (v, columns) => v
                        .matches(
                            columns,
                            /^([a-zA-Z0-9]+,)*[a-zA-Z0-9]+$/,
                            "Columns must be a comma-separated list of column names"
                        )
                    )
                .check("perPage")
                    .isOptional(filters.perPage, (v, perPage) => v
                        .isInteger(perPage, "Per page")
                        .greaterThan(perPage, "Per page", 0)
                    )
                .check("offset")
                    .isOptional(filters.offset, (v, offset) => v
                        .isInteger(offset, "Offset")
                        .greaterThan(offset, "Offset", 0)
                    )
                .check("sort")
                    .isOptional(filters.sort, (v, sort) => v
                        .matches(
                            sort,
                            /^[a-zA-Z0-9_]*\\s(ASC|DESC|asc|desc)(,[a-zA-Z0-9_]*\\s(ASC|DESC|asc|desc))*$/,
                            "Sort must be a comma-delimited list of 'column direction' pairs"
                        )
                    )
                .check("final").if(["columns", "perPage", "offset", "sort"])
                .then(resolve, errors => reject(errors));
        },
        "Invalid collection filters",
        400
    ),

    validMoveRequest: req => validate(
        (resolve, reject) => {
            validator()
                .required(req.body.action, "Action")
                .required(req.body.targetId, "Target id")
                .required(req.body.sourceId, "Source id")
                .isOneOf(req.body.action, ["into", "after"], "Action")
                .isInteger(req.body.targetId, "Target id")
                .isInteger(req.body.sourceId, "Source id")
                .custom(validate(
                    req.body.targetId !== req.body.sourceId,
                    "Cannot move an arc relative to itself (targetId cannot equal sourceId)",
                    400
                ))
                .then(resolve, errors => reject(errors));
        },
        "Invalid move request",
        400
    )
}