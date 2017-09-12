/**
 * Created by Andy on 9/12/2017.
 */

import {validate} from 'atp-validator';
import validator from 'atp-validator';
export default {
    validCollectionFilters: filters => validate(
        (resolve, reject) => {
            validator()
                .optional(filters.columns, "columnsMissing")
                .chain('columnsValid')
                    .matches(
                        filters.columns,
                        /^([a-zA-Z0-9]+,)*[a-zA-Z0-9]+$/,
                        "Columns must be a comma-separated list of column names"
                    )
                .chain("columns").any(["columnsMissing", "columnsValid"]).pass()
                .optional(filters.perPage, "perPageMissing")
                .chain("perPageValid")
                    .isInteger(filters.perPage, "Per page")
                    .greaterThan(filters.perPage, "Per page", 0)
                .chain("perPage").any(["perPageMissing", "perPageValid"]).pass()
                .optional(filters.offset, "offsetMissing")
                .chain("offsetValid")
                    .isInteger(filters.offset, "Offset")
                    .greaterThan(filters.offset, "Offset", 0)
                .chain("offset").any(["offsetMissing", "offsetValid"]).pass()
                .optional(filters.sort, "sortMissing")
                .chain("sortValid")
                    .matches(
                        filters.sort,
                        /^[a-zA-Z0-9_]*\\s(ASC|DESC|asc|desc)(,[a-zA-Z0-9_]*\\s(ASC|DESC|asc|desc))*$/,
                        "Sort must be a comma-delimited list of 'column direction' pairs"
                    )
                .chain("sort").any(["sortMissing", "sortValid"])
                .chain("final").if(["columns", "perPage", "offset", "sort"]).pass()
                .then(resolve, errors => reject(errors));
        },
        "Invalid collection filters",
        400
    )
}