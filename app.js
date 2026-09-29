/* ==========================================================================
   CT-NEON // CLIENT-SIDE LOGIC & INTERACTION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let soundEnabled = false;
  let audioCtx = null;
  let tempInterval = null;

  // --- SELECTORS ---
  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundOnIcon = soundToggleBtn.querySelector('.icon-sound-on');
  const soundOffIcon = soundToggleBtn.querySelector('.icon-sound-off');

  const previewBlade = document.getElementById('preview-blade');
  const synthesisBtn = document.getElementById('synthesis-btn');
  const selectCore = document.getElementById('select-core');

  // Diagnostic Stats
  const diagTemp = document.getElementById('diag-temp');
  const diagWave = document.getElementById('diag-wave');
  const diagHarmony = document.getElementById('diag-harmony');
  const diagPower = document.getElementById('blade-diag-power');

  // Terminal Selectors
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');

  // Form Selectors
  const syndicateForm = document.getElementById('syndicate-form');
  const successDialog = document.getElementById('success-dialog');
  const closeDialogBtn = document.getElementById('close-dialog-btn');

  // Mobile Menu Selector
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playClickSound() {
    if (!soundEnabled) return;
    initAudio();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }

  function playIgnitionSound() {
    if (!soundEnabled) return;
    initAudio();
    
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc1.frequency.linearRampToValueAtTime(320, audioCtx.currentTime + 0.35);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(40, audioCtx.currentTime);
    osc2.frequency.linearRampToValueAtTime(160, audioCtx.currentTime + 0.35);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.35);
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    
    osc1.start();
    osc2.start();
    
    osc1.stop(audioCtx.currentTime + 0.6);
    osc2.stop(audioCtx.currentTime + 0.6);
  }

  function playChordSound(isSuccess = true) {
    if (!soundEnabled) return;
    initAudio();
    
    const now = audioCtx.currentTime;
    const freqs = isSuccess ? [261.63, 329.63, 392.00, 523.25] : [180.00, 175.00, 160.00]; // C Major vs Discordant Buzz
    const duration = isSuccess ? 0.4 : 0.35;
    
    freqs.forEach(freq => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(isSuccess ? 0.05 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.start();
      osc.stop(now + duration);
    });
  }

  // --- SOUND TOGGLE ---
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundOnIcon.classList.remove('hide');
      soundOffIcon.classList.add('hide');
      initAudio();
      // Brief chime to show sound is active
      playChordSound(true);
    } else {
      soundOnIcon.classList.add('hide');
      soundOffIcon.classList.remove('hide');
    }
  });

  // --- CUSTOMIZER CONTROLS ---

  // Handle color switches
  document.querySelectorAll('input[name="blade-color"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const color = e.target.value;
      previewBlade.setAttribute('data-color', color);
      playClickSound();
      updateDiagnostics();
    });
  });

  // Handle core resonance selection
  selectCore.addEventListener('change', (e) => {
    const core = e.target.value;
    previewBlade.setAttribute('data-core', core);
    playClickSound();
    updateDiagnostics();
  });

  // Handle hilt material segmented controls
  document.querySelectorAll('input[name="hilt-material"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const hilt = e.target.value;
      previewBlade.setAttribute('data-hilt', hilt);
      playClickSound();
    });
  });

  // Synthesize button click triggers animation
  synthesisBtn.addEventListener('click', () => {
    playIgnitionSound();
    
    // Add micro-flash animation to core
    const plasma = previewBlade.querySelector('.blade-plasma-container');
    plasma.style.animation = 'none';
    // Trigger reflow
    void plasma.offsetWidth;
    
    // Re-apply correct animations based on setting
    const core = previewBlade.getAttribute('data-core');
    if (core === 'pulsing') {
      plasma.style.animation = 'blade-ignite 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, pulse-core 2.5s ease-in-out infinite alternate';
    } else if (core === 'overloaded') {
      plasma.style.animation = 'blade-ignite 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, flicker-core 0.15s infinite';
    } else {
      plasma.style.animation = 'blade-ignite 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
    }

    logToTerminal(`SYSTEM: Initiating plasma core synthesis... Sequence complete. Configuration compiled.`);
  });

  // Update stats dynamically based on customizer choices
  function updateDiagnostics() {
    const color = previewBlade.getAttribute('data-color');
    const core = previewBlade.getAttribute('data-core');
    
    // Update Wavelength
    let wave = '485 nm';
    if (color === 'pink') wave = '620 nm';
    if (color === 'green') wave = '525 nm';
    if (color === 'gold') wave = '590 nm';
    diagWave.textContent = wave;

    // Update Harmony
    let harmony = 'SYNCED';
    if (core === 'pulsing') harmony = 'PULSING';
    if (core === 'overloaded') harmony = 'UNSTABLE';
    diagHarmony.textContent = harmony;
    
    if (core === 'overloaded') {
      diagHarmony.style.color = 'var(--neon-pink)';
    } else {
      diagHarmony.style.color = 'var(--neon-cyan)';
    }
  }

  // Fluctuating values (makes system feel live)
  function startFluctuations() {
    if (tempInterval) clearInterval(tempInterval);
    
    tempInterval = setInterval(() => {
      const color = previewBlade.getAttribute('data-color');
      const core = previewBlade.getAttribute('data-core');
      
      // Temperature variance
      let baseTemp = 1240;
      if (color === 'pink') baseTemp = 1850;
      if (color === 'green') baseTemp = 980;
      if (color === 'gold') baseTemp = 1410;
      
      const fluctuation = Math.floor(Math.random() * 20) - 10;
      diagTemp.textContent = `${(baseTemp + fluctuation).toLocaleString()} °C`;

      // Power output variance
      let basePower = 98.4;
      let powerFluct = 0;
      if (core === 'stable') {
        basePower = 95.2;
        powerFluct = (Math.random() * 0.2) - 0.1;
      } else if (core === 'pulsing') {
        basePower = 98.4;
        powerFluct = (Math.random() * 1.4) - 0.7;
      } else if (core === 'overloaded') {
        basePower = 112.7;
        powerFluct = (Math.random() * 8.6) - 4.3;
      }
      
      diagPower.textContent = `OUTPUT: ${(basePower + powerFluct).toFixed(1)}%`;
    }, 800);
  }

  startFluctuations();

  // --- SPECS INTERACTIVE TERMINAL ---

  const commands = {
    help: 'Available commands:\n  help         Display available system commands\n  clear        Clear screen logs\n  about        Overview of PROJECT BLADE\n  specs        View weapon technical specifications\n  diagnostic   Initiate weapon core scan\n  overload     Push plasma core beyond safety limits\n  system       Check network sync data',
    about: 'CT-NEON // PROJECT BLADE\n-------------------------\nNext-gen tactical plasma blades designed for covert syndicate operatives.\nFeatures sub-2ms synaptic response speeds and quantum light fields.\nDesigned in Sector 7, Neo City.',
    specs: 'TECHNICAL BLUEPRINT PARAMETERS:\n- Containment Type: Dual-harmonics magnetic buffer\n- Plasma Core Energy Source: Quantum micro-singularity\n- Response Latency: 0.12ms direct neural link\n- Grip Coating: Carbon-nanotube weave, micro-haptic nodes\n- Thermal dispersion rate: 99.8% internal recovery',
    system: 'SYSTEM NODE REPORT:\n- Network Sync: Sector 7 Mainframe (ONLINE)\n- Core Wavelength Grid: Stable at 485 THz\n- Operational Temperature: 1,245 C (Safe margin)\n- Battery cell level: 98.4% (Quantum-decay cells)',
    clear: ''
  };

  function logToTerminal(text, type = 'response-msg') {
    const line = document.createElement('div');
    line.className = `output-line ${type}`;
    line.textContent = text;
    terminalOutput.appendChild(line);
    // Auto scroll
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const inputVal = terminalInput.value.trim();
      terminalInput.value = '';
      
      if (!inputVal) return;
      
      playClickSound();

      // Log the entered command
      logToTerminal(`> ${inputVal}`, 'user-cmd');

      const lowerCmd = inputVal.toLowerCase();

      if (lowerCmd === 'clear') {
        terminalOutput.innerHTML = '';
        return;
      }

      if (lowerCmd === 'overload') {
        logToTerminal('WARNING: Initiating core overload safety bypass...', 'error-msg');
        setTimeout(() => {
          // Force preview into overloaded mode
          selectCore.value = 'overloaded';
          previewBlade.setAttribute('data-core', 'overloaded');
          updateDiagnostics();
          playIgnitionSound();
          logToTerminal('OVERLOAD CRITICAL: Plasma core containment field fluctuating. Diagnostic readings unstable.', 'error-msg');
        }, 1000);
        return;
      }

      if (lowerCmd === 'diagnostic') {
        logToTerminal('SYSTEM: Running diagnostic sequences...');
        let progress = 0;
        const diagInt = setInterval(() => {
          progress += 25;
          if (progress <= 100) {
            logToTerminal(`Checking components... ${progress}%`, 'system-msg');
          }
          if (progress === 100) {
            clearInterval(diagInt);
            logToTerminal('SYSTEM STATUS: All modules fully functional. Plasma density synced.', 'response-msg');
          }
        }, 300);
        return;
      }

      if (commands[lowerCmd] !== undefined) {
        logToTerminal(commands[lowerCmd]);
      } else {
        logToTerminal(`Command not recognized: "${inputVal}". Type "help" for database options.`, 'error-msg');
        playChordSound(false);
      }
    }
  });

  // --- SYNDICATE FORM & DIALOG VALIDATION ---

  function validateField(field) {
    const input = field.querySelector('input, select');
    let isValid = true;
    
    if (input.required) {
      if (input.type === 'checkbox') {
        isValid = input.checked;
      } else {
        isValid = input.value.trim() !== '';
      }
    }
    
    if (isValid && input.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(input.value);
    }
    
    if (isValid && input.minLength) {
      isValid = input.value.length >= input.minLength;
    }

    if (isValid) {
      field.classList.remove('invalid');
    } else {
      field.classList.add('invalid');
    }
    
    return isValid;
  }

  // Input event triggers live clear of validation error state
  syndicateForm.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => {
      const field = input.closest('.form-field');
      if (field.classList.contains('invalid')) {
        validateField(field);
      }
    });
    
    input.addEventListener('change', () => {
      const field = input.closest('.form-field');
      if (field.classList.contains('invalid')) {
        validateField(field);
      }
    });
  });

  syndicateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isFormValid = true;
    syndicateForm.querySelectorAll('.form-field').forEach(field => {
      const isFieldValid = validateField(field);
      if (!isFieldValid) {
        isFormValid = false;
      }
    });

    if (isFormValid) {
      playChordSound(true);
      
      // Get handle to personalize dialogue popup
      const handle = document.getElementById('form-handle').value;
      document.getElementById('success-message').innerHTML = `Operative <strong>${handle}</strong> has been synced. Credentials transmitted securely to Syndicate Command. Diagnostic ping incoming.`;
      
      // Show native dialog modal
      successDialog.showModal();
      
      // Reset form
      syndicateForm.reset();
      syndicateForm.querySelectorAll('.form-field').forEach(field => {
        field.classList.remove('invalid');
      });
      
      logToTerminal(`SYNDICATE: Received incoming connection from Operative Handle: ${handle}`);
    } else {
      playChordSound(false);
    }
  });

  closeDialogBtn.addEventListener('click', () => {
    successDialog.close();
    playClickSound();
  });

  // Click backdrop of dialog closes it too
  successDialog.addEventListener('click', (e) => {
    if (e.target === successDialog) {
      successDialog.close();
      playClickSound();
    }
  });

  // --- MOBILE NAVIGATION BAR ---
  mobileMenuBtn.addEventListener('click', () => {
    const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
    navLinks.classList.toggle('active');
    playClickSound();
  });

  // Close mobile nav when clicking links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
  });
});
