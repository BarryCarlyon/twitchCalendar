let icalTemplate = 'https://api.twitch.tv/helix/schedule/icalendar?broadcaster_id={id}';

let params = new URLSearchParams(window.location.search);
let broadcaster_id = params.get('user_id');
let colorParam = params.get('color') ?? '924afe';
// magic patch
colorParam = decodeURIComponent(colorParam);
if (!colorParam.startsWith('#')) {
    colorParam = `#${colorParam}`;
}

const calendarInstance = new calendarJs( "calendar", {
    manualEditingEnabled: false,
    fullScreenModeEnabled: true,
    openInFullScreenMode: true,
    isWidget: (params.get('widget') == 'true' ?? false)
} );

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

    calendarInstance.setOptions({
        organizerName: name,
    });
}

let token = '';
if (broadcaster_id) {
    loadFeed(broadcaster_id, colorParam);
} else {
    calendar.style.display = 'none';
    creator.style.display = "block";

    if (document.location.hash && document.location.hash != '') {
        var parsedHash = new URLSearchParams(window.location.hash.slice(1));
        token = parsedHash.get('access_token');

        authenticate.style.display = 'none';
        lookup.style.display = 'inline-block';

        window.location = '#';
    }

    // build the dumb only if not in an iframe...
    let url = new URL('https://id.twitch.tv/oauth2/authorize');
    url.search = new URLSearchParams([
        ['client_id', 'hozgh446gdilj5knsrsxxz8tahr3koz'],
        ['redirect_uri', `${window.location.origin}/twitchCalendar/`],
        ['response_type','token']
    ]);
    console.log(url.toString());
    authenticate.addEventListener('click', (e) => {
        e.preventDefault();

        window.location = url;
    });
    lookup.addEventListener('click', async (e) => {
        e.preventDefault();

        let login = user_id.value;
        let u = new URL('https://api.twitch.tv/helix/users');
        u.search = new URLSearchParams([
            [ 'login', login ]
        ])
        let req = await fetch(
            u,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': 'hozgh446gdilj5knsrsxxz8tahr3koz',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        if (req.status != 200) {
            // lol wut
            return;
        }
        let {data} = await req.json();
        if (data.length != 1) {
            // rip
            return;
        }
        let id = data[0].id;
        user_id.value = id;
    });

    givecode.addEventListener('click', (e) => {
        if (!user_id.value) {
            return;
        }

        e.preventDefault();

        let url = new URL('https://barrycarlyon.github.io/twitchCalendar/');
        //?user_id=${user_id.value}&color=${color.value}&widget=${widget.value}')
        url.search = new URLSearchParams([
            [ 'user_id', user_id.value ],
            [ 'color', color.value ],
            [ 'widget', widget.value ]
        ]);

        output.textContent = '';
        let inp = document.createElement('input');
        inp.style.width = '100%';
        inp.value = '<iframe' + "\n"
        + ` src="${url.toString()}"` + "\n"
        + ' width="100%"' + "\n"
        + ' height="300px"' + "\n"
        + ' frameborder="0"' + "\n"
        + '></iframe>';
        output.append(inp);
    });
}