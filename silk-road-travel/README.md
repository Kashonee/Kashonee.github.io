# Silk Road Travel

Kazakh-language cultural travel research project, deployed under /silk-road-travel/.

The original city descriptions and research distances (170/430/1655 km) remain reference models. `site-data.js` is the canonical catalogue of ten monuments and three explicitly labelled city-centre transit points. Maps, custom planning and visitor cards use these same coordinates.

`planner-core.js` owns validated URL/storage state (route, ordered stops, speed, visit hours, breaks, return-to-start), road requests, short-lived browser caching, and leg tables. Driving geometries and distances come from the public OSRM demo over HTTPS using OpenStreetMap. No keys are required. Requests are coalesced and throttled, timeout after 15 seconds, and fail with an explicit unavailable state. There is no fabricated kilometre fallback. Records expire after seven days on reload. Public demo availability is not guaranteed; deploy a maintained routing provider for sustained traffic.

`journey.js` connects route and calculator views, visitor passports and observation tasks. `geo-map.js` renders individual monuments and the selected road geometry. `defense.html` is the five-step presentation of the original research model; it also links to current road calculations.

The current browser UI can obtain actual road-network outputs, but these are estimates, not live traffic or confirmed monument entrances. Raw source URL, retrieval date and legs accompany each successful result. A destination can be snapped to a road within 1500 metres; pedestrian access must be checked separately.

Authors: Бақтыгерей Дана and Алламберген Камшат, grade 7, №3 Қарауылкелді орта мектебі. Supervisor: Аккожаева Самал Кожагалиевна.

The project representative reports user trials occurred. Raw participant counts and measurements have not been supplied to the site. No efficacy statistics are invented.

## Added photographs (27 October 2026)

- Sayram: Karashash Ana.JPG, Yakov Fedorov, 15 June 2014, CC BY-SA 3.0. Source: https://commons.wikimedia.org/wiki/File:Karashash_Ana.JPG . License: https://creativecommons.org/licenses/by-sa/3.0/ . Commons file description and visible architecture were cross-checked; the structured depicts field appears inconsistent with the file description/category. Image is displayed responsively, without a generated reconstruction.
- Qoylyq: Welcome.kz image explicitly captioned “Городище Койлык” in https://welcome.kz/ru/ind-tours/ind-tours-almaty/ind-golden-ring-jungariya . Asset: https://welcome.kz/assets/images/products/0_gallery/locations/zhetysu_region/koilyk.jpeg . The site permits copying with an active source link: https://welcome.kz/en/info-cities/zhetysu-oblast/koilyk . Photographer is not separately identified. This is not claimed to be a Creative Commons image.

Photos are loaded from their original hosts. Attribution and source links appear on the city cards, city pages and virtual tour. Loading depends on those external hosts.
