module.exports={
    generateBSScafolding: function (bs_from_db) {
        var bs = bs_from_db ? bs_from_db : {};
        bs.header = {
            "level_1": [],
            "level_2": []
        }
        bs.body = [
            { // these ones will be the header
                "name": 'Assets',
                "data": {},
                "children": []

            },
            {
                "name": 'Liabilities',
                "data": {},
                "children": []
            },
            {
                "name": "Surplus",
                "data": {},
                "children": []
            }
        ];
        return bs;
    },
    generateRowScafoldingForSinglePNLHead: function (accounts) {
        
        var bs_body = [
            { // these ones will be the header
                "name": 'Assets',
                "data": {},
                "children": [
                    {
                        "name": 'bank',
                        "data": {},
                        "children": []
                    },
                    {
                        "name": 'wallet',
                        "data": {},
                        "children": []
                    },
                    {
                        "name": 'investment',
                        "data": {},
                        "children": []
                    },
                ]
            },
            {
                "name": 'Liabilities',
                "data": {},
                "children": [
                    {
                        "name": 'credit_card',
                        "data": {},
                        "children": []
                    },
                ]
            },
            {
                "name": "Surplus",
                "data": {},
                "children": []
            }
        ];
        bs_body.forEach(function (row_l1, i) { // income, expense, surplus
            row_l1.children.forEach(function (row_l2) { // bank, wallet, credit_card
                accounts.forEach(function(acc){
                    if(row_l2.name==acc.type){
                        row_l2.children.push({
                            name:acc.name,
                            data:{
                                '2019-04__all':23
                            },
                            children:[]
                        });
                    }

                })
            });
        })
        return bs_body;
    },
    populateDataForSinglePNLHead: function (bs_body, accounts, pnl_head) {
        bs_body.forEach(function (row_l1, i) { // income, expense, surplus
            var month = '2019-04';
            var level_2 = 'Personal';
            
            // Object.keys(categories_by_time).forEach(function (month, i) {
                // var head_cat = _.find(categories_by_time[month], { id: pnl_head });
            row_l1.data[month + '__' + level_2] = 0;
            row_l1.children.forEach(function (row_l2) {
                // head_cat.children.forEach(function (cat2) {
                //     if (cat2.name == row_l2.name) {
                //         row_l2.data[month + '__' + head_cat.name] = cat2.super_sum;
                //         row_l1.data[month + '__' + head_cat.name] += cat2.super_sum;
                //     }
                // })
                row_l2.children.forEach(function (row_l3) {
                    head_cat.children.forEach(function (cat2) {
                        cat2.children.forEach(function (cat3) {
                            if (cat3.name == row_l3.name)
                                row_l3.data[month + '__' + head_cat.name] = cat2.super_sum;

                        })
                    })
                })
            });
            if (row_l1.name == 'Surplus') { // custom calculation for surplus
                row_l1.data[month + '__' + head_cat.name] = pnl_body[0].data[month + '__' + head_cat.name] + pnl_body[1].data[month + '__' + head_cat.name];
            }
            // })
        })
        return pnl_body;
    },
}