# Driving Cost Calculator

**[Try it now →](https://kastrack.github.io/Driving-Cost-Calculator/)**

A free, fast, no-signup road trip cost calculator that runs entirely in your browser.

## What it is

The Driving Cost Calculator estimates how much fuel — gas, diesel, electricity, or any combination — your next road trip will cost. Type a distance and the trip cost updates instantly. Or paste in your origin and destinations and let the app fetch the driving distance and the highway-vs-city split for you. Save the cars you actually own and compare per-trip costs across all of them at once.

## Why it's useful

- **Plan a trip honestly.** Hard-coded "average" gas prices and fuel-economy guesses get you a fuzzy answer. Pulling in your real numbers — your car, your local fuel price — gets you a real one.
- **Compare cars before you drive.** If you have two cars in the family, see which one is cheaper to take *for this specific trip* (a hybrid wins on city errands; a diesel often wins on a long highway haul).
- **Compare gas vs. EV.** Show all three pump prices at once — gas, diesel, electricity — and decide which car to take.
- **No account, no app store, no ads.** Open the page, get an answer. Install it to your home screen if you use it often.
- **Share the math.** Every calculation has a URL. Send a link to whoever's splitting the bill, and the page loads with your numbers already filled in.

## Features

### Trip planning

- **Distance + highway mix slider.** Set the percentage of the trip spent on the highway vs. in town — fuel efficiency and trip cost adjust accordingly.
- **Auto-calculate by route.** Type an origin and one or more destinations, and the app geocodes them, fetches the driving route, and fills in the distance + highway percentage automatically.
- **Multi-stop routes.** Add as many waypoints as you want; the calculator routes through them in order.
- **One-way or round-trip.** Toggle to double the calculated distance for a return journey, without re-running the route.
- **View the route on a map.** Opens the calculated route in OpenStreetMap so you can see exactly which roads it took.

### Fuel pricing

- **Gas, diesel, electric — any combination.** Pick which fuel(s) you want to see prices for. The headline cost shows all selected fuels side by side.
- **Sensible regional defaults.** Each of 33 supported regions ships with reasonable starting prices for gas, diesel, and electricity rates.
- **Stale-price reminder.** After about a month of not touching a price, a small "↻ update?" prompt appears next to it — fuel prices move, and your defaults shouldn't.

### Vehicles

- **Find your car.** Search by year, make, model, and trim from the FuelEconomy.gov database (US EPA data). Highway and city efficiency get filled in automatically.
- **Save up to 10 cars.** Once a car is found it sticks around as a clickable pill — pick a different car for the same trip in one tap.
- **Live cost comparison.** With two or more saved cars, a per-car cost row appears below the headline showing exactly what each one would cost for the current trip.
- **Visual fuel-type cues.** Each saved car is colour-tinted by its fuel type — terracotta for gas, green for diesel, blue for electric, amber for "other" (PHEV, hydrogen, etc.).
- **EV-aware.** EVs use kWh inputs and your local electricity rate; the per-car comparison automatically uses the right rate for each car.

### Sharing & splitting

- **Shareable URLs.** Every input — distance, prices, MPG, route, mode — is encoded in the URL. The address bar updates as you type, so you can copy-paste a URL at any moment.
- **One-tap share.** A Share button opens the system share sheet on mobile, or copies the URL to clipboard on desktop.
- **Split a trip.** A Split button divides the cost across 2–5 people (or any custom number) — handy for ride-shares or carpools.

### Localization

#### NOTE: All regional differences and translations were done by AI. If you notice a mistake, p. Cars never sold in the US (Peugeot, Dacia, Lada, etc.) won't appear in the lookup; their MPG can still be entered manually.lease create a github issue what should be changed.

- **24 languages.** Czech, Danish, Dutch, English, Finnish, French, German, Greek, Hindi, Hungarian, Indonesian, Italian, Japanese, Korean, Norwegian, Polish, Portuguese, Romanian, Russian, Spanish, Swedish, Turkish, Vietnamese, and Chinese.
- **33 regions.** Per-region currency, fuel volume unit (US gallon, UK gallon, or litre), distance unit (mi or km), and number formatting.
- **5 efficiency metrics.** MPG (US), MPG (UK), L/100km, km/L, and km/gallon.

### Offline & install

- **Installable as a PWA.** Add it to your home screen on iOS, Android, or desktop and it opens like a native app.
- **Works offline.** After first load, the entire app — UI, translations, routing endpoints aside — is available with no connection. Drop into airplane mode mid-trip and the calculator still works for any pre-saved cars.

### Privacy

- **No accounts.** Nothing to sign up for.
- **No tracking.** No analytics, no telemetry, no cookies.
- **Your data stays in your browser.** Cars, prices, preferences — all in `localStorage`. Clearing the browser clears everything.

## Data sources

The app is built on free, open community services with no API keys required:

- **[FuelEconomy.gov](https://www.fueleconomy.gov/)** (US Department of Energy / EPA) — vehicle fuel economy data.
- **[Photon](https://photon.komoot.io/)** (Komoot) — address autocomplete from OpenStreetMap data.
- **[Nominatim](https://nominatim.openstreetmap.org/)** — geocoding fallback.
- **[Valhalla](https://github.com/valhalla/valhalla)** (FOSSGIS-hosted) — driving route + per-edge road class.
- **[OpenStreetMap](https://www.openstreetmap.org/copyright)** contributors — the map data behind every routing call.

Pricing defaults are best-effort 2025 estimates and will drift over time — the in-app stale-price prompt is the cure.

## Limitations

- **FuelEconomy.gov is US-only.** Cars never sold in the US (Peugeot, Dacia, Lada, etc.) or that are exempt from EPA fuel economy testing and reporting won't appear in the lookup; their MPG can still be entered manually. 
- **PHEVs are approximated.** Plug-in hybrids whose primary fuel is "Premium Gas or Electricity" don't get a per-car cost calculation — we have no honest way to assign a single rate without knowing the trip's battery state — so they fall back to the gas rate with a warning glyph.
- **Routing is best-effort.** The free community routing services are reliable for normal trips but not production-grade. If a route fails, you can still type a distance manually.

