document.addEventListener('DOMContentLoaded', function () {
  // Initialize the map
  const map = L.map('map').setView([37.21549, 10.13570], 13);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  // ========================
  // Custom Mode Switch Control (Top Right)
  // ========================

  const ModeControl = L.Control.extend({
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      container.style.cssText = `
        background-color: white;
        padding: 5px;
        border-radius: 5px;
        display: flex;
        gap: 5px;
      `;

      // Add Camera Button
      const cameraBtn = L.DomUtil.create('button', '', container);
      cameraBtn.innerHTML = 'Add Camera';
      cameraBtn.style.fontWeight = 'bold'; // Default active
      cameraBtn.style.cursor = 'pointer';

      // Draw Polygon Button
      const polygonBtn = L.DomUtil.create('button', '', container);
      polygonBtn.innerHTML = 'Draw Polygon';
      polygonBtn.style.cursor = 'pointer';

      // Finish Polygon Button
      const finishBtn = L.DomUtil.create('button', '', container);
      finishBtn.innerHTML = 'Finish Polygon';
      finishBtn.style.cursor = 'pointer';
      finishBtn.disabled = true;  // Disabled until at least 3 points

      L.DomEvent.disableClickPropagation(container); // Prevent map drag/zoom on button click

      let mode = 'camera'; // Default mode
      let polygonPoints = [];
      let polygonLayer = null;

      function resetPolygon() {
        polygonPoints = [];
        if (polygonLayer) {
          map.removeLayer(polygonLayer);
          polygonLayer = null;
        }
        finishBtn.disabled = true;
      }

      cameraBtn.onclick = () => {
        mode = 'camera';
        cameraBtn.style.fontWeight = 'bold';
        polygonBtn.style.fontWeight = 'normal';
        finishBtn.disabled = true;
        resetPolygon();
      };

      polygonBtn.onclick = () => {
        mode = 'polygon';
        polygonBtn.style.fontWeight = 'bold';
        cameraBtn.style.fontWeight = 'normal';
        finishBtn.disabled = polygonPoints.length < 3;
        resetPolygon();
      };

      finishBtn.onclick = () => {
        if (polygonPoints.length < 3) {
          alert("You need at least 3 points to finish the polygon.");
          return;
        }
        // Close the polygon by adding the first point at the end if not already closed
        const firstPoint = polygonPoints[0];
        const lastPoint = polygonPoints[polygonPoints.length - 1];
        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
          polygonPoints.push(firstPoint);
        }

        if (polygonLayer) map.removeLayer(polygonLayer);
        polygonLayer = L.polygon(polygonPoints, {
          color: 'blue',
          fillColor: '#3f3',
          fillOpacity: 0.4,
        }).addTo(map);

        submitZone(polygonPoints);
        resetPolygon();
        polygonBtn.click(); // stay in polygon mode
      };

      // Expose polygonPoints and polygonLayer for outer scope (needed in map click)
      this.getMode = () => mode;
      this.getPolygonPoints = () => polygonPoints;
      this.getPolygonLayer = () => polygonLayer;
      this.setPolygonLayer = (layer) => { polygonLayer = layer; };
      this.setPolygonPoints = (points) => { polygonPoints = points; };
      this.setFinishBtnDisabled = (val) => { finishBtn.disabled = val; };

      return container;
    },
  });

  const modeControl = new ModeControl({ position: 'topright' }).addTo(map);

  // ========================
  // Map Click Behavior
  // ========================
  map.on('click', function (e) {
    const mode = modeControl.getMode();

    if (mode === 'camera') {
      // ===== Add Camera Mode (customize as needed) =====
      const template = document.getElementById('popupFormTemplate');
      if (!template) {
        alert("Form template not found!");
        return;
      }

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = template.innerHTML;

      const locInput = tempDiv.querySelector('input[name="location"]');
      if (locInput) {
        locInput.value = `${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`;
      }

      L.popup()
        .setLatLng(e.latlng)
        .setContent(tempDiv.innerHTML)
        .openOn(map);

    } else if (mode === 'polygon') {
      // ===== Polygon Drawing Mode =====
      let polygonPoints = modeControl.getPolygonPoints();
      let polygonLayer = modeControl.getPolygonLayer();

      polygonPoints.push([e.latlng.lat, e.latlng.lng]);

      if (polygonLayer) {
        map.removeLayer(polygonLayer);
      }

      polygonLayer = L.polygon(polygonPoints, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.4,
      }).addTo(map);

      modeControl.setPolygonPoints(polygonPoints);
      modeControl.setPolygonLayer(polygonLayer);

      // Enable finish button if polygon has 3 or more points
      modeControl.setFinishBtnDisabled(polygonPoints.length < 3);
    }
  });

  // ========================
  // Submit polygon JSON form to Django
  // ========================

  function submitZone(points) {
    // Prompt user for zone name
    const zoneName = prompt("Enter a name for this zone:");
    if (!zoneName) {
      alert("Zone name is required.");
      return;
    }

    // Create and submit form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/add-zone/';  // Update URL to your Django endpoint

    // CSRF token
    const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]');
    if (!csrfToken) {
      alert('CSRF token not found. Please make sure you have {% csrf_token %} in your template.');
      return;
    }
    form.appendChild(csrfToken.cloneNode());

    // Name input
    const nameInput = document.createElement('input');
    nameInput.type = 'hidden';
    nameInput.name = 'name';
    nameInput.value = zoneName;
    form.appendChild(nameInput);

    // Polygon input (JSON string)
    const polyInput = document.createElement('input');
    polyInput.type = 'hidden';
    polyInput.name = 'polygon';
    polyInput.value = JSON.stringify(points);
    form.appendChild(polyInput);

    document.body.appendChild(form);
    form.submit();
  }

  // ========================
  // Load existing zones and draw them
  // ========================

  // Expect `zones` as an array of objects like:
  // zones = [{name: "Zone 1", coords: [[lat, lng], [lat, lng], ...]}, ...]
  if (typeof zones !== 'undefined') {
  zones.forEach(zone => {
    if (!zone.coords || zone.coords.length === 0) return;

    const polygon = L.polygon(zone.coords, {
      color: 'blue',
      fillColor: '#3399ff',
      fillOpacity: 0.5,
    }).addTo(map);

    // Create popup content with delete button
    const popupContent = document.createElement('div');
    popupContent.innerHTML = `<b>Zone: ${zone.name}</b><br>`;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete Zone';
    deleteBtn.style.marginTop = '5px';
    deleteBtn.onclick = function () {
      if (confirm(`Are you sure you want to delete zone "${zone.name}"?`)) {
        deleteZone(zone.id, polygon);
      }
    };

    popupContent.appendChild(deleteBtn);
    polygon.bindPopup(popupContent);

    // Delete popup form using zone name
  const popupHtml = `
    <div style="text-align:center; font-family: Arial, sans-serif; line-height: 1.4;">
      <b style="font-size: 16px;">${zone.name}</b><br><br>
      <form method="POST" action="/delete-zone/" onsubmit="return confirm('Delete this zone?');">
        <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
        <input type="hidden" name="name" value="${zone.name}">
        <button type="submit" style="padding: 6px 12px; font-size: 14px; cursor: pointer;">Delete</button>
      </form>
    </div>
  `;

  polygon.bindPopup(popupHtml);

  });
}

  // ========================
  // Add camera markers if any
  // ========================

  // Example cameraIcon and cameras array - customize or remove as needed
  const cameraIcon = L.divIcon({
    html: '<i class="bi bi-camera-video-fill" style="font-size: 24px; color: black;"></i>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  if (typeof cameras !== 'undefined') {
    cameras.forEach(cam => {
      if (!cam.location) return;
      const [lat, lng] = cam.location.split(',').map(Number);
      L.marker([lat, lng], { icon: cameraIcon })
        .addTo(map)
        .bindPopup(cam.popup);
    });
  }




});
