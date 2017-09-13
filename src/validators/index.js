/**
 * Created by Andy on 9/12/2017.
 */

import {validate} from 'atp-validator';
import validator from 'atp-validator';
export default {
    validCollectionFilters: filters => validate(
        (resolve, reject) => {
            validator()
                .for("columns")
                    .optional(filters.columns, (v, columns) => v
                        .matches(
                            columns,
                            /^([a-zA-Z0-9]+,)*[a-zA-Z0-9]+$/,
                            "Columns must be a comma-separated list of column names"
                        )
                    )
                .for("perPage")
                    .optional(filters.perPage, (v, perPage) => v
                        .isInteger(perPage, "Per page")
                        .greaterThan(perPage, "Per page", 0)
                    )
                .for("offset")
                    .optional(filters.offset, (v, offset) => v
                        .isInteger(offset, "Offset")
                        .greaterThan(offset, "Offset", 0)
                    )
                .for("sort")
                    .optional(filters.sort, (v, sort) => v
                        .matches(
                            sort,
                            /^[a-zA-Z0-9_]*\\s(ASC|DESC|asc|desc)(,[a-zA-Z0-9_]*\\s(ASC|DESC|asc|desc))*$/,
                            "Sort must be a comma-delimited list of 'column direction' pairs"
                        )
                    )
                .for("final").if(["columns", "perPage", "offset", "sort"])
                .then(resolve, errors => reject(errors));
        },
        "Invalid collection filters",
        400
    )
}