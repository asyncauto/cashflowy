module.exports={
    /**
     * spending_per_month is an array of spending, grouped by year and month.
     */
    generateTimePeriods:function(spending_per_month){
        var time_periods=[];
        spending_per_month.forEach(function (row) {
            var time_period_exists = false;
            time_periods.forEach(function (time_period) {
                if (time_period.year == row.year && time_period.month == row.month)
                    time_period_exists = true;
            })
            if (!time_period_exists)
                time_periods.push({ year: row.year, month: row.month });
        })
        return time_periods
    },
    generatePnLScafolding:function(pnl_from_db){
        var pnl = pnl_from_db ? pnl_from_db:{};
        pnl.header = {
            "level_1": [],
            "level_2": []
        }
        pnl.body = [
            { // these ones will be the header
                "name": 'income',
                "data": {},
                "children": []

            },
            {
                "name": 'expense',
                "data": {},
                "children": []
            },
            {
                "name": "surplus",
                "data": {},
                "children": []
            }
        ];
        return pnl;
    },
    /**
     * categories - are flat, directly queried from the db
     */
    generateRowScafoldingForSinglePNLHead:function(categories,pnl_head){
        var pnl_body=[
            { // these ones will be the header
                "name": 'income',
                "data": {},
                "children": []

            },
            {
                "name": 'expense',
                "data": {},
                "children": []
            },
            {
                "name": "surplus",
                "data": {},
                "children": []
            }
        ];
        var hier_categories = GeneralService.orderCategories(categories);
        var head_category;
        hier_categories.forEach(function (c) {
            if (c.id == pnl_head) {
                head_category = c;
            }
        });
        head_category.children.forEach(function (c) {
            var row = { // these ones will be the header
                "name": c.name,
                "data": {},
                "children": []
            };
            if (c.type == 'income' || c.type == 'expense') {
                var temp = _.find(pnl_body, { "name": c.type });
                temp.children.push(row);
            }
        })
        return pnl_body;
    },
    calculateCategorySpendingPerTimePeriod: function (flat_categories,time_periods,spending_per_category_per_month){
        var temp = {};
        var categories_by_time = {};
        time_periods.forEach(function (tp) {
            temp[tp.year + '-' + tp.month] = _.cloneDeep(flat_categories);
            temp[tp.year + '-' + tp.month].forEach(function (cat) {

                cat.t_count = 0;
                cat.t_sum = 0;
                // console.log(results.getCategorySpending);
                spending_per_category_per_month.forEach(function (spend) {
                    if (cat.id == spend.category && tp.year == spend.year && tp.month == spend.month) {
                        cat.t_count = spend.count;
                        cat.t_sum = spend.sum;
                    }
                })
                // console.log(cat);
            });
            categories_by_time[tp.year + '-' + tp.month] = _.cloneDeep(GeneralService.orderCategories(temp[tp.year + '-' + tp.month]));
        });
        return categories_by_time;
    }
}