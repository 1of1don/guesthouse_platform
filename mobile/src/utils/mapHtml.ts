// Builds a small web page that shows a Leaflet map with one price pin per guesthouse.
// Leaflet + OpenStreetMap need no API key, so the map works in the APK for free.
// Tapping a pin highlights it and sends the guesthouse id back to the app,
// which shows a small card for it at the bottom (like the HTML demo).
import { Colors } from '../theme';

export type MapPin = { id: string; name: string; price: string; lat: number; lng: number };

// focusId: start zoomed in on this guesthouse (from "Show on the map"). null = show them all.
// fitKey: changes when "Fit all" is tapped, so the map reloads and zooms out again.
export function buildMapHtml(pins: MapPin[], colors: Colors, focusId: string | null, fitKey: number): string {
  // JSON.stringify keeps names safe to put inside the script.
  const data = JSON.stringify(pins).replace(/</g, '\\u003c');
  const tiles = colors.isDark ? 'filter: invert(1) hue-rotate(180deg) brightness(.85);' : '';

  return `<!doctype html>
<!-- fit ${fitKey} -->
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; background: ${colors.soft}; font-family: system-ui, sans-serif; }
  .leaflet-tile-pane { ${tiles} }
  .pin { background: ${colors.primary}; color: ${colors.onPrimary}; padding: 5px 10px; border-radius: 99px;
         font-weight: 700; font-size: 12px; white-space: nowrap; border: 2px solid #fff;
         box-shadow: 0 2px 8px rgba(0,0,0,.25); transform: translate(-50%, -100%); display: inline-block; }
  .pin.on { background: #fff; color: ${colors.primary}; border-color: ${colors.primary}; transform: translate(-50%, -100%) scale(1.15); }
  .offline { padding: 24px; text-align: center; color: ${colors.muted}; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var pins = ${data};
  var focusId = ${JSON.stringify(focusId)};
  var labels = {}; // guesthouse id -> its price label, so we can highlight one

  // Highlights one pin and tells the app (phone) or the parent page (web preview) which one.
  function selectPin(id) {
    Object.keys(labels).forEach(function (key) { labels[key].className = key === id ? 'pin on' : 'pin'; });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(id);
    else window.parent.postMessage({ micasaSelect: id }, '*');
  }

  if (!window.L) {
    document.getElementById('map').innerHTML = '<p class="offline">The map needs an internet connection.</p>';
  } else {
    var map = L.map('map', { zoomControl: false }).setView([-22.3, 24.7], 5); // Botswana
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    var bounds = [];
    pins.forEach(function (p) {
      var label = document.createElement('span');
      label.className = 'pin';
      label.textContent = p.price; // textContent, so a name can never inject HTML
      labels[p.id] = label;
      var marker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({ html: label, className: '', iconSize: null }),
        title: p.name,
      }).addTo(map);
      marker.on('click', function () { selectPin(p.id); });
      bounds.push([p.lat, p.lng]);
    });
    var focus = pins.filter(function (p) { return p.id === focusId; })[0];
    if (focus) { map.setView([focus.lat, focus.lng], 13); selectPin(focus.id); }
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
    else if (bounds.length === 1) map.setView(bounds[0], 12);
  }
</script>
</body>
</html>`;
}
