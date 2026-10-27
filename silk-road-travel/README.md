# Silk Road Travel

Kazakh-language cultural travel research project, deployed under /silk-road-travel/.

The original city descriptions and research distances (170/430/1655 km) remain reference models. `site-data.js` is the canonical catalogue of ten monuments and three explicitly labelled city-centre transit points. Maps, custom planning and visitor cards use these same coordinates.

`planner-core.js` owns validated URL/storage state (route, ordered stops, speed, visit hours, breaks, return-to-start), road requests, short-lived browser caching, and leg tables. Driving geometries and distances come from the public OSRM demo over HTTPS using OpenStreetMap. No keys are required. Requests are coalesced and throttled, timeout after 15 seconds, and fail with an explicit unavailable state. There is no fabricated kilometre fallback. Records expire after seven days on reload. Public demo availability is not guaranteed; deploy a maintained routing provider for sustained traffic.

`journey.js` connects route and calculator views, visitor passports and observation tasks. `geo-map.js` renders individual monuments and the selected road geometry. `defense.html` is the five-step presentation of the original research model; it also links to current road calculations.

The current browser UI can obtain actual road-network outputs, but these are estimates, not live traffic or confirmed monument entrances. Raw source URL, retrieval date and legs accompany each successful result. A destination can be snapped to a road within 1500 metres; pedestrian access must be checked separately.

Authors: Бақтыгерей Дана and Алламберген Камшат, grade 7, №3 Қарауылкелді орта мектебі. Supervisor: Аккожаева Самал Кожагалиевна.

The project representative reports user trials occurred. Raw participant counts and measurements have not been supplied to the site. No efficacy statistics are invented.
