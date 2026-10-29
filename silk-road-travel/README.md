# Silk Road Travel

Kazakh-language cultural travel research project, deployed under /silk-road-travel/.

The original city descriptions and research distances (170/430/1655 km) remain reference models. `site-data.js` is the canonical catalogue of ten monuments and three explicitly labelled city-centre transit points. Maps, custom planning and visitor cards use these same coordinates.

`planner-core.js` owns validated URL/storage state (route, ordered stops, calculation mode, average speed, visit hours, breaks, return-to-start), road requests, 24-hour browser caching and leg tables. Automotive distances, durations and geometry come from FOSSGIS routed-car, with the OSRM public demo as a fallback. No keys are required. Requests are coalesced and throttled to at most one start per 1.1 seconds, timeout after 12 seconds per provider, and fail with an explicit unavailable state. There is no fabricated kilometre fallback. Public service availability is not guaranteed; deploy a maintained routing provider for sustained traffic.

The page responsibilities are distinct:
- `routes.html` selects a preset or edits ordered stops and return-to-start. It shows daily agendas and exports a stop list without calling the road service.
- `calculator.html` consumes that plan, calculates road distance/time, breaks and visits, and exports the calculation. It links back to Routes to change stops. The always-visible number/range controls accept integer average speeds of 20–140 km/h. Editing speed selects manual mode; the provider duration remains available for comparison. Automatic mode can be selected again.
- `map.html` explores monuments and hosts the animated virtual tour. It performs no route calculation. It can display previously cached road geometry on request, without starting a road-service call.

`journey.js` connects routes, calculations and visitor passports. `geo-map.js` renders individual monuments. Old `defense.html` links redirect to the homepage; `virtual.html` redirects to `map.html#caravan`. The defense mode and separate virtual-tour navigation have been removed.

The shared URL/localStorage plan carries ordered stops and calculation preferences between pages. `quiz-data.js` contains 30 source-backed questions about six historical centres and planning. `quiz-core.js` manages single-answer scoring and completion. `quiz.js` offers all 30 questions or 10 randomly selected questions, explains each answer, links to the historical catalogue or project methodology, and reviews mistakes. Best scores are stored separately for 10 and 30 questions under new versioned keys; old five-question results are not reused.

The current browser UI can obtain actual road-network outputs, but these are estimates, not live traffic or confirmed monument entrances. Raw source URL, retrieval date and legs accompany each successful result. A destination can be snapped to a road within 1500 metres; pedestrian access must be checked separately.

Authors: Бақтыгерей Дана and Алламберген Камшат, grade 7, №3 Қарауылкелді орта мектебі. Supervisor: Аккожаева Самал Кожагалиевна.

The project representative reports user trials occurred. Raw participant counts and measurements have not been supplied to the site. No efficacy statistics are invented.

## Added photographs (27 October 2026)

- Sayram: Karashash Ana.JPG, Yakov Fedorov, 15 June 2014, CC BY-SA 3.0. Source: https://commons.wikimedia.org/wiki/File:Karashash_Ana.JPG . License: https://creativecommons.org/licenses/by-sa/3.0/ . Commons file description and visible architecture were cross-checked; the structured depicts field appears inconsistent with the file description/category. Image is displayed responsively, without a generated reconstruction.
- Qoylyq: Welcome.kz image explicitly captioned “Городище Койлык” in https://welcome.kz/ru/ind-tours/ind-tours-almaty/ind-golden-ring-jungariya . Asset: https://welcome.kz/assets/images/products/0_gallery/locations/zhetysu_region/koilyk.jpeg . The site permits copying with an active source link: https://welcome.kz/en/info-cities/zhetysu-oblast/koilyk . Photographer is not separately identified. This is not claimed to be a Creative Commons image.

Photos are loaded from their original hosts. Attribution and source links appear on the city cards, city pages and virtual tour. Loading depends on those external hosts.

## Car planning audit — 27 October 2026

The former 80 km/h ceiling was an arbitrary planning UI limit. The default now uses the automotive routing response's `duration` (seconds), including its road-profile and turn costs, rather than distance divided by a blanket speed. Optional manual average-speed mode accepts 20–140 km/h; this is a planning assumption, not a legal speed limit or a recommendation. The calculator and its export share the same mode and values; other pages retain these preferences in the shared plan without duplicating the calculation controls.

Distances and polylines come only from validated OSRM car-route responses. Primary: FOSSGIS routed-car; fallback: OSRM public demo. Each request includes actual catalogue coordinates; route totals are cross-checked against the leg sums. A 24-hour cache includes coordinate values in the key so corrected locations cannot reuse old routes. Network failure leaves distances unfilled and offers per-leg Google Maps/Yandex driving links. Waypoint snap offsets over 100 m are shown separately; they are straight-line offsets, not verified walking distances or parking entrances.

Coordinate corrections: Kone Taraz archaeological site uses OSM node 5338584774 (42.89658, 71.39531), exposed by https://mapcarta.com/N5338584774 ; Karakhan uses published DMS N42°53′54.95″ E71°23′07.00″ from https://silkadv.com/en/content/mausoleum-karakhana ; Aisha Bibi uses published DMS N42°50′01″ E71°12′37″ from https://silkadv.com/en/content/mavzoley-aysha-bibi . The previous Kazakhstan.travel coordinate fields disagree with these object locations; its hours/fees source remains separately attributed. All points indicate heritage sites, not confirmed car entrances.

External reference checks: the indexed Yandex city-to-city page https://yandex.kz/maps/ru/routes/auto/chimkent/turkestan/ showed 164 km when retrieved; https://yandex.kz/maps/ru/routes/auto/almaty/talgar/ showed 31 km; https://yandex.kz/maps/ru/routes/auto/almaty/taldikorgan/ showed 263 km. These endpoints are the map service's cities, not the monuments in this planner; they are not used as replacement route legs. Indexed estimates are not live traffic data. No complete exact-stop routing response could be obtained in the editing environment due to network restrictions. Automated logic tests use synthetic fixtures only; no fixture values are shipped as tourist distances.

References: https://project-osrm.org/docs/v5.24.0/api/ ; https://routing.openstreetmap.de/about.html ; https://developers.google.com/maps/documentation/urls/get-started . Public routing services have no availability guarantee; pre-trip checks in a navigator remain necessary.


## Керуен жолымен — animated tour (28 October 2026)

Open `map.html#caravan` and select «Сапарды бастау». A native modal dialog contains an independent Leaflet map, six city stories, attributed photographs, a stop selector and large playback controls. It does not modify the visitor's route, speed or saved stops. A separate map prevents delayed road-service replies from interrupting the presentation.

The sequence is Turkestan → Otyrar → Sayram → Taraz → Talgar → Qoylyq. Map targets match the existing photographs: the Otyrar region shows Arystanbab, and the Taraz region shows Aisha Bibi; captions distinguish those sites from the archaeological city centres. Text uses the existing historical-source catalogue, and each stop exposes its history and photo sources.

`caravan-core.js` owns playback with 20 seconds of reading time after each map arrival. Pause preserves remaining reading time; pausing a flight stops the camera and resume completes that flight. Next/previous and selecting a stop preserve paused playback. Replay starts again; the last stop ends automatically without looping. Stale arrival promises cannot advance a newer stop. Closing clears timers; switching to a hidden tab pauses. Reduced-motion settings disable camera flights and decorative animations. Image/map failures leave readable stories and source links. Fullscreen is optional; the dialog also works without that browser capability.

Validation: `node tests/caravan-core.test.cjs` covers pause/resume, interrupted flights, stale callbacks, repeated starts, paused navigation, completion and cleanup. Syntax, IDs, script ordering and local link targets are checked separately. No browser runner is available in the editing environment; visual and live map/photo loading verification remain unperformed here.


## Tour startup and history update — 28 October 2026

Startup now yields for a dialog paint before Leaflet work. The tour opens at its first monument without loading a country overview first. Long camera flights were replaced by bounded local zooms (0.75 s); coarse-pointer, reduced-motion, save-data and low-resource devices default to the explicit light mode, which uses immediate camera changes. Tile layers update after zooming, keep a smaller offscreen buffer and the background map's tiles are detached while the tour is open. The main map makes no road-service requests, so late road responses cannot interrupt the tour. The modal backdrop no longer blurs the whole page, its marker no longer animates a shadow, and timer text updates once per second. Tour Commons images request 640 px in light mode or 960 px otherwise, and only the next photo is warmed. External image hosts can still be slow; no on-device speed improvement is claimed without browser measurements.

`heritage-data.js` holds six expanded city chapters and 15 source records checked on 28 October 2026. `node scripts/render-heritage.cjs` generates accessible static content for the six city pages and updates the research bibliography. The tour uses the same catalogue for its expandable «Нысан туралы толығырақ» panel; opening it pauses playback. The new content distinguishes construction dates, restorations, archaeological remains and legends. Babadzha Khatun is described as a nearby Taraz-area monument, without inventing a new verified road-planner coordinate. Historical sources: UNESCO, the source-attributed Archaeology.kz articles based on the 2017 archaeological institute volume, Azret Sultan and Ancient Taraz museums, Abai Instituty, and Kazakhstan.travel. Source links accompany historical paragraphs; visitor observation advice is labelled as the project's own recommendation.

The environment still has no supported browser runner. Unit and static checks cannot establish frame rate or successful loading from external photo/tile servers on the user's device.

Startup verification: `node tests/caravan-startup.test.cjs` exercises the UI adapter with deterministic DOM/Leaflet doubles: deferred initialization, closing before initialization, mobile light mode, short desktop transitions, smaller image URLs, detail-panel pause, background-map suspension events, and a missing-Leaflet fallback. These checks are not browser performance measurements. Both caravan test files pass; all 15 HTML pages and generated source references pass structural checks.


## Current validation — page simplification

Run `node tests/quiz-core.test.cjs` for the 30-question bank, source references, scoring, invalid/double answers, completion and quick-mode sampling. Run `node tests/planner-flow.test.cjs` for URL/state preservation, road-versus-manual time, integer speed, invalid input, calculator event wiring and the absence of road requests on Routes and Map. The existing caravan tests cover playback and startup regressions. Logic/UI-adapter tests use synthetic data and DOM doubles, not live traffic or browser rendering. No supported browser runner is available in the editing environment.


## Expanded research section — 29 October 2026

`research.html` contains the research passport, historical context, methods, six-centre comparison, catalogue-derived route statistics, an accessible coverage chart, findings, limitations, survey and test protocol, conclusions and 15 historical references. Experiment outcomes remain unreported until raw records are supplied. Model distances are confined to a clearly labelled explanatory disclosure.

Run `node scripts/render-research.cjs` to regenerate the page from `scripts/research-content.template` and the shared city, site and heritage catalogues. This also regenerates downloadable CSV tables, an empty experiment protocol and research metrics JSON in `research-files/`; the questionnaire TXT is maintained separately. The research page makes no road-service requests and uses no extra runtime JavaScript. Sources and tables remain readable without JavaScript.

Validation: `node tests/research-content.test.cjs` checks metric consistency with canonical routes, bibliography anchors and download integrity; `python tests/site-structure.py` checks page structure, links and script syntax. Visual browser QA remains unavailable in this environment.


## Address selection — 29 October 2026

Routes no longer asks visitors to type latitude or longitude. `address-picker.js` provides a place/address input and links to Google Maps, Yandex Maps and 2GIS search. These open the providers' own pages/apps; they are not an embedded geocoding API. Paste a place link to import an explicit point, then review and confirm it. `address-core.js` validates provider hosts, coordinate ranges and axis order. Google camera coordinates, Yandex `ll` and 2GIS `m` are viewport hints only, never saved automatically as destinations. Opaque place IDs and shortened links require opening the full provider link or selecting a location in the optional map. There is no scraping, redirect proxy or Nominatim call.

The optional OpenStreetMap picker loads Leaflet only when opened; clicking a location, dragging its pin or choosing the map centre creates an unsaved draft. Confirmation updates the existing shared plan used by the calculator. Existing saved endpoints remain valid; rejected links do not overwrite them. The daily calculator remains in `trip-tools.js`.

Provider references: https://developers.google.com/maps/documentation/urls/get-started ; https://www.yandex.ru/support/maps/ru/concept/get-map-reference ; https://help.2gis.ru/question/razrabotchikam-zapusk-ideystviya-vmobilnom-prilozhenii-cherez-deeplink . Provider-specific share formats may change; unresolved links leave the existing plan untouched.

Checks: `node tests/address-core.test.cjs` and `node tests/address-ui.test.cjs` cover URL formats, unsafe inputs, viewport/point distinctions, saved data and explicit map confirmation using DOM/Leaflet doubles. No browser visual or live external-search QA was available.
