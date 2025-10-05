# Whats in this Repo

This lets you take your Twitch Schedule and embed it anywhere you want

# How to use

Normally on a website you would use an iFrame.

You will need your User ID (or the user ID of the user you want to display)

So `15185913` instead of `barrycarlyon`, you can easily find your ID via [Twitch Auth Example](https://barrycarlyon.github.io/twitch_misc/authentication/implicit_auth/)

Construct your URL as follows:

`https://barrycarlyon.github.io/twitchCalendar/?user_id=MYUSERID`

You can choose to color your Events

`https://barrycarlyon.github.io/twitchCalendar/?user_id=MYUSERID&color=990000`

or

`https://barrycarlyon.github.io/twitchCalendar/?user_id=MYUSERID&color=%23990000`

Colors are HTML hex colors (with the preceeding #), find a [Quick Color Picker on Google](https://www.google.com/search?q=color+picker)

## Alternatively

Load [The UI](https://barrycarlyon.github.io/twitchCalendar/) and use the form.

# Why

Inspired by this [Reddit Post](https://www.reddit.com/r/Twitch/comments/1nto3uw/is_there_a_way_to_embed_your_stream_schedule_on/)

# Full iFrame

```html
<iframe
    src="https://barrycarlyon.github.io/twitchCalendar/?user_id=15185913&color=009900"
    width="100%"
    height="300px"
    frameborder="0"
></iframe>
```
