'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Loader2, CheckCircle, AlertTriangle, RotateCcw, Scan, Ruler, Sparkles, TrendingUp, Info } from 'lucide-react';

interface BodyScanResult {
  height: number | null;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  weight: number | null;
  bodyType: { name: string; key: string; desc: string; tips: string[]; fit: string[] };
  dataSource: string;
  aiConfidence: number;
  postureScore: number;
  confidenceScore: number;
  shoulderFromCamera: number;
  crossCheckWarning: string | null;
  timestamp: number;
}

export default function BodyScanPage() {
  const scriptsLoaded = useCDNScripts();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [screen, setScreen] = useState<'welcome' | 'scanning' | 'results'>('welcome');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [results, setResults] = useState<BodyScanResult | null>(null);
  const [error, setError] = useState('');

  const [hasProfile, setHasProfile] = useState(false);
  const [profileData, setProfileData] = useState<{ chest: number; hip: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userProfile');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.chest && p.hip) {
          setHasProfile(true);
          setProfileData({ chest: p.chest, hip: p.hip });
        }
      }
    } catch {}
  }, []);

  const startScan = useCallback(async (isDemo = false) => {
    setScreen('scanning');
    setProgress(10);
    setStatusMessage('Starting camera stream...');
    setError('');

    if (isDemo) {
      try {
        const steps = [
          { p: 25, m: 'Initializing AI Model...' },
          { p: 45, m: 'Scanning pose & joints... (1/5)' },
          { p: 55, m: 'Scanning pose & joints... (2/5)' },
          { p: 65, m: 'Analyzing camera geometry... (3/5)' },
          { p: 75, m: 'Analyzing camera geometry... (4/5)' },
          { p: 85, m: 'Analyzing camera geometry... (5/5)' },
          { p: 90, m: 'Computing dimensions...' }
        ];

        for (const step of steps) {
          await new Promise(r => setTimeout(r, 400));
          setProgress(step.p);
          setStatusMessage(step.m);
        }

        await new Promise(r => setTimeout(r, 500));

        let profile = null;
        try { profile = JSON.parse(localStorage.getItem('userProfile') || 'null'); } catch {}
        const hasProfile = profile && profile.chest && profile.hip;

        let chest = hasProfile ? parseFloat(profile.chest) : 96;
        let hip = hasProfile ? parseFloat(profile.hip) : 98;
        let waist = profile?.waist ? parseFloat(profile.waist) : 78;
        let shoulder = 44;

        const bodyType = detectBodyType({ chest, waist, hip }, profile?.gender || '');

        const merged = {
          height: profile?.height ? parseFloat(profile.height) : 175,
          shoulder, chest, waist, hip,
          weight: profile?.weight ? parseFloat(profile.weight) : 70,
          bodyType,
          dataSource: hasProfile ? 'combined' : 'camera',
          aiConfidence: 94,
          postureScore: 92,
          confidenceScore: 88,
          shoulderFromCamera: 44,
          crossCheckWarning: null,
          timestamp: Date.now(),
        };

        localStorage.setItem('bodyScanResults', JSON.stringify(merged));
        setResults(merged);
        setScreen('results');
        setProgress(100);
      } catch (err: any) {
        setError(err.message || 'Simulated scan failed');
        setScreen('welcome');
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        // Wait for actual video frames to arrive
        let attempts = 0;
        while (attempts < 50 && videoRef.current.videoWidth === 0) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        if (videoRef.current.videoWidth === 0) {
          throw new Error('Camera stream not ready after 5 seconds');
        }
      }

      setProgress(25);
      setStatusMessage('Initializing AI Model...');

      // Load PoseNet
      const poseDetection = (window as any).poseDetection;
      if (!poseDetection) {
        setError('PoseNet library not loaded. Please reload the page.');
        return;
      }

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );

      setProgress(45);
      setStatusMessage('Scanning pose & joints...');

      // Take 5 samples
      const poses: any[] = [];
      for (let i = 0; i < 5; i++) {
        if (!videoRef.current) break;
        const detected = await detector.estimatePoses(videoRef.current);
        if (detected && detected.length > 0 && detected[0].score > 0.25) {
          poses.push(detected[0]);
        }
        setProgress(50 + i * 8);
        setStatusMessage(`Analyzing camera geometry... (${i + 1}/5)`);
        await new Promise(r => setTimeout(r, 400));
      }

      setProgress(90);
      setStatusMessage('Computing dimensions...');
      await new Promise(r => setTimeout(r, 600));

      if (poses.length === 0) {
        setError('Could not detect body markers. Stand in a well-lit area showing your upper body.');
        setScreen('welcome');
        return;
      }

      const bestPose = poses.reduce((a, b) => a.score > b.score ? a : b);
      const data = extractMeasurements(bestPose);
      const merged = mergeData(data);

      // Save results
      localStorage.setItem('bodyScanResults', JSON.stringify(merged));
      setResults(merged);
      setScreen('results');
      setProgress(100);

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    } catch (err: any) {
      setError(err.message || 'Camera access failed');
      setScreen('welcome');
    }
  }, []);

  const resetScan = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setScreen('welcome');
    setProgress(0);
    setStatusMessage('');
    setError('');
    setResults(null);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      {/* Title */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">BODY SCAN</h1>
        <p className="text-gray-400 text-sm md:text-base">
          AI posture diagnosis and automatic custom sizing estimation.
        </p>
      </div>

      {/* Profile Info Notification Banner */}
      {screen === 'welcome' && (
        <div className={`mb-8 p-4 rounded-2xl flex items-start gap-3 border shadow-sm transition-all duration-300 ${
          hasProfile
            ? 'bg-emerald-50/60 border-emerald-200/50 text-emerald-900'
            : 'bg-amber-50/60 border-amber-200/50 text-amber-900'
        }`}>
          <div className="p-1 rounded-lg bg-white shadow-sm mt-0.5">
            {hasProfile ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <Info className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="flex-1">
            {hasProfile ? (
              <p className="text-xs leading-relaxed">
                <strong>Profile settings detected.</strong> AI will align camera markers with your saved dimensions
                (Chest: {profileData?.chest} cm, Hip: {profileData?.hip} cm) to calibrate the virtual mirror.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs leading-relaxed max-w-xl">
                  <strong>No size profile found.</strong> The scanner will estimate values solely from camera geometry. Fill out your profile dimensions first to improve precision by up to 25%.
                </p>
                <a href="/profile" className="btn-dark text-[10px] px-3.5 py-1.5 whitespace-nowrap bg-amber-600 hover:bg-amber-700 border-none shadow-none text-white font-bold">
                  Fill Profile →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome Screen */}
      {screen === 'welcome' && (
        <div className="text-center py-12 bg-white border border-gray-150/80 rounded-3xl p-6 md:p-10 shadow-sm max-w-2xl mx-auto">
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-[rgb(var(--accent))]/10 rounded-full">
            <Scan className="w-10 h-10 text-[rgb(var(--accent))]" />
            <div className="pulse-ring w-full h-full" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Postural Calibration</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
            Prepare to stand straight in front of your camera. Ensure your entire upper body is visible, arms slightly spread, and the lighting is clear.
          </p>
          
          {/* Posture Tip Graphic */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8 text-[11px] text-gray-500">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="block font-bold text-gray-700 mb-1">1. Good Light</span>
              Avoid strong backlighting
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="block font-bold text-gray-700 mb-1">2. Center Body</span>
              Align inside camera view
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="block font-bold text-gray-700 mb-1">3. Keep Still</span>
              Hold pose for 2 seconds
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto mb-6">
            <button 
              disabled={!scriptsLoaded}
              onClick={() => startScan(false)} 
              className="btn-dark px-6 py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg flex-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scriptsLoaded ? <Scan className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
              {scriptsLoaded ? 'Start Diagnostics' : 'Loading AI Assets...'}
            </button>
            <button onClick={() => startScan(true)} className="btn-outline px-6 py-3.5 text-xs font-bold flex items-center justify-center gap-2 flex-1 cursor-pointer">
              <Sparkles className="w-4 h-4" /> Simulate Scan
            </button>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs max-w-md mx-auto flex items-start gap-2.5 text-left">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-grow">
                <p className="font-bold">System Error</p>
                <p className="mt-0.5">{error}</p>
                <div className="mt-3 pt-3 border-t border-red-200/50 flex flex-col gap-1">
                  <p className="text-[11px] text-red-600">Camera source is blocked, in use, or timed out. You can run a simulated diagnostics scan to test the body scan results dashboard.</p>
                  <button 
                    onClick={() => startScan(true)} 
                    className="mt-1 inline-flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer w-fit border-none shadow-none"
                  >
                    Run Simulated Scan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scanning Screen */}
      {screen === 'scanning' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="relative bg-black rounded-3xl overflow-hidden aspect-[4/3] border border-gray-800 shadow-xl">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
            
            {/* Hologram Scanner Overlay */}
            <div className="scanner-line" />
            <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-2xl m-6 pointer-events-none animate-pulse" />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Diagnostic Feed</span>
            </div>

            {/* AI HUD info */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-[10px] text-white/70 font-mono pointer-events-none">
              <span>SYS_INIT: OK<br />POS_NET_MOD: RUNNING</span>
              <span className="text-right">CALIBRATING_MARKERS: 84%<br />HZ: 60FPS</span>
            </div>

            {/* Loader overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 text-center">
              <Loader2 className="w-10 h-10 mb-4 animate-spin text-[rgb(var(--accent))]" />
              <p className="text-base font-bold font-display uppercase tracking-widest">{statusMessage}</p>
              <p className="text-xs text-gray-300 mt-1.5 max-w-xs leading-relaxed">
                Stay aligned in the center. The AI is capturing physical dimensions.
              </p>
            </div>
          </div>
          
          <div className="max-w-md mx-auto bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
              <span>SCAN DETAILS</span>
              <span>{progress}% COMPLETE</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[rgb(var(--accent))] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Screen */}
      {screen === 'results' && results && (
        <ResultsView results={results} onReset={resetScan} />
      )}
    </div>
  );
}

// Dynamic script loading for CDN libraries
function useCDNScripts() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    if ((window as any).tf && (window as any).poseDetection) {
      setLoaded(true);
      return;
    }

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          const htmlScript = existing as HTMLScriptElement;
          if (htmlScript.dataset.loaded === 'true') {
            resolve();
            return;
          }
          const prevOnload = htmlScript.onload;
          htmlScript.onload = (e) => {
            if (prevOnload) (prevOnload as any)(e);
            resolve();
          };
          htmlScript.onerror = reject;
          return;
        }

        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => {
          s.dataset.loaded = 'true';
          resolve();
        };
        s.onerror = reject;
        document.body.appendChild(s);
      });
    };

    const loadAll = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
        if (!active) return;
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js');
        if (active) {
          setLoaded(true);
        }
      } catch (err) {
        console.error('Error loading CDN scripts:', err);
      }
    };

    loadAll();

    return () => {
      active = false;
    };
  }, []);

  return loaded;
}

function extractMeasurements(pose: any) {
  const kp = pose.keypoints;
  const getKp = (name: string) => kp.find((k: any) => k.name === name);

  const lShoulder = getKp('left_shoulder');
  const rShoulder = getKp('right_shoulder');
  const lHip = getKp('left_hip');
  const rHip = getKp('right_hip');
  const lEar = getKp('left_ear');
  const rEar = getKp('right_ear');

  const dist = (a: any, b: any) => {
    if (!a || !b || a.score < 0.25 || b.score < 0.25) return 0;
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  };

  const shoulderPx = dist(lShoulder, rShoulder) || 0;
  const hipPx = dist(lHip, rHip) || 0;
  const headWidthPx = dist(lEar, rEar) || shoulderPx * 0.4;
  const headCm = 15;
  const scale = headWidthPx > 0 ? headCm / headWidthPx : 0;
  const shoulderCm = scale > 0 ? Math.round(shoulderPx * scale) : 0;
  const shoulderHipRatio = hipPx > 0 ? shoulderPx / hipPx : 1;

  const avgConfidence = kp.length > 0
    ? Math.round((kp.reduce((s: number, k: any) => s + k.score, 0) / kp.length) * 100)
    : 0;

  return { shoulderCm, shoulderHipRatio, avgConfidence, poseScore: Math.round(pose.score * 100) };
}

function mergeData(cam: { shoulderCm: number; shoulderHipRatio: number; avgConfidence: number; poseScore: number }) {
  let profile = null;
  try { profile = JSON.parse(localStorage.getItem('userProfile') || 'null'); } catch {}

  const hasProfile = profile && profile.chest && profile.hip;
  let chest: number, hip: number, shoulder: number;

  if (hasProfile) {
    chest = parseFloat(profile.chest) || 0;
    hip = parseFloat(profile.hip) || 0;
    shoulder = (cam.shoulderCm > 25 && cam.shoulderCm < 70) ? cam.shoulderCm : Math.round(chest * 0.46);
  } else {
    shoulder = cam.shoulderCm || 40;
    chest = Math.round(shoulder * 2.1);
    hip = Math.round(shoulder / (cam.shoulderHipRatio || 1) * 2.0);
  }

  const waist = profile?.waist ? parseFloat(profile.waist) : Math.round(chest * 0.78);
  const bodyType = detectBodyType({ chest, waist, hip }, profile?.gender || '');

  return {
    height: profile?.height ? parseFloat(profile.height) : null,
    shoulder, chest, waist, hip,
    weight: profile?.weight ? parseFloat(profile.weight) : null,
    bodyType,
    dataSource: hasProfile ? 'combined' : 'camera',
    aiConfidence: cam.avgConfidence,
    postureScore: cam.poseScore,
    confidenceScore: hasProfile
      ? Math.min(95, Math.round(50 + cam.avgConfidence * 0.3 + cam.poseScore * 0.2))
      : Math.min(75, Math.round(cam.avgConfidence * 0.6 + cam.poseScore * 0.4)),
    shoulderFromCamera: cam.shoulderCm,
    crossCheckWarning: null,
    timestamp: Date.now(),
  };
}

function detectBodyType(m: { chest: number; waist: number; hip: number }, gender: string) {
  const { chest, waist, hip } = m;
  if (!chest || !hip) {
    return { name: 'Balanced', key: 'regular', desc: 'A balanced frame — most styles will suit you well.', tips: ['Most silhouettes work for you', 'Experiment freely with cuts and fits'], fit: ['regular'] };
  }
  const chestHipDiff = chest - hip;
  const waistDiff = Math.min(chest, hip) - waist;

  if (Math.abs(chestHipDiff) <= 5 && waistDiff >= 9) {
    return { name: 'Hourglass', key: 'hourglass', desc: 'Your chest and hips are well-balanced with a defined waist.', tips: ['Wrap dresses & fitted tops highlight your waist', 'High-waisted bottoms accentuate proportions'], fit: ['slim', 'hourglass'] };
  } else if (chestHipDiff < -5) {
    return { name: 'Pear / Triangle', key: 'pear', desc: 'Your hips are wider than your chest.', tips: ['Structured or statement tops draw attention upward', 'A-line skirts are flattering'], fit: ['regular', 'relaxed'] };
  } else if (chestHipDiff > 5 && waistDiff < 5) {
    return { name: 'Apple', key: 'apple', desc: 'Broad shoulders with a fuller midsection.', tips: ['V-necks elongate the torso', 'Straight-leg trousers balance proportions'], fit: ['relaxed', 'full'] };
  } else if (chestHipDiff > 5) {
    return { name: 'Inverted Triangle', key: 'inverted', desc: 'Broad shoulders with narrower hips.', tips: ['Wide-leg trousers add width below', 'Avoid heavy shoulder padding'], fit: ['athletic', 'regular'] };
  } else {
    return { name: 'Rectangle', key: 'rectangle', desc: 'Your chest, waist, and hips are similar in width.', tips: ['Belted outfits define the waist', 'Layering adds dimension'], fit: ['slim', 'regular'] };
  }
}

function ResultsView({ results, onReset }: { results: BodyScanResult; onReset: () => void }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Banner */}
      <div className={`p-4 rounded-2xl text-xs border shadow-sm ${
        results.dataSource === 'combined'
          ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
          : 'bg-amber-50 border-amber-100 text-amber-800'
      }`}>
        {results.dataSource === 'combined' ? (
          <p className="flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>AI Calibration complete. Posture matched with physical sizing. Shoulder width: <strong>{results.shoulderFromCamera} cm</strong></span>
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 font-medium">
            <span>Camera-only measurement estimation. Calibration accuracy is limited.</span>
            <a href="/profile" className="underline font-bold text-amber-900 whitespace-nowrap">Link Profile Sizing →</a>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Card: Main Body Type */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-gray-150/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] tracking-widest text-gray-400 font-bold uppercase block mb-1">Body Architecture</span>
                <h3 className="text-3xl font-black font-display text-gray-800 tracking-tight">{results.bodyType.name}</h3>
              </div>
              <span className="p-3 bg-[rgb(var(--accent))]/10 rounded-2xl text-[rgb(var(--accent))]">
                <Sparkles className="w-6 h-6 fill-[rgb(var(--accent))]/20" />
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-4 leading-relaxed max-w-xl">{results.bodyType.desc}</p>
            
            <div className="border-t border-gray-100 mt-6 pt-6">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AI Styling Guidelines</h4>
              <ul className="space-y-2.5 text-xs text-gray-500">
                {results.bodyType.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4.5 h-4.5 text-[rgb(var(--accent))] flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap mt-6 pt-6 border-t border-gray-100">
            {results.bodyType.fit.map(f => (
              <span key={f} className="px-3.5 py-1.5 rounded-full bg-gray-50 text-[10px] font-bold text-gray-600 uppercase tracking-widest border border-gray-100">
                {f} FIT
              </span>
            ))}
          </div>
        </div>

        {/* Right Card: Scan Quality (Radial Gauges) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150/80 shadow-sm space-y-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Scan Statistics</h4>
          <div className="space-y-4">
            <CircularGauge label="Confidence Index" value={results.confidenceScore} />
            <CircularGauge label="Symmetry Index" value={results.postureScore} />
            <CircularGauge label="Marker Integrity" value={results.aiConfidence} />
          </div>
        </div>
      </div>

      {/* Measurement Metrics Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5" /> Physical Geometry Matrix
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: 'Shoulders', value: results.shoulder ? `${results.shoulder} cm` : '—', desc: 'Biacromial' },
            { label: 'Chest', value: results.chest ? `${results.chest} cm` : '—', desc: 'Bustline' },
            { label: 'Waist', value: results.waist ? `${results.waist} cm` : '—', desc: 'Narrowest' },
            { label: 'Hip', value: results.hip ? `${results.hip} cm` : '—', desc: 'Greatest' },
            { label: 'Height', value: results.height ? `${results.height} cm` : '—', desc: 'Stature' },
            { label: 'Weight', value: results.weight ? `${results.weight} kg` : '—', desc: 'Mass' },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-2xl p-4 text-center border border-gray-150/80 shadow-sm transition-all duration-300 hover:border-[rgb(var(--accent))]/40">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">{m.label}</span>
              <span className="block text-xl font-black mt-1.5 text-gray-800 font-display">{m.value}</span>
              <span className="block text-[8px] uppercase tracking-widest text-gray-400 mt-1">{m.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action panel */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center md:justify-start">
        <button onClick={onReset} className="btn-outline px-8 py-3.5 text-xs font-bold flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4" /> Recalibrate Scanner
        </button>
        <a href="/myfitlook" className="btn-dark px-8 py-3.5 text-xs font-bold flex items-center gap-1.5 shadow-lg bg-[rgb(var(--fg))] text-white">
          <TrendingUp className="w-4 h-4" /> View Wardrobe Dashboard
        </a>
      </div>
    </div>
  );
}

function CircularGauge({ label, value }: { label: string; value: number }) {
  const percent = Math.min(100, Math.max(0, value));
  const strokeColor = percent >= 85 
    ? 'text-emerald-500' 
    : percent >= 60 
      ? 'text-amber-500' 
      : 'text-red-500';

  const textClass = percent >= 85 
    ? 'text-emerald-800' 
    : percent >= 60 
      ? 'text-amber-800' 
      : 'text-red-800';

  return (
    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="space-y-0.5">
        <span className="block text-xs font-bold text-gray-700">{label}</span>
        <span className={`block text-[10px] font-medium uppercase tracking-wider ${percent >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
          {percent >= 85 ? 'High Quality' : percent >= 60 ? 'Standard Quality' : 'Calibrating'}
        </span>
      </div>
      
      {/* Circle bar */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="24" cy="24" r="20" stroke="rgba(0,0,0,0.04)" strokeWidth="3.5" fill="transparent" />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={125.6}
            strokeDashoffset={125.6 - (125.6 * percent) / 100}
            className={`${strokeColor} transition-all duration-1000`}
          />
        </svg>
        <span className={`absolute text-[10px] font-black font-display ${textClass}`}>{percent}%</span>
      </div>
    </div>
  );
}
