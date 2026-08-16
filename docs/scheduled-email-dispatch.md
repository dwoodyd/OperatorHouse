# Durable Email Scheduling Activation

Email dispatch no longer relies on an in-process timer, which would stop when an autoscaled instance sleeps. The app now exposes two platform-authenticated Heartbeat callbacks:

| Job | Callback | UTC cadence |
| --- | --- | --- |
| Founding-member onboarding email | `/api/scheduled/onboarding-email` | `0 0 8 * * *` (daily at 08:00) |
| Email-sequence due-step processing | `/api/scheduled/sequence-email` | `0 0 * * * *` (hourly) |

After the checkpoint containing these callbacks is published, create the jobs from the project sandbox as the project owner:

```sh
manus-heartbeat create --name operator-house-onboarding-email --cron "0 0 8 * * *" --path /api/scheduled/onboarding-email --description "Daily founding-member onboarding email dispatch"
manus-heartbeat create --name operator-house-sequence-email --cron "0 0 * * * *" --path /api/scheduled/sequence-email --description "Hourly due email-sequence dispatch"
```

The platform will retry transient failures. The dispatch jobs use existing send-log records to avoid duplicate onboarding emails when retries occur. The project owner can inspect, pause, resume, and review job history in the project schedule controls after creation.
