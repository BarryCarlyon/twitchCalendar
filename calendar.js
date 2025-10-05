let icalTemplate = 'https://api.twitch.tv/helix/schedule/icalendar?broadcaster_id={id}';

const calendarInstance = new calendarJs( "calendar" );

async function loadFeed(broadcaster_id, color) {
    // fetch the iCal feed from twitch
    // we'll template replace the URI here.
    // https://dev.twitch.tv/docs/api/reference/#get-channel-icalendar
    let req = await fetch(
        icalTemplate.replace('{id}', broadcaster_id),
    );
    if (req.status != 200) {
        // just in case of bad/banned TwitchID...
        return;
    }
    // to text
    let icalText = await req.text();

    let icalParsed = ICAL.parse(icalText);
    let compData = new ICAL.Component(icalParsed);
    let name = compData.getFirstPropertyValue("name");
    let vevents = compData.getAllSubcomponents("vevent");

    const events = [];
    vevents.forEach((vevent) => {
        const event = new ICAL.Event(vevent);

        /*
        // we pass to the recurrence loop to render with instead of rendering ONE event
        // we could interupt RRULE and use the repeat stuff the cal lib has
        // or we can add individual events (which is what we is doing)
        events.push({
            title: event.summary,
            from: event.startDate.toJSDate(),
            to: event.endDate.toJSDate(),
            description: event.description ?? '',
        });
        */

        // calculate the duration so we can pass to the repeator
        let duration = event.endDate.toJSDate() - event.startDate.toJSDate();

        // Check streamer gave the event a title
        if (event.summary == '') {
            event.summary = 'A Stream';
        }

        let expand = new ICAL.RecurExpansion({
            component: vevent,
            dtstart: vevent.getFirstPropertyValue('dtstart')
        });

        // next is always an ICAL.Time or null
        let next;
        // if we don't have a counter it will go FOREVER
        // since Twitch events do not have a end of recurrence
        // we'll make sure not to infinity loop
        let counter = 0;

        // @tofix: account for what is start date of shown calendar

        // https://github.com/kewisch/ical.js/wiki/Parsing-iCalendar#recurring-events
        // RFC https://datatracker.ietf.org/doc/html/rfc5545
        // ical time https://kewisch.github.io/ical.js/api/ICAL.Time.html

        // do event start date which is LAWD knows when
        // and render the next 52 weeks...
        while (counter < 52 && (next = expand.next())) {
            //console.log(next);
            counter++;

            // calc end based on start + duration
            let end = next.toJSDate();
            end.setMilliseconds(end.getMilliseconds() + duration);

            // add the event and lock it
            // otherwise viewers can drag shit around
            events.push({
                title: event.summary,
                from: next.toJSDate(),
                to: end,

                color,
                url: `https://twitch.tv/${name.toLowerCase()}`,
                locked: true
            });
        }
    });

    calendarInstance.addEvents(events);
}

let params = new URLSearchParams(window.location.search);
let broadcaster_id = params.get('user_id');
let color = `#${params.get('color') ?? '924afe'}`;

if (broadcaster_id) {
    calendarInstance = new calendarJs( "calendar" );
    loadFeed(broadcaster_id, color);
} else {
    calendar.textContent = 'No Broadcaster ID Declared';
}