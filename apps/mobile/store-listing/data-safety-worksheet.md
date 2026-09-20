# Play Console "Data safety" form — how to fill it in

This is a worksheet, not a file you upload — Play Console's **App content → Data
safety** section is a questionnaire in the browser. Below is exactly what to click,
based on what the app actually does (verified by reading the code, not guessing):
CouponKeeper stores everything locally in an on-device SQLite database
(`apps/mobile/src/db/`), has no backend, no account system, no analytics SDK, and no
ad SDK. The only network permission present (`INTERNET`) is boilerplate added
automatically by the Capacitor/Android template and is not used to send data anywhere
— nothing in the source calls `fetch`/`XMLHttpRequest`/any HTTP client.

## Steps

1. **Does your app collect or share any of the required user data types?**
   → **No.**
   Play lets you stop here if this is genuinely true. It is: no analytics, no crash
   reporting SDK, no ad network, no cloud sync, nothing leaves the device.

2. **Data collected/shared table** — not shown at all once you answer "No" above.
   (If Play's UI still asks you to confirm per-category, every category — Location,
   Personal info, Financial info, Health & fitness, Messages, Photos/videos, Audio,
   Files & docs, Calendar, Contacts, App activity, Web browsing, App info & performance,
   Device or other IDs — is answered **"Not collected"**.)

3. **Security practices**
   - "Is data encrypted in transit?" → not applicable (nothing is transmitted); if
     Play forces an answer, "No data is transmitted" / N/A option, not "No".
   - "Can users request data deletion?" → the honest, accurate description is: data
     never leaves the device in the first place, so there is nothing to request
     deletion *of* from the developer — the user already has full local control
     (delete a coupon/channel in-app, or uninstall the app to erase everything).
     Use whichever option in Play's current UI matches "not applicable / all data
     stays on-device."

4. **Independent security review** → No (not applicable for an app this size).

## Why POST_NOTIFICATIONS doesn't change any of this

The app schedules **local, on-device** notifications (see
`apps/mobile/src/notifications/expiryNotifications.ts`) to remind you a coupon is
about to expire. This is the Android OS's own local notification scheduler — no data
about your coupons is sent to a push server, Firebase, or anywhere else to make this
work. It has no bearing on the Data Safety form.

## If a future version adds cloud sync

`CLAUDE.md`'s "Open Questions" section notes cloud backup/sync is deliberately
deferred. If it ships later, this form (and the privacy policy at
`docs/privacy-policy.html`) must be revisited before that release goes out — at that
point the app *would* collect/transmit user data (the coupons themselves), and both
this worksheet and the privacy policy need updating to say so accurately.
