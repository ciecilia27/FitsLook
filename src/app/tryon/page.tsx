'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Loader2, XCircle, Sliders, RefreshCw, Layers, Sparkles, ChevronRight, Grid } from 'lucide-react';
import { getClientProducts, Product } from '@/lib/products';

export default function TryOnPage() {
  const scriptsLoaded = useCDNScripts();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  
  // Fit adjustment refs for real-time changes without restarting loop
  const alphaRef = useRef(0.95);
  const widthScaleRef = useRef(1.10);
  const heightScaleRef = useRef(1.30);
  const offsetTopRef = useRef(0.30);

  // Model & Outfit image refs
  const netRef = useRef<any>(null);
  const currentOutfitImgRef = useRef<HTMLImageElement | null>(null);

  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  // Interactive UI states
  const [activeTab, setActiveTab] = useState<'adjust' | 'switcher'>('adjust');
  const [sliderAlpha, setSliderAlpha] = useState(95);
  const [sliderWidth, setSliderWidth] = useState(110);
  const [sliderHeight, setSliderHeight] = useState(130);
  const [sliderOffset, setSliderOffset] = useState(30);

  // Load selected outfit from localStorage initially
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    setCatalog(getClientProducts());
  }, []);

  useEffect(() => {
    try {
      const img = localStorage.getItem('selectedOutfit');
      const name = localStorage.getItem('selectedProductName');
      const brand = localStorage.getItem('selectedBrandName');
      if (img) {
        setOutfitImage(img);
        setProductName(name || 'Fit Outfit');
        setBrandName(brand || 'Fit Look');
      }
    } catch {}
  }, []);

  // Update refs when slider states change
  useEffect(() => { alphaRef.current = sliderAlpha / 100; }, [sliderAlpha]);
  useEffect(() => { widthScaleRef.current = sliderWidth / 100; }, [sliderWidth]);
  useEffect(() => { heightScaleRef.current = sliderHeight / 100; }, [sliderHeight]);
  useEffect(() => { offsetTopRef.current = sliderOffset / 100; }, [sliderOffset]);

  // Preload new outfit images whenever user swaps outfits
  useEffect(() => {
    if (!outfitImage) {
      currentOutfitImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = outfitImage;
    img.onload = () => {
      currentOutfitImgRef.current = img;
    };
    img.onerror = () => {
      console.error('Failed to load tryon outfit image:', outfitImage);
    };
  }, [outfitImage]);

  const startCamera = useCallback(async (isDemoMode = false) => {
    try {
      setStatus('loading');
      setMessage('Accessing camera feed...');
      setError('');
      setIsDemo(isDemoMode);

      if (isDemoMode) {
        setMessage('Initializing Demo Mirror...');
        await new Promise(r => setTimeout(r, 800));
        setStatus('running');
        setMessage('Demo tracking active. Adjust fit using sliders.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        let attempts = 0;
        while (attempts < 50 && videoRef.current.videoWidth === 0) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        if (videoRef.current.videoWidth === 0) {
          throw new Error('Camera capture stream timed out');
        }
      }
      
      setMessage('Booting AI Body Tracker...');
      
      // Load body-pix if not already in memory
      const bodyPix = (window as any).bodyPix || (window as any)['body-pix'];
      if (!bodyPix) {
        throw new Error('BodyPix scripts not loaded. Refresh the page.');
      }

      if (!netRef.current) {
        netRef.current = await bodyPix.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          multiplier: 0.75,
          quantBytes: 2,
        });
      }

      setStatus('running');
      setMessage('AI tracking active. Stand inside the guide lines.');
    } catch (err: any) {
      setError(err.message || 'Could not start mirror capture feed.');
      setStatus('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsDemo(false);
    setStatus('idle');
  }, []);

  // Main canvas render detection loop
  useEffect(() => {
    if (status !== 'running' || !canvasRef.current) return;

    let isLooping = true;

    async function runDetection() {
      if (!isLooping || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;

      if (isDemo) {
        if (canvas.width !== 640) {
          canvas.width = 640;
          canvas.height = 480;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw a placeholder mannequin/silhouette in the center
        // Background
        ctx.fillStyle = '#f5f5f4'; // Warm clay-cream tint matching globals
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw head
        ctx.fillStyle = '#d7d3c9';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height * 0.25, 30, 0, Math.PI * 2);
        ctx.fill();

        // Draw body/torso
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 40, canvas.height * 0.32);
        ctx.lineTo(canvas.width / 2 + 40, canvas.height * 0.32);
        ctx.lineTo(canvas.width / 2 + 35, canvas.height * 0.75);
        ctx.lineTo(canvas.width / 2 - 35, canvas.height * 0.75);
        ctx.closePath();
        ctx.fill();

        // Draw arms
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#d7d3c9';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 40, canvas.height * 0.35);
        ctx.lineTo(canvas.width / 2 - 80, canvas.height * 0.55);
        ctx.moveTo(canvas.width / 2 + 40, canvas.height * 0.35);
        ctx.lineTo(canvas.width / 2 + 80, canvas.height * 0.55);
        ctx.stroke();

        // Draw text info
        ctx.fillStyle = '#a8a29e';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DEMO SIMULATION ACTIVE — DRAG SLIDERS TO FIT', canvas.width / 2, canvas.height - 20);

        // Draw outfit
        const outfit = currentOutfitImgRef.current;
        if (outfit) {
          const ratio = outfit.height / outfit.width;
          const widthBoost = widthScaleRef.current;
          const heightBoost = heightScaleRef.current;
          const offsetTop = offsetTopRef.current;
          const alpha = alphaRef.current;

          let w = 180 * widthBoost;
          let h = w * ratio * heightBoost;

          const x = canvas.width / 2 - w / 2;
          const y = canvas.height * 0.32 - h * offsetTop;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.drawImage(outfit, x, y, w, h);
          ctx.restore();
        }

        if (isLooping) {
          animFrameRef.current = requestAnimationFrame(runDetection);
        }
        return;
      }

      if (!videoRef.current || !netRef.current) return;
      const video = videoRef.current;

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        const segmentation = await netRef.current.segmentPerson(video, {
          flipHorizontal: false,
          internalResolution: 'medium',
          segmentationThreshold: 0.65,
        });

        if (!isLooping) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video mirrored
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        ctx.restore();

        const outfit = currentOutfitImgRef.current;
        
        if (segmentation.allPoses && segmentation.allPoses.length > 0 && outfit) {
          const pose = segmentation.allPoses[0];
          const k = pose.keypoints;

          const ls = k.find((p: any) => p.part === 'leftShoulder');
          const rs = k.find((p: any) => p.part === 'rightShoulder');
          const lh = k.find((p: any) => p.part === 'leftHip');
          const rh = k.find((p: any) => p.part === 'rightHip');

          if (ls && rs && ls.score > 0.25 && rs.score > 0.25) {
            // Compute centers (adjusted for mirrored feed)
            const midX = canvas.width - ((ls.position.x + rs.position.x) / 2);
            const shoulderY = (ls.position.y + rs.position.y) / 2;
            const hipY = (lh?.score && rh?.score)
              ? (lh.position.y + rh.position.y) / 2
              : shoulderY + 280;

            const bodyWidth = Math.abs(rs.position.x - ls.position.x);
            const torsoHeight = Math.abs(hipY - shoulderY);

            // Fetch fit factors from refs
            const widthBoost = widthScaleRef.current;
            const heightBoost = heightScaleRef.current;
            const offsetTop = offsetTopRef.current;
            const alpha = alphaRef.current;

            const ratio = outfit.height / outfit.width;
            let w = bodyWidth * 2.28 * widthBoost;
            let h = w * ratio;
            
            // Constrain height overlays
            const maxH = torsoHeight * 1.5;
            const minH = torsoHeight * 0.9;
            h = Math.min(Math.max(h, minH), maxH) * heightBoost;
            
            const fixScale = h / (outfit.height * ratio);
            w *= fixScale;

            const x = midX - w / 2;
            const y = shoulderY - h * offsetTop;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.drawImage(outfit, x, y, w, h);
            ctx.restore();
          }
        }
      } catch (err) {
        console.error('Frame segmentation error:', err);
      }

      if (isLooping) {
        animFrameRef.current = requestAnimationFrame(runDetection);
      }
    }

    runDetection();

    return () => {
      isLooping = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [status]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Quick switch function inside drawer
  const handleSwapOutfit = (prod: Product) => {
    setOutfitImage(prod.image);
    setProductName(prod.name);
    setBrandName(prod.brand);
    localStorage.setItem('selectedOutfit', prod.image);
    localStorage.setItem('selectedProductName', prod.name);
    localStorage.setItem('selectedBrandName', prod.brand);
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      {/* Title */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">VIRTUAL MIRROR</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Live body tracking. Fit overlay for product: <strong className="text-gray-700">{productName}</strong>
          </p>
        </div>
        {status === 'running' && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full shadow-sm animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>AI TRACKING ACTIVE</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Mirror view */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-black rounded-3xl overflow-hidden aspect-[4/3] border border-gray-150 shadow-lg relative">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Futuristic Guide overlays */}
            {status === 'running' && (
              <>
                <div className="absolute inset-0 border-[2px] border-dashed border-white/10 rounded-2xl m-6 pointer-events-none" />
                
                {/* SVG Silhouette Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <svg className="w-full h-full max-w-[280px] max-h-[360px]" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Head Guide */}
                    <circle cx="50" cy="22" r="12" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
                    
                    {/* Neck */}
                    <path d="M47 34V38H53V34" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
                    
                    {/* Shoulders & Torso */}
                    <path d="M25 46 C25 40, 35 38, 50 38 C65 38, 75 40, 75 46 L70 95 C70 95, 50 98, 50 98 C50 98, 30 95, 30 95 Z" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
                    
                    {/* Arms */}
                    <path d="M22 47 L12 75" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
                    <path d="M78 47 L88 75" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
                    
                    {/* Grid axes */}
                    <line x1="50" y1="5" x2="50" y2="115" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="2 4" />
                    <line x1="5" y1="38" x2="95" y2="38" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="2 4" />
                  </svg>
                </div>

                <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-full text-[10px] font-bold text-white border border-white/10 tracking-widest uppercase flex items-center gap-2 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent))] animate-ping" />
                    <span>Align body with the silhouette guide</span>
                  </div>
                </div>
              </>
            )}

            {/* Status Screens */}
            {status === 'idle' && !outfitImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white p-6 text-center">
                <Camera className="w-12 h-12 mb-4 text-gray-600 stroke-[1.5]" />
                <h3 className="font-display font-bold text-lg mb-1">Mirror Uncalibrated</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-6">
                  Select a styling product from the catalog before launching the diagnostic mirror.
                </p>
                <a href="/catalog" className="btn-primary px-6 py-2.5 text-xs font-bold">
                  Browse Catalog
                </a>
              </div>
            )}

            {status === 'idle' && outfitImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white p-6 text-center">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center bg-white/5 border border-white/10 rounded-full">
                  <Camera className="w-6 h-6 text-gray-300" />
                  <div className="pulse-ring w-full h-full" />
                </div>
                <h3 className="font-display font-bold text-lg mb-1">Mirror Calibration Ready</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-6">
                  AI will segment your dimensions and project {productName} onto your body.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center max-w-sm">
                  <button 
                    disabled={!scriptsLoaded}
                    onClick={() => startCamera(false)} 
                    className="btn-primary px-6 py-2.5 text-xs font-bold flex-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {!scriptsLoaded && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {scriptsLoaded ? 'Launch Live Mirror' : 'Loading AI Assets...'}
                  </button>
                  <button onClick={() => startCamera(true)} className="btn-outline px-6 py-2.5 text-xs font-bold border-white/25 text-white hover:bg-white/10 flex-1 cursor-pointer">
                    Simulate Mirror
                  </button>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 text-white p-6 text-center">
                <Loader2 className="w-10 h-10 mb-4 animate-spin text-[rgb(var(--accent))]" />
                <p className="text-xs uppercase tracking-widest font-bold text-gray-400">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white p-6 text-center">
                <XCircle className="w-12 h-12 mb-4 text-red-500 stroke-[1.5]" />
                <h3 className="font-display font-bold text-lg mb-1">Mirror Connection Failed</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-4">{error}</p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <button 
                    disabled={!scriptsLoaded}
                    onClick={() => startCamera(false)} 
                    className="btn-primary w-full py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {!scriptsLoaded && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {scriptsLoaded ? 'Retry Connection' : 'Loading AI Assets...'}
                  </button>
                  <button onClick={() => startCamera(true)} className="btn-outline w-full py-2.5 text-xs font-bold border-white/20 text-white hover:bg-white/10 hover:border-white/35 cursor-pointer">
                    Run Simulated Mirror
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {status === 'running' && (
            <div className="flex justify-between items-center bg-white px-5 py-4 rounded-2xl border border-gray-150/80 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Stream Control</span>
              <button onClick={stopCamera} className="btn-outline px-5 py-2 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                Close Stream
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Ajustments Sidebar / Drawer */}
        <div className="bg-white rounded-3xl border border-gray-150/80 shadow-sm overflow-hidden flex flex-col h-[480px]">
          {/* Tab headers */}
          <div className="flex border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <button
              onClick={() => setActiveTab('adjust')}
              className={`flex-1 py-4 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-colors duration-300 ${
                activeTab === 'adjust' 
                  ? 'border-[rgb(var(--fg))] text-[rgb(var(--fg))]' 
                  : 'border-transparent hover:text-gray-600'
              }`}
            >
              <Sliders className="w-4 h-4" /> Adjust Fit
            </button>
            <button
              onClick={() => setActiveTab('switcher')}
              className={`flex-1 py-4 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-colors duration-300 ${
                activeTab === 'switcher' 
                  ? 'border-[rgb(var(--fg))] text-[rgb(var(--fg))]' 
                  : 'border-transparent hover:text-gray-600'
              }`}
            >
              <Grid className="w-4 h-4" /> Wardrobe
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab 1: Adjustment controls */}
            {activeTab === 'adjust' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Projection Calibration</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mb-1.5">
                    Fine-tune size dimensions and vertical coordinates live on the camera overlay.
                  </p>
                  <p className="text-[10px] text-[rgb(var(--accent))] font-semibold leading-relaxed bg-[rgb(var(--accent))]/5 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--accent))]/10">
                    💡 <strong>Tip:</strong> If the shirt appears too narrow or short, adjust the <strong>Width Ratio</strong> and <strong>Height Ratio</strong> sliders below to scale the projection.
                  </p>
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Fabric Opacity</span>
                    <span>{sliderAlpha}%</span>
                  </div>
                  <input
                    type="range" min="10" max="100" value={sliderAlpha}
                    onChange={e => setSliderAlpha(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-150 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--accent))]"
                  />
                </div>

                {/* Width */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Width Ratio</span>
                    <span>{sliderWidth / 100}x</span>
                  </div>
                  <input
                    type="range" min="60" max="170" value={sliderWidth}
                    onChange={e => setSliderWidth(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-150 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--accent))]"
                  />
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Height Ratio</span>
                    <span>{sliderHeight / 100}x</span>
                  </div>
                  <input
                    type="range" min="60" max="170" value={sliderHeight}
                    onChange={e => setSliderHeight(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-150 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--accent))]"
                  />
                </div>

                {/* Vertical offset */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Shoulder Offset</span>
                    <span>{sliderOffset / 100}m</span>
                  </div>
                  <input
                    type="range" min="5" max="60" value={sliderOffset}
                    onChange={e => setSliderOffset(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-150 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--accent))]"
                  />
                </div>

                <button
                  onClick={() => {
                    setSliderAlpha(95);
                    setSliderWidth(110);
                    setSliderHeight(130);
                    setSliderOffset(30);
                  }}
                  className="w-full btn-outline py-2.5 text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1 mt-4"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Calibrations
                </button>
              </div>
            )}

            {/* Tab 2: Switcher Drawer */}
            {activeTab === 'switcher' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Virtual Closet</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Click any product to swap it instantly onto the virtual projection mirror.
                  </p>
                </div>
                
                {/* Scrollable list of outfits */}
                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  {catalog.filter(p => p.isAvailable !== false).slice(0, 15).map(prod => (
                    <button
                      key={prod.id}
                      onClick={() => handleSwapOutfit(prod)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-300 w-full cursor-pointer hover:-translate-y-0.5 ${
                        outfitImage === prod.image
                          ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="w-10 h-12 bg-gray-50 rounded-lg p-1 flex items-center justify-center flex-shrink-0">
                        <img src={prod.image} alt={prod.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[8px] uppercase tracking-wider font-bold text-gray-400 leading-none mb-0.5">{prod.brand}</span>
                        <span className="block text-xs font-bold text-gray-800 truncate leading-tight">{prod.name}</span>
                        <span className="block text-[9px] text-gray-500 capitalize">{prod.type} • {prod.fit[0]} Fit</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic script loading for CDN libraries
function useCDNScripts() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    // If already loaded in window
    if ((window as any).tf && ((window as any).bodyPix || (window as any)['body-pix'])) {
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
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.1/dist/body-pix.min.umd.js');
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
