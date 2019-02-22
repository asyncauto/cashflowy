module.exports.bull = {
    //generate cron format using: https://crontab.guru
    repeats: [
        {
            name: 'surface_crawl_all_users',
            active: true,
            repeat: { cron: "*/10 * * * *" },
            data: {}
        },
        {
            name: 'calculate_uam_all_users',
            active: true,
            repeat: { cron: "0 */12 * * *" },
            data: {}
        },
        {
            name: 'send_weekly_email_all_users',
            active: true,
            repeat: { cron: "0 0 * * 0" },
            data: {}
        },
        {
            name: 'send_monthly_email_all_users',
            active: true,
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