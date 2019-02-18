module.exports.bull = {
    //generate cron format using: https://www.freeformatter.com/cron-expression-generator-quartz.html
    repeats: [
        {
            name: 'surface_crawl_all_users',
            active: true,
            repeat: { cron: "*/10 * * * *" },
            data: {}
        }
    ]
}