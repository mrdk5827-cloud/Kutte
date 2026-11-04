import React, { useEffect, useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  Mic, 
  Bell, 
  MapPin, 
  HardDrive, 
  Cpu, 
  Battery, 
  Wifi, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Power
} from 'lucide-react';
import { playCommandBlip } from '../utils/audioFX';

interface PermissionStatus {
  camera: 'granted' | 'denied' | 'prompt';
  mic: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'prompt';
  location: 'granted' | 'denied' | 'prompt';
  storage: 'granted' | 'denied' | 'prompt';
  contacts: 'granted' | 'denied' | 'prompt';
  sensors: 'granted' | 'denied' | 'prompt';
}

export const SystemAccessPanel: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: 'prompt',
    mic: 'prompt',
    notifications: 'prompt',
    location: 'prompt',
    storage: 'granted',
    contacts: 'granted',
    sensors: 'granted',
  });

  const [batteryLevel, setBatteryLevel] = useState<number>(94);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Check battery API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      }).catch(() => {});
    }

    // Check notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissions(prev => ({ ...prev, notifications: Notification.permission as any }));
    }
  }, []);

  const requestNotificationAccess = async () => {
    playCommandBlip();
    if ('Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermissions(prev => ({ ...prev, notifications: res as any }));
        if (res === 'granted') {
          new Notification('FIXA Core Online', {
            body: 'Deep system notification listener initialized, Sir.',
            icon: '/favicon.ico'
          });
        }
      } catch (e) {}
    }
  };

  const requestLocationAccess = () => {
    playCommandBlip();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setPermissions(prev => ({ ...prev, location: 'granted' })),
        () => setPermissions(prev => ({ ...prev, location: 'denied' }))
      );
    }
  };

  const toggleCameraFeed = async () => {
    playCommandBlip();
    if (cameraActive) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setCameraActive(false);
    } else {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(userStream);
        setCameraActive(true);
        setPermissions(prev => ({ ...prev, camera: 'granted' }));
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
      } catch (e) {
        setPermissions(prev => ({ ...prev, camera: 'denied' }));
      }
    }
  };

  const requestMicAccess = async () => {
    playCommandBlip();
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      userStream.getTracks().forEach(t => t.stop());
      setPermissions(prev => ({ ...prev, mic: 'granted' }));
    } catch (e) {
      setPermissions(prev => ({ ...prev, mic: 'denied' }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header telemetry summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-cyan-800/40 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-700/50">
            <Battery className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-tech uppercase">Auxiliary Power</div>
            <div className="text-lg font-cyber font-bold text-cyan-300">
              {batteryLevel}% {isCharging && <span className="text-xs text-emerald-400">⚡ CHARGING</span>}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-cyan-800/40 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-950 text-blue-400 border border-blue-700/50">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-tech uppercase">Neural Core Clock</div>
            <div className="text-lg font-cyber font-bold text-blue-300">4.2 GHz // NOMINAL</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-cyan-800/40 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-950 text-teal-400 border border-teal-700/50">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-tech uppercase">Telecom Gateway</div>
            <div className="text-lg font-cyber font-bold text-teal-300">5G ENCRYPTED</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-cyan-800/40 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-700/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-tech uppercase">System Integrity</div>
            <div className="text-lg font-cyber font-bold text-indigo-300">STAGE 5 AIR-GAPPED</div>
          </div>
        </div>
      </div>

      {/* Permissions Matrix & Hardware Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="font-cyber font-bold text-lg text-cyan-200 tracking-wide">
                SYSTEM PERMISSIONS MATRIX
              </h3>
            </div>
            <span className="text-xs font-mono-code px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              ZERO-COMPROMISE
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            FIXA requires deep root-level hardware abstractions to manage background call screening, optical machine vision, ambient audio processing, and automated application launches.
          </p>

          <div className="space-y-3">
            {/* Camera */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-cyan-900/50 hover:border-cyan-700 transition-colors">
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-tech font-semibold text-cyan-100">Optical Sensors (Camera)</div>
                  <div className="text-xs text-slate-400">Target recognition & visual environment feed</div>
                </div>
              </div>
              <button
                onClick={toggleCameraFeed}
                className={`text-xs font-tech px-3 py-1.5 rounded-lg border transition-all ${
                  cameraActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-900'
                }`}
              >
                {cameraActive ? 'DEACTIVATE FEED' : 'TEST SENSOR'}
              </button>
            </div>

            {/* Microphone */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-cyan-900/50 hover:border-cyan-700 transition-colors">
              <div className="flex items-center gap-3">
                <Mic className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-tech font-semibold text-cyan-100">Acoustic Sensors (Microphone)</div>
                  <div className="text-xs text-slate-400">Sub-10ms continuous voice intent parsing</div>
                </div>
              </div>
              <button
                onClick={requestMicAccess}
                className={`text-xs font-tech px-3 py-1.5 rounded-lg border transition-all ${
                  permissions.mic === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-900'
                }`}
              >
                {permissions.mic === 'granted' ? 'GRANTED' : 'AUTHORIZE'}
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-cyan-900/50 hover:border-cyan-700 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-tech font-semibold text-cyan-100">System Notification Hook</div>
                  <div className="text-xs text-slate-400">High-priority alerts & call screening summaries</div>
                </div>
              </div>
              <button
                onClick={requestNotificationAccess}
                className={`text-xs font-tech px-3 py-1.5 rounded-lg border transition-all ${
                  permissions.notifications === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-900'
                }`}
              >
                {permissions.notifications === 'granted' ? 'ACTIVE' : 'AUTHORIZE'}
              </button>
            </div>

            {/* Geolocation */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-cyan-900/50 hover:border-cyan-700 transition-colors">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-tech font-semibold text-cyan-100">GPS & Spatial Geofence</div>
                  <div className="text-xs text-slate-400">Caller localization triangulation & context</div>
                </div>
              </div>
              <button
                onClick={requestLocationAccess}
                className={`text-xs font-tech px-3 py-1.5 rounded-lg border transition-all ${
                  permissions.location === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-900'
                }`}
              >
                {permissions.location === 'granted' ? 'LOCATED' : 'LINK GPS'}
              </button>
            </div>

            {/* Storage & Files */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-cyan-900/50">
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-tech font-semibold text-cyan-100">Encrypted Local Vault (Storage)</div>
                  <div className="text-xs text-slate-400">Call audio recordings & study dossiers</div>
                </div>
              </div>
              <span className="text-xs font-tech px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Live Optical Sensor / Camera Feed Viewport */}
        <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="font-cyber font-bold text-lg text-cyan-200">
                  OPTICAL SENSOR FEED (HUD RETICLE)
                </h3>
              </div>
              <span className={`text-xs font-mono-code px-2 py-0.5 rounded ${cameraActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-slate-800 text-slate-400'}`}>
                {cameraActive ? 'FEED STREAMING' : 'FEED OFFLINE'}
              </span>
            </div>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/80 border border-cyan-900/60 flex items-center justify-center">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Cyber Targeting Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-32 h-32 border-2 border-cyan-400/60 rounded-full animate-spin [animation-duration:12s] border-dashed" />
                    <div className="w-20 h-20 border border-cyan-300/80 rounded-full" />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                    <div className="absolute top-4 left-4 font-mono-code text-[10px] text-cyan-400 bg-black/60 px-2 py-1 rounded">
                      FPS: 60 // TARGET LOCK: NONE // ISO: 400
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Camera className="w-8 h-8 opacity-60" />
                  </div>
                  <div className="text-sm font-tech text-slate-400">
                    Camera sensor standby. Click "Test Sensor" above to initialize optical recognition stream.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deep Native Architecture Overview */}
          <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-cyan-950 text-xs text-slate-400 space-y-1.5 font-mono-code">
            <div className="text-cyan-300 font-tech font-bold uppercase tracking-wider text-xs">
              ⚡ NATIVE MOBILE HOOKS ARCHITECTURE:
            </div>
            <div>• Android: <span className="text-slate-300">AccessibilityService</span> for cross-app automation & <span className="text-slate-300">InCallService</span> for carrier interception</div>
            <div>• iOS: <span className="text-slate-300">CallKit + SiriKit</span> extension with localized CoreML audio parser</div>
            <div>• IPC Pipeline: Direct UNIX domain sockets with zero network telemetry exposure</div>
          </div>
        </div>
      </div>
    </div>
  );
};
