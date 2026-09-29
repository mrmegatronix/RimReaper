/* ==========================================================================
   NZ ROADHAZARD // REAL-TIME POTHOLE TRACKER ENGINE
   Waimate District & Christchurch City, South Island, New Zealand
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIGURATION & REGIONS ---
  const REGIONS = {
    christchurch: { lat: -43.5321, lng: 172.6362, zoom: 13, name: 'Christchurch City' },
    waimate: { lat: -44.7333, lng: 171.0500, zoom: 14, name: 'Waimate District' },
    canterbury: { lat: -44.1500, lng: 171.8500, zoom: 8, name: 'Canterbury South Island' }
  };

  let activeRegionKey = 'canterbury';
  let isFrozen = false;
  let soundEnabled = true;
  let audioCtx = null;

  // --- INITIAL SEED INCIDENTS (Christchurch & Waimate) ---
  const INITIAL_INCIDENTS = [
    {
      id: 'pot-wmt-01',
      address: 'Queen St & High St, Waimate',
      lat: -44.7328,
      lng: 171.0492,
      council: 'Waimate District Council',
      region: 'Waimate',
      severity: 'Critical',
      lane: 'Main Traffic Lane',
      desc: 'Deep jagged asphalt crater near heritage silos; cars forced to swerve towards oncoming traffic.',
      photo: 'deep-pothole',
      reportedAt: Date.now() - 1000 * 60 * 35, // 35 mins ago
      status: 'Active',
      upvotes: 14,
      upvotedByUser: false
    },
    {
      id: 'pot-wmt-02',
      address: 'Gorge Road (SH82), Waimate',
      lat: -44.7410,
      lng: 171.0620,
      council: 'NZTA Waka Kotahi',
      region: 'State Highway',
      severity: 'Moderate',
      lane: 'Left Shoulder / Kerb',
      desc: 'Edge tarmac breaking apart along heavy transport corridor towards Makikihi junction.',
      photo: 'gravel-edge',
      reportedAt: Date.now() - 1000 * 60 * 140, // 2.3 hrs ago
      status: 'Scheduled',
      upvotes: 7,
      upvotedByUser: false
    },
    {
      id: 'pot-wmt-03',
      address: 'Timaru Road & Mill Rd, Waimate',
      lat: -44.7260,
      lng: 171.0540,
      council: 'Waimate District Council',
      region: 'Waimate',
      severity: 'Minor',
      lane: 'Cycle Lane / Verge',
      desc: 'Cluster of surface craters expanding after wet weekend frost.',
      photo: 'urban-crevice',
      reportedAt: Date.now() - 1000 * 60 * 320, // 5.3 hrs ago
      status: 'Active',
      upvotes: 3,
      upvotedByUser: false
    },
    {
      id: 'pot-chc-01',
      address: 'Brougham St (SH76) near Antigua St, Christchurch',
      lat: -43.5420,
      lng: 172.6310,
      council: 'NZTA Waka Kotahi',
      region: 'State Highway',
      severity: 'Critical',
      lane: 'Main Traffic Lane',
      desc: 'Severe 75mm deep rim breaker in westbound freight lane; multiple burst tyre reports.',
      photo: 'deep-pothole',
      reportedAt: Date.now() - 1000 * 60 * 18, // 18 mins ago
      status: 'Active',
      upvotes: 29,
      upvotedByUser: false
    },
    {
      id: 'pot-chc-02',
      address: 'Riccarton Rd near Westfield Mall, Christchurch',
      lat: -43.5295,
      lng: 172.5980,
      council: 'Christchurch City Council',
      region: 'Christchurch',
      severity: 'Moderate',
      lane: 'Intersection / Roundabout',
      desc: 'Sinkhole forming along bus stop curb zone; high impact during evening commute.',
      photo: 'urban-crevice',
      reportedAt: Date.now() - 1000 * 60 * 85, // 1.4 hrs ago
      status: 'Active',
      upvotes: 18,
      upvotedByUser: false
    },
    {
      id: 'pot-chc-03',
      address: 'Moorhouse Ave & Colombo St, Christchurch',
      lat: -43.5401,
      lng: 172.6360,
      council: 'Christchurch City Council',
      region: 'Christchurch',
      severity: 'Critical',
      lane: 'Centerline / Divider',
      desc: 'Asphalt crumbling between lane markers; dangerous for motorcyclists & cyclists.',
      photo: 'deep-pothole',
      reportedAt: Date.now() - 1000 * 60 * 220, // 3.6 hrs ago
      status: 'Scheduled',
      upvotes: 11,
      upvotedByUser: false
    },
    {
      id: 'pot-chc-04',
      address: 'Linwood Ave & Aldwins Rd, Christchurch',
      lat: -43.5350,
      lng: 172.6680,
      council: 'Christchurch City Council',
      region: 'Christchurch',
      severity: 'Fixed',
      lane: 'Main Traffic Lane',
      desc: 'Permanent hot-mix patch completed by Christchurch City Council contractor crews.',
      photo: 'urban-crevice',
      reportedAt: Date.now() - 1000 * 60 * 600, // 10 hrs ago
      status: 'Repaired',
      upvotes: 22,
      upvotedByUser: false
    }
  ];

  // Load from LocalStorage or seed
  let incidents = [];
  try {
    const saved = localStorage.getItem('nz_pothole_incidents');
    if (saved) {
      incidents = JSON.parse(saved);
    } else {
      incidents = [...INITIAL_INCIDENTS];
      localStorage.setItem('nz_pothole_incidents', JSON.stringify(incidents));
    }
  } catch (e) {
    incidents = [...INITIAL_INCIDENTS];
  }

  // --- AUDIO SYNTHESIS ENGINE (Web Audio API) ---
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playAlertSound(isEmergency = false) {
    if (!soundEnabled) return;
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = isEmergency ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isEmergency ? 880 : 540, now);
    osc.frequency.exponentialRampToValueAtTime(isEmergency ? 440 : 280, now + 0.25);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  function playClickSound() {
    if (!soundEnabled) return;
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Sound toggle button
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundOnIcon = soundToggleBtn.querySelector('.sound-on');
  const soundOffIcon = soundToggleBtn.querySelector('.sound-off');

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundOnIcon.classList.remove('hide');
      soundOffIcon.classList.add('hide');
      playClickSound();
    } else {
      soundOnIcon.classList.add('hide');
      soundOffIcon.classList.remove('hide');
    }
  });

  // --- MANDATORY BLINKING COLON NZ CLOCK ---
  const clkHours = document.getElementById('clk-hours');
  const clkMins = document.getElementById('clk-mins');
  const clkSecs = document.getElementById('clk-secs');
  const clkAmpm = document.getElementById('clk-ampm');

  function updateNZClock() {
    const nzDate = new Date();
    // Format in Pacific/Auckland
    const options = { timeZone: 'Pacific/Auckland', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const timeStr = nzDate.toLocaleTimeString('en-NZ', options);
    
    // Parse formatted time string (e.g. "08:35:42 PM")
    const match = timeStr.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      clkHours.textContent = match[1];
      clkMins.textContent = match[2];
      clkSecs.textContent = match[3];
      clkAmpm.textContent = match[4].toUpperCase();
    }
  }
  updateNZClock();
  setInterval(updateNZClock, 1000);

  // --- LEAFLET MAP INITIALIZATION ---
  const map = L.map('pothole-map', {
    center: [REGIONS.canterbury.lat, REGIONS.canterbury.lng],
    zoom: REGIONS.canterbury.zoom,
    zoomControl: false
  });

  // Re-position zoom controls to top-right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // OpenStreetMap Public Tiles (No API key required)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  // Marker Cluster / Layer
  const markersLayer = L.layerGroup().addTo(map);
  const markerLookup = new Map();

  // Create Custom Pulsing Marker
  function createCustomMarker(incident) {
    const sevClass = incident.status === 'Repaired' ? 'fixed' : incident.severity.toLowerCase();
    const html = `
      <div class="pothole-custom-marker ${sevClass}">
        <div class="marker-ring"></div>
        <div class="marker-core"></div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: html,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    const marker = L.marker([incident.lat, incident.lng], { icon: icon });

    // Popup content
    const timeAgoStr = getTimeAgo(incident.reportedAt);
    const popupContent = `
      <div class="popup-inner">
        <div class="popup-header">
          <span class="popup-tag ${sevClass}">${incident.severity.toUpperCase()}</span>
          <span class="popup-time">${timeAgoStr}</span>
        </div>
        <div class="popup-address" title="${escapeHtml(incident.address)}">${escapeHtml(incident.address)}</div>
        <div class="popup-desc">${escapeHtml(incident.desc || 'Reported road surface hazard.')}</div>
        <div class="popup-meta">
          <span><strong>Council:</strong> ${escapeHtml(incident.council)}</span>
          <span><strong>Lane:</strong> ${escapeHtml(incident.lane)}</span>
          <span><strong>Status:</strong> ${escapeHtml(incident.status)}</span>
        </div>
        <div class="popup-btn-row">
          <button class="popup-btn primary" onclick="window.upvoteIncident('${incident.id}')">
            👍 Confirm Here (${incident.upvotes})
          </button>
          <button class="popup-btn" onclick="window.toggleFixed('${incident.id}')">
            ${incident.status === 'Repaired' ? 'Mark Active' : 'Mark Fixed'}
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.on('click', () => {
      playClickSound();
      highlightFeedCard(incident.id);
    });

    return marker;
  }

  // Render all markers onto the map
  function renderMapMarkers() {
    markersLayer.clearLayers();
    markerLookup.clear();

    const filtered = getFilteredIncidents();
    filtered.forEach(incident => {
      const marker = createCustomMarker(incident);
      marker.addTo(markersLayer);
      markerLookup.set(incident.id, marker);
    });
  }

  // Time-ago formatting helper
  function getTimeAgo(timestamp) {
    const elapsed = Date.now() - timestamp;
    const mins = Math.floor(elapsed / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --- STATS STRIP UPDATES ---
  function updateStats() {
    const active = incidents.filter(i => i.status !== 'Repaired').length;
    const critical = incidents.filter(i => i.severity === 'Critical' && i.status !== 'Repaired').length;
    const fixed = incidents.filter(i => i.status === 'Repaired').length;

    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-critical').textContent = critical;
    document.getElementById('stat-fixed').textContent = fixed;
    document.getElementById('feed-counter').textContent = `${incidents.length} reports`;
  }

  // --- REAL-TIME FEED SIDEBAR ---
  const feedList = document.getElementById('pothole-feed-list');

  function renderFeedList() {
    feedList.innerHTML = '';
    const filtered = getFilteredIncidents();

    if (filtered.length === 0) {
      feedList.innerHTML = `
        <div style="padding: 2rem 1rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
          No pothole incidents match the selected filters.
        </div>
      `;
      return;
    }

    filtered.forEach(incident => {
      const sevClass = incident.status === 'Repaired' ? 'fixed' : incident.severity.toLowerCase();
      const card = document.createElement('div');
      card.className = 'incident-card';
      card.id = `card-${incident.id}`;

      card.innerHTML = `
        <div class="incident-card-top">
          <div class="incident-badge-row">
            <span class="incident-severity ${sevClass}">${incident.severity.toUpperCase()}</span>
            <span class="incident-council" title="${escapeHtml(incident.council)}">${escapeHtml(incident.council)}</span>
          </div>
          <span class="incident-time">${getTimeAgo(incident.reportedAt)}</span>
        </div>

        <div class="incident-address" title="${escapeHtml(incident.address)}">${escapeHtml(incident.address)}</div>
        <div class="incident-details">${escapeHtml(incident.desc || 'Hazard reported on road surface.')}</div>

        <div class="incident-footer">
          <span class="incident-lane">${escapeHtml(incident.lane)}</span>
          <div class="incident-actions">
            <button class="upvote-btn ${incident.upvotedByUser ? 'upvoted' : ''}" onclick="window.upvoteIncident('${incident.id}')">
              👍 <span>${incident.upvotes}</span>
            </button>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.upvote-btn')) return;
        flyToIncident(incident.id);
      });

      feedList.appendChild(card);
    });
  }

  function highlightFeedCard(id) {
    document.querySelectorAll('.incident-card').forEach(c => c.classList.remove('highlight'));
    const targetCard = document.getElementById(`card-${id}`);
    if (targetCard) {
      targetCard.classList.add('highlight');
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function flyToIncident(id) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;
    playClickSound();
    highlightFeedCard(id);

    map.flyTo([inc.lat, inc.lng], 16, { duration: 1 });
    const marker = markerLookup.get(id);
    if (marker) {
      setTimeout(() => marker.openPopup(), 1050);
    }
  }

  // --- FILTERS LOGIC ---
  const filterRegion = document.getElementById('filter-region');
  const filterSeverity = document.getElementById('filter-severity');
  const filterStatus = document.getElementById('filter-status');

  function getFilteredIncidents() {
    const reg = filterRegion.value;
    const sev = filterSeverity.value;
    const stat = filterStatus.value;

    return incidents.filter(i => {
      if (reg !== 'all' && i.region !== reg) return false;
      if (sev !== 'all' && i.severity !== sev) return false;
      if (stat !== 'all') {
        if (stat === 'Active' && i.status === 'Repaired') return false;
        if (stat === 'Scheduled' && i.status !== 'Scheduled') return false;
        if (stat === 'Repaired' && i.status !== 'Repaired') return false;
      }
      return true;
    }).sort((a, b) => b.reportedAt - a.reportedAt);
  }

  [filterRegion, filterSeverity, filterStatus].forEach(select => {
    select.addEventListener('change', () => {
      playClickSound();
      renderMapMarkers();
      renderFeedList();
    });
  });

  // --- REGION TABS (Christchurch / Waimate / All Canterbury) ---
  const regionButtons = document.querySelectorAll('.region-btn');

  function setRegion(regionKey) {
    const reg = REGIONS[regionKey];
    if (!reg) return;

    activeRegionKey = regionKey;
    regionButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-region') === regionKey);
    });

    playClickSound();
    map.flyTo([reg.lat, reg.lng], reg.zoom, { duration: 1.2 });
  }

  regionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setRegion(btn.getAttribute('data-region'));
    });
  });

  document.getElementById('recenter-btn').addEventListener('click', () => {
    setRegion(activeRegionKey);
  });

  // --- REPORT DIALOG & REVERSE GEOCODING ---
  const reportDialog = document.getElementById('report-dialog');
  const openReportBtn = document.getElementById('open-report-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelReportBtn = document.getElementById('cancel-report-btn');
  const reportForm = document.getElementById('report-form');

  const txtAddress = document.getElementById('pothole-address');
  const hidLat = document.getElementById('pothole-lat');
  const hidLng = document.getElementById('pothole-lng');
  const lblLat = document.getElementById('lbl-lat');
  const lblLng = document.getElementById('lbl-lng');
  const selCouncil = document.getElementById('council-jurisdiction');
  const geoDetectBtn = document.getElementById('geo-detect-btn');
  const geoStatusHint = document.getElementById('geo-status-hint');

  function openReportModal(lat, lng, address = '') {
    playClickSound();
    
    // Default to Waimate or Christchurch based on current view center if coords not supplied
    if (!lat || !lng) {
      const center = map.getCenter();
      lat = center.lat;
      lng = center.lng;
    }

    hidLat.value = lat.toFixed(5);
    hidLng.value = lng.toFixed(5);
    lblLat.textContent = lat.toFixed(4);
    lblLng.textContent = lng.toFixed(4);

    // Auto-detect Council
    if (lat < -44.2) {
      selCouncil.value = 'Waimate District Council';
    } else {
      selCouncil.value = 'Christchurch City Council';
    }

    if (address) {
      txtAddress.value = address;
      geoStatusHint.textContent = 'Location locked from map pin point.';
    } else {
      txtAddress.value = '';
      geoStatusHint.textContent = 'Resolving NZ street address...';
      reverseGeocode(lat, lng);
    }

    reportDialog.showModal();
  }

  function closeReportModal() {
    reportDialog.close();
    playClickSound();
  }

  openReportBtn.addEventListener('click', () => openReportModal());
  closeModalBtn.addEventListener('click', closeReportModal);
  cancelReportBtn.addEventListener('click', closeReportModal);

  // Click backdrop closes modal
  reportDialog.addEventListener('click', (e) => {
    if (e.target === reportDialog) closeReportModal();
  });

  // Map Click to drop a report
  map.on('click', (e) => {
    openReportModal(e.latlng.lat, e.latlng.lng);
  });

  // GPS Geolocation button
  geoDetectBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      geoStatusHint.textContent = 'Geolocation not supported by your browser.';
      return;
    }

    geoStatusHint.textContent = 'Querying GPS satellites...';
    playClickSound();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        hidLat.value = lat.toFixed(5);
        hidLng.value = lng.toFixed(5);
        lblLat.textContent = lat.toFixed(4);
        lblLng.textContent = lng.toFixed(4);

        if (lat < -44.2) {
          selCouncil.value = 'Waimate District Council';
        } else {
          selCouncil.value = 'Christchurch City Council';
        }

        reverseGeocode(lat, lng);
      },
      (err) => {
        geoStatusHint.textContent = 'Could not acquire GPS fix (permission denied or timeout).';
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  });

  // Reverse Geocoding with OpenStreetMap Nominatim
  async function reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data && data.address) {
        const road = data.address.road || data.address.street || data.address.suburb || '';
        const town = data.address.city || data.address.town || data.address.village || data.address.county || '';
        const formatted = [road, town].filter(Boolean).join(', ');
        txtAddress.value = formatted || data.display_name.split(',').slice(0, 2).join(',');
        geoStatusHint.textContent = 'Address resolved from NZ OpenStreetMap database.';

        // Council refinement
        if (formatted.toLowerCase().includes('waimate')) {
          selCouncil.value = 'Waimate District Council';
        } else if (formatted.toLowerCase().includes('christchurch') || formatted.toLowerCase().includes('riccarton')) {
          selCouncil.value = 'Christchurch City Council';
        }
      } else {
        geoStatusHint.textContent = 'Coordinates captured. Enter road name manually.';
      }
    } catch (e) {
      geoStatusHint.textContent = 'Coordinates captured. Enter road name manually.';
    }
  }

  // Photo picker radio selection styling
  const photoChoices = document.querySelectorAll('.photo-choice');
  photoChoices.forEach(choice => {
    choice.addEventListener('click', () => {
      photoChoices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      const radio = choice.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // Handle Form Submission
  reportForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const address = txtAddress.value.trim();
    if (!address) {
      txtAddress.focus();
      return;
    }

    const lat = parseFloat(hidLat.value);
    const lng = parseFloat(hidLng.value);
    const council = selCouncil.value;
    const severity = document.getElementById('pothole-severity').value;
    const lane = document.getElementById('pothole-lane').value;
    const desc = document.getElementById('pothole-desc').value.trim();
    const photo = document.querySelector('input[name="photo-sample"]:checked')?.value || 'deep-pothole';

    // Region classification
    let region = 'State Highway';
    if (council.includes('Waimate')) region = 'Waimate';
    if (council.includes('Christchurch')) region = 'Christchurch';

    const newIncident = {
      id: `pot-${Date.now()}`,
      address: address,
      lat: lat,
      lng: lng,
      council: council,
      region: region,
      severity: severity,
      lane: lane,
      desc: desc || `Reported ${severity.toLowerCase()} road hazard.`,
      photo: photo,
      reportedAt: Date.now(),
      status: 'Active',
      upvotes: 1,
      upvotedByUser: true
    };

    incidents.unshift(newIncident);
    try {
      localStorage.setItem('nz_pothole_incidents', JSON.stringify(incidents));
    } catch (err) {}

    playAlertSound(severity === 'Critical' || severity === 'Emergency');
    closeReportModal();
    reportForm.reset();

    // Re-render
    renderMapMarkers();
    renderFeedList();
    updateStats();

    // Fly map to new incident
    flyToIncident(newIncident.id);
  });

  // --- GLOBAL ACTIONS (Upvote / Toggle Fixed) ---
  window.upvoteIncident = function(id) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;

    if (inc.upvotedByUser) {
      inc.upvotes -= 1;
      inc.upvotedByUser = false;
    } else {
      inc.upvotes += 1;
      inc.upvotedByUser = true;
      playClickSound();
    }

    try {
      localStorage.setItem('nz_pothole_incidents', JSON.stringify(incidents));
    } catch (e) {}

    renderMapMarkers();
    renderFeedList();

    // Update opened popup content if active
    const marker = markerLookup.get(id);
    if (marker && marker.isPopupOpen()) {
      marker.closePopup();
      setTimeout(() => marker.openPopup(), 150);
    }
  };

  window.toggleFixed = function(id) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;

    inc.status = inc.status === 'Repaired' ? 'Active' : 'Repaired';
    inc.severity = inc.status === 'Repaired' ? 'Fixed' : 'Moderate';
    playClickSound();

    try {
      localStorage.setItem('nz_pothole_incidents', JSON.stringify(incidents));
    } catch (e) {}

    renderMapMarkers();
    renderFeedList();
    updateStats();

    const marker = markerLookup.get(id);
    if (marker && marker.isPopupOpen()) {
      marker.closePopup();
    }
  };

  // --- KEYBOARD SHORTCUTS & INPUT GUARD ---
  document.addEventListener('keydown', (e) => {
    // Input Guard: ignore when focused on input/textarea/select
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
      return;
    }

    const key = e.key.toLowerCase();

    // 'r' to report
    if (key === 'r') {
      e.preventDefault();
      openReportModal();
    }
    // 'c' for Christchurch
    else if (key === 'c') {
      e.preventDefault();
      setRegion('christchurch');
    }
    // 'w' for Waimate
    else if (key === 'w') {
      e.preventDefault();
      setRegion('waimate');
    }
    // 's' for South Island / Canterbury
    else if (key === 's') {
      e.preventDefault();
      setRegion('canterbury');
    }
    // '0' to freeze updates
    else if (key === '0') {
      e.preventDefault();
      isFrozen = !isFrozen;
      playClickSound();
      const streamText = document.querySelector('.stream-text');
      if (isFrozen) {
        streamText.textContent = 'FEED PAUSED [0]';
        streamText.style.color = 'var(--amber-primary)';
      } else {
        streamText.textContent = 'REAL-TIME SYNC';
        streamText.style.color = 'var(--success-primary)';
      }
    }
    // Escape to close dialog
    else if (e.key === 'Escape' && reportDialog.open) {
      closeReportModal();
    }
  });

  // Initial Boot
  renderMapMarkers();
  renderFeedList();
  updateStats();
});
