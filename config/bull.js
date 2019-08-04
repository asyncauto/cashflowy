module.exports.bull = {
    //generate cron format using: https://crontab.guru
    repeats: [
        {
            name: 'surface_crawl_each_users',
            active: false,
            repeat: { cron: "*/10 * * * *" },
            data: {}
        },
        {
            name: 'calculate_uam_each_org',
            active: false,
            repeat: { cron: "0 */12 * * *" },
            data: {}
        },
        {
            name: 'send_weekly_email_each_user',
            active: false,
            repeat: { cron: "0 0 * * 0" },
            data: {}
        },
        {
            name: 'send_monthly_email_each_user',
            active: false,
            repeat: { cron: "0 0 1 * *" },
            data: {}
        },
        {
            name: 'clean_completed_jobs',
            active: true,
            repeat: { cron: "0 1 * * *" },
            data: {}
        }
    ]
}