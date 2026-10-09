/**
 * =========================================================================
 * EXPERIMENTAL READER — AUDIO ENGINE (LIVE ENVIRONMENTAL SENSING)
 * =========================================================================
 * Captures live microphone audio using browser WebAudio API, applies
 * frequency bandpass focus, calculates spectrum & waveform telemetry,
 * and handles explicit opt-in recording.
 */

window.DAC_AUDIO = (function () {
  let audioCtx = null;
  let micStream = null;
  let micSourceNode = null;
  let filterNode = null;
  let gainNode = null;
  let monitorGainNode = null;
  let analyserNode = null;
  let syntheticOsc = null;
  let syntheticGain = null;

  // Recording variables
  let mediaRecorder = null;
  let recordedChunks = [];
  let isRecordingAudio = false;
  let recordingStartTime = 0;
  let recordingTimerInterval = null;

  // Telemetry state
  let isListening = false;
  let isMicPermitted = false;
  let isSyntheticFallback = false;
  let currentFreq = 440;
  let currentBand = 120;
  let monitorVolume = 0.7;
  let isFilteredMode = true; // true = through bandpass filter; false = raw pass-through

  // Buffers for visualization
  let timeDataArray = null;
  let freqDataArray = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  /**
   * Request microphone permission independently
   */
  async function requestMicrophone() {
    initAudioContext();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser environment');
      }

      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      isMicPermitted = true;
      isSyntheticFallback = false;
      setupAudioGraph(micStream);
      return { success: true, mode: 'microphone' };
    } catch (err) {
      console.warn('[AudioEngine] Microphone unavailable or denied:', err.message);
      isMicPermitted = false;
      isSyntheticFallback = true;
      setupSyntheticFallback();
      return { success: false, mode: 'synthetic_fallback', error: err.message };
    }
  }

  function setupAudioGraph(stream) {
    if (!audioCtx) initAudioContext();

    // 1. Source Node
    micSourceNode = audioCtx.createMediaStreamSource(stream);

    // 2. Bandpass Filter
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'bandpass';
    filterNode.frequency.setValueAtTime(currentFreq, audioCtx.currentTime);
    filterNode.Q.setValueAtTime(currentFreq / Math.max(currentBand, 10), audioCtx.currentTime);

    // 3. Gain Node (monitor volume, default subtle to avoid feedback loop)
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);

    // 4. Analyser Node
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 1024;
    analyserNode.smoothingTimeConstant = 0.85;

    timeDataArray = new Uint8Array(analyserNode.fftSize);
    freqDataArray = new Uint8Array(analyserNode.frequencyBinCount);

    // Routing
    if (isFilteredMode) {
      micSourceNode.connect(filterNode);
      filterNode.connect(gainNode);
    } else {
      micSourceNode.connect(gainNode);
    }

    gainNode.connect(analyserNode);

    // To prevent feedback squeal through device speakers while still allowing analysis:
    // Analyser is active, but we attenuate speaker output unless headphones are detected
    monitorGainNode = audioCtx.createGain();
    monitorGainNode.gain.setValueAtTime(monitorVolume, audioCtx.currentTime);
    gainNode.connect(monitorGainNode);
    monitorGainNode.connect(audioCtx.destination);
  }

  function setupSyntheticFallback() {
    if (!audioCtx) initAudioContext();

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 1024;
    analyserNode.smoothingTimeConstant = 0.85;
    timeDataArray = new Uint8Array(analyserNode.fftSize);
    freqDataArray = new Uint8Array(analyserNode.frequencyBinCount);

    syntheticOsc = audioCtx.createOscillator();
    syntheticOsc.type = 'sine';
    syntheticOsc.frequency.setValueAtTime(currentFreq, audioCtx.currentTime);

    syntheticGain = audioCtx.createGain();
    syntheticGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

    syntheticOsc.connect(syntheticGain);
    syntheticGain.connect(analyserNode);
    syntheticGain.connect(audioCtx.destination);
    syntheticOsc.start();
  }

  /**
   * Start Listening session
   */
  async function startListening() {
    initAudioContext();
    if (!micStream && !syntheticOsc && isSyntheticFallback) {
      setupSyntheticFallback();
    } else if (!micStream && !syntheticOsc) {
      await requestMicrophone();
    }
    isListening = true;
    return {
      listening: true,
      mode: isMicPermitted ? 'live_environmental' : 'synthetic_ambient',
      freq: currentFreq,
      band: currentBand
    };
  }

  /**
   * Stop Listening session
   */
  function stopListening() {
    isListening = false;
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      micStream = null;
    }
    if (syntheticOsc) {
      try { syntheticOsc.stop(); } catch (e) {}
      syntheticOsc = null;
    }
    if (isRecordingAudio) {
      stopRecordingAudio();
    }
    return { listening: false };
  }

  /**
   * Set Focus Frequency & Bandwidth
   */
  function setTuning(freq, band) {
    currentFreq = Math.max(80, Math.min(1200, Number(freq)));
    if (band !== undefined) {
      currentBand = Math.max(20, Math.min(400, Number(band)));
    }

    if (filterNode && audioCtx) {
      filterNode.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.05);
      const qVal = Math.max(0.5, currentFreq / Math.max(currentBand, 10));
      filterNode.Q.setTargetAtTime(qVal, audioCtx.currentTime, 0.05);
    }

    if (syntheticOsc && audioCtx) {
      syntheticOsc.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.05);
    }
  }

  function setMonitorVolume(value) {
    monitorVolume = Math.max(0, Math.min(1, Number(value) || 0));
    if (audioCtx && monitorGainNode) {
      monitorGainNode.gain.setTargetAtTime(monitorVolume, audioCtx.currentTime, 0.04);
    }
    return monitorVolume;
  }

  /**
   * Toggle between Filtered Focus and Raw Ambient Sound
   */
  function toggleFilterMode(useFilter) {
    isFilteredMode = Boolean(useFilter);
    if (micSourceNode && filterNode && gainNode) {
      try {
        micSourceNode.disconnect();
        filterNode.disconnect();
        if (isFilteredMode) {
          micSourceNode.connect(filterNode);
          filterNode.connect(gainNode);
        } else {
          micSourceNode.connect(gainNode);
        }
      } catch (e) {
        console.warn('[AudioEngine] Re-route warning:', e);
      }
    }
    return isFilteredMode;
  }

  /**
   * Explicit Opt-in Audio Recording
   */
  function startRecordingAudio(onTick) {
    if (!micStream) {
      alert('Microphone must be active to capture authentic field audio.');
      return false;
    }

    recordedChunks = [];
    isRecordingAudio = true;
    recordingStartTime = Date.now();

    try {
      mediaRecorder = new MediaRecorder(micStream, { mimeType: 'audio/webm' });
    } catch (e) {
      try {
        mediaRecorder = new MediaRecorder(micStream);
      } catch (err) {
        console.error('MediaRecorder initialization failed:', err);
        return false;
      }
    }

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start(250); // Slice chunks every 250ms

    if (onTick) {
      recordingTimerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - recordingStartTime) / 1000);
        onTick(elapsedSec);
      }, 1000);
    }

    return true;
  }

  function stopRecordingAudio() {
    return new Promise((resolve) => {
      if (!mediaRecorder || !isRecordingAudio) {
        resolve(null);
        return;
      }

      clearInterval(recordingTimerInterval);
      isRecordingAudio = false;

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            blob: blob,
            dataUrl: reader.result,
            durationSec: Math.floor((Date.now() - recordingStartTime) / 1000)
          });
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.stop();
    });
  }

  /**
   * Fetch current Waveform and Spectrum telemetry
   */
  function getAcousticTelemetry() {
    if (!analyserNode) {
      return {
        rms: 0,
        peakFreq: currentFreq,
        timeData: new Uint8Array(256).fill(128),
        freqData: new Uint8Array(256).fill(0)
      };
    }

    analyserNode.getByteTimeDomainData(timeDataArray);
    analyserNode.getByteFrequencyData(freqDataArray);

    // Calculate Root Mean Square energy (RMS volume)
    let sum = 0;
    for (let i = 0; i < timeDataArray.length; i++) {
      const v = (timeDataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / timeDataArray.length);

    // Find dominant frequency bin
    let maxVal = -1;
    let maxIdx = 0;
    for (let i = 0; i < freqDataArray.length; i++) {
      if (freqDataArray[i] > maxVal) {
        maxVal = freqDataArray[i];
        maxIdx = i;
      }
    }
    const nyquist = audioCtx ? audioCtx.sampleRate / 2 : 22050;
    const peakFreq = (maxIdx / freqDataArray.length) * nyquist;

    return {
      rms,
      peakFreq: Math.round(peakFreq),
      timeData: timeDataArray,
      freqData: freqDataArray
    };
  }

  return {
    requestMicrophone,
    startListening,
    stopListening,
    setTuning,
    setMonitorVolume,
    toggleFilterMode,
    startRecordingAudio,
    stopRecordingAudio,
    getAcousticTelemetry,
    getState: () => ({
      isListening,
      isMicPermitted,
      isSyntheticFallback,
      currentFreq,
      currentBand,
      isFilteredMode,
      isRecordingAudio
    })
  };
})();
