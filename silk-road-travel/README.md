# Silk Road Travel

Kazakh-language cultural travel research project, deployed under /silk-road-travel/.

The original city descriptions and research distances (170/430/1655 km) remain reference models. `site-data.js` is the canonical catalogue of ten monuments and three explicitly labelled city-centre transit points. Maps, custom planning and visitor cards use these same coordinates.

`planner-core.js` owns validated URL/storage state (route, ordered stops, calculation mode, average speed, visit hours, breaks, return-to-start), road requests, 24-hour browser caching and leg tables. Automotive distances, durations and geometry come from FOSSGIS routed-car, with the OSRM public demo as a fallback. No keys are required. Requests are coalesced and throttled to at most one start per 1.1 seconds, timeout after 12 seconds per provider, and fail with an explicit unavailable state. There is no fabricated kilometre fallback. Public service availability is not guaranteed; deploy a maintained routing provider for sustained traffic.

`journey.js` connects route and calculator views, visitor passports and observation tasks. `geo-map.js` renders individual monuments and the selected road geometry. `defense.html` is the five-step presentation of the original research model; it also links to current road calculations.

The current browser UI can obtain actual road-network outputs, but these are estimates, not live traffic or confirmed monument entrances. Raw source URL, retrieval date and legs accompany each successful result. A destination can be snapped to a road within 1500 metres; pedestrian access must be checked separately.

Authors: Бақтыгерей Дана and Алламберген Камшат, grade 7, №3 Қарауылкелді орта мектебі. Supervisor: Аккожаева Самал Кожагалиевна.

The project representative reports user trials occurred. Raw participant counts and measurements have not been supplied to the site. No efficacy statistics are invented.

## Added photographs (27 October 2026)

- Sayram: Karashash Ana.JPG, Yakov Fedorov, 15 June 2014, CC BY-SA 3.0. Source: https://commons.wikimedia.org/wiki/File:Karashash_Ana.JPG . License: https://creativecommons.org/licenses/by-sa/3.0/ . Commons file description and visible architecture were cross-checked; the structured depicts field appears inconsistent with the file description/category. Image is displayed responsively, without a generated reconstruction.
- Qoylyq: Welcome.kz image explicitly captioned “Городище Койлык” in https://welcome.kz/ru/ind-tours/ind-tours-almaty/ind-golden-ring-jungariya . Asset: https://welcome.kz/assets/images/products/0_gallery/locations/zhetysu_region/koilyk.jpeg . The site permits copying with an active source link: https://welcome.kz/en/info-cities/zhetysu-oblast/koilyk . Photographer is not separately identified. This is not claimed to be a Creative Commons image.

Photos are loaded from their original hosts. Attribution and source links appear on the city cards, city pages and virtual tour. Loading depends on those external hosts.

## Car planning audit — 27 October 2026

The former 80 km/h ceiling was an arbitrary planning UI limit. The default now uses the automotive routing response's `duration` (seconds), including its road-profile and turn costs, rather than distance divided by a blanket speed. Optional manual average-speed mode accepts 20–140 km/h; this is a planning assumption, not a legal speed limit or a recommendation. Map, route builder, calculator and text export share the same mode and values.

Distances and polylines come only from validated OSRM car-route responses. Primary: FOSSGIS routed-car; fallback: OSRM public demo. Each request includes actual catalogue coordinates; route totals are cross-checked against the leg sums. A 24-hour cache includes coordinate values in the key so corrected locations cannot reuse old routes. Network failure leaves distances unfilled and offers per-leg Google Maps/Yandex driving links. Waypoint snap offsets over 100 m are shown separately; they are straight-line offsets, not verified walking distances or parking entrances.

Coordinate corrections: Kone Taraz archaeological site uses OSM node 5338584774 (42.89658, 71.39531), exposed by https://mapcarta.com/N5338584774 ; Karakhan uses published DMS N42°53′54.95″ E71°23′07.00″ from https://silkadv.com/en/content/mausoleum-karakhana ; Aisha Bibi uses published DMS N42°50′01″ E71°12′37″ from https://silkadv.com/en/content/mavzoley-aysha-bibi . The previous Kazakhstan.travel coordinate fields disagree with these object locations; its hours/fees source remains separately attributed. All points indicate heritage sites, not confirmed car entrances.

External reference checks: the indexed Yandex city-to-city page https://yandex.kz/maps/ru/routes/auto/chimkent/turkestan/ showed 164 km when retrieved; https://yandex.kz/maps/ru/routes/auto/almaty/talgar/ showed 31 km; https://yandex.kz/maps/ru/routes/auto/almaty/taldikorgan/ showed 263 km. These endpoints are the map service's cities, not the monuments in this planner; they are not used as replacement route legs. Indexed estimates are not live traffic data. No complete exact-stop routing response could be obtained in the editing environment due to network restrictions. Automated logic tests use synthetic fixtures only; no fixture values are shipped as tourist distances.

References: https://project-osrm.org/docs/v5.24.0/api/ ; https://routing.openstreetmap.de/about.html ; https://developers.google.com/maps/documentation/urls/get-started . Public routing services have no availability guarantee; pre-trip checks in a navigator remain necessary.
