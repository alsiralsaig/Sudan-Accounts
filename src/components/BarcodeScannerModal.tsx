import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Scan,
  ScanLine,
  X,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Upload,
  Volume2,
  VolumeX,
  Sparkles,
  Search,
  RefreshCw,
  Plus,
  Check,
  AlertOctagon,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductScanned,
}) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [sessionScannedItems, setSessionScannedItems] = useState<
    { product: Product; code: string; timestamp: string; count: number }[]
  >([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedTimeRef = useRef<number>(0);

  // Play audio beep upon successful scan
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 note pleasant beep
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // AudioContext may be blocked or unsupported
    }
  };

  // Vibrate haptic feedback on mobile devices
  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(80);
      } catch {
        // Ignore vibration errors
      }
    }
  };

  // Find product by barcode or SKU or alias
  const findProduct = (code: string): Product | undefined => {
    const cleanCode = code.trim().toLowerCase();
    return products.find(
      (p) =>
        p.code.toLowerCase() === cleanCode ||
        p.id.toLowerCase() === cleanCode ||
        p.nameAr.toLowerCase() === cleanCode ||
        p.code.toLowerCase().endsWith(cleanCode) ||
        cleanCode.endsWith(p.code.toLowerCase())
    );
  };

  // Process any detected barcode
  const handleBarcodeDetected = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    // Debounce rapid duplicate reads in continuous mode (minimum 900ms)
    const now = Date.now();
    if (now - lastProcessedTimeRef.current < 900) {
      return;
    }
    lastProcessedTimeRef.current = now;

    playBeep();
    triggerVibration();
    setLastScannedCode(code);

    const product = findProduct(code);

    if (product) {
      setScannedProduct(product);
      setNotFoundCode(null);
      onProductScanned(product);

      // Add to session scanned list
      setSessionScannedItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.product.id === product.id);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            count: updated[existingIdx].count + 1,
            timestamp: new Date().toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          };
          return updated;
        } else {
          return [
            {
              product,
              code,
              timestamp: new Date().toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              count: 1,
            },
            ...prev,
          ];
        }
      });

      // If continuous mode is OFF, close scanner after first successful scan
      if (!continuousMode) {
        setTimeout(() => {
          stopScanner().then(() => onClose());
        }, 600);
      }
    } else {
      setScannedProduct(null);
      setNotFoundCode(code);
    }
  };

  // Start Scanner
  const startScanner = async (cameraIdToUse?: string) => {
    try {
      setCameraError(null);
      setIsScanning(false);

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('barcode-reader-viewport', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
      }

      // Check available cameras
      let devCameras: { id: string; label: string }[] = [];
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          devCameras = devices;
          setCameras(devices);
        }
      } catch (camErr) {
        console.warn('Could not list cameras explicitly, falling back to environment constraint:', camErr);
      }

      // Choose camera: preferential back camera
      let targetCameraConfig: any = { facingMode: 'environment' };
      const selectedId = cameraIdToUse || selectedCameraId;

      if (selectedId) {
        targetCameraConfig = selectedId;
      } else if (devCameras.length > 0) {
        // Try to pick back/environment camera if labeled
        const backCam = devCameras.find(
          (c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('خلفية')
        );
        const chosen = backCam || devCameras[0];
        targetCameraConfig = chosen.id;
        setSelectedCameraId(chosen.id);
      }

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const width = Math.floor(minEdge * 0.85);
          const height = Math.floor(minEdge * 0.55); // Wide box for standard 1D barcodes
          return { width: Math.max(width, 220), height: Math.max(height, 140) };
        },
        aspectRatio: 1.3333,
      };

      await html5QrCodeRef.current.start(
        targetCameraConfig,
        config,
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // ignore scan frame misses
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start barcode camera:', err);
      setIsScanning(false);
      setCameraError(
        err?.message ||
          'تعذر فتح كاميرا الهاتف. يرجى التأكد من منح الإذن لاستخدام الكاميرا أو استخدام خيار المسح من صورة / الإدخال اليدوي.'
      );
    }
  };

  // Stop Scanner
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    } finally {
      setIsScanning(false);
      setTorchOn(false);
    }
  };

  // Switch camera toggle
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);

    await stopScanner();
    await startScanner(nextCamera.id);
  };

  // Toggle Torch/Flashlight if supported
  const toggleTorch = async () => {
    try {
      if (!html5QrCodeRef.current) return;
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch not supported on this camera/browser:', err);
    }
  };

  // Scan from photo / image file
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError(null);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('barcode-reader-viewport');
      }

      // If active, stop camera stream first
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      }

      const decodedResult = await html5QrCodeRef.current.scanFile(file, true);
      handleBarcodeDetected(decodedResult);
    } catch (err: any) {
      setCameraError('لم يتم العثور على باركود واضح في هذه الصورة. جرب التقاط صورة أقرب للباركود.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Lifecycle on modal open/close
  useEffect(() => {
    if (isOpen) {
      setScannedProduct(null);
      setNotFoundCode(null);
      setLastScannedCode(null);
      setCameraError(null);
      // Give DOM time to mount viewport container
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen]);

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>قارئ الباركود بالكاميرا</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  LIVE POS
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                وجه كاميرا الهاتف نحو باركود السلعة لتسجيلها وإضافتها للسلة تلقائياً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'كتم صوت التنبيه' : 'تفعيل صوت التنبيه'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={() => {
                stopScanner().then(() => onClose());
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-3.5 flex-1">
          {/* Viewfinder Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center">
            {/* HTML5 QR Code Mount Node */}
            <div
              id="barcode-reader-viewport"
              className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />

            {/* Visual Viewfinder Frame & Scanline (shown when scanning) */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Target Frame Area */}
                <div className="relative w-[78%] h-[58%] border-2 border-emerald-500/60 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center overflow-hidden">
                  {/* Four Corner Accents */}
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />

                  {/* Red/Emerald Laser Line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-pulse" />
                </div>

                <span className="text-[11px] font-medium text-emerald-300 mt-2 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  ضع خطوط الباركود داخل الإطار
                </span>
              </div>
            )}

            {/* Error or Permission Denied View */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">تعذر تشغيل الكاميرا</h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{cameraError}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => startScanner()}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة المحاولة</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl border border-slate-700 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>رفع صورة باركود</span>
                  </button>
                </div>
              </div>
            )}

            {/* Top In-Camera Controls Bar */}
            <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-1.5">
                {cameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    title="تبديل الكاميرا (أمامية/خلفية)"
                    className="bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-xl border border-slate-700/80 shadow backdrop-blur transition flex items-center gap-1 text-xs"
                  >
                    <SwitchCamera className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">تبديل</span>
                  </button>
                )}

                <button
                  onClick={toggleTorch}
                  title="تشغيل / إيقاف الفلاش"
                  className={`p-2 rounded-xl border shadow backdrop-blur transition flex items-center gap-1 text-xs ${
                    torchOn
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-white border-slate-700/80'
                  }`}
                >
                  {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4 text-slate-400" />}
                  <span className="hidden sm:inline">{torchOn ? 'الفلاش يعمل' : 'كشاف'}</span>
                </button>
              </div>

              {/* Continuous Scanning Mode Toggle */}
              <button
                onClick={() => setContinuousMode(!continuousMode)}
                className={`text-xs px-2.5 py-1.5 rounded-xl border shadow backdrop-blur transition flex items-center gap-1.5 ${
                  continuousMode
                    ? 'bg-emerald-600/90 text-white border-emerald-400 font-bold'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${continuousMode ? 'animate-spin' : ''}`} />
                <span>مسح متتالي {continuousMode ? 'مفعل' : 'مغلق'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Section: Last Scanned Result */}
          {scannedProduct && (
            <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                      #{scannedProduct.code}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">تمت الإضافة للسلة (+1)</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {scannedProduct.nameAr}
                  </h4>
                  <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-emerald-400 font-bold">
                      {scannedProduct.sellingPrice.toLocaleString('ar-SD')} ج.س
                    </span>
                    <span>• الرصيد: {scannedProduct.currentStock} {scannedProduct.baseUnit}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onProductScanned(scannedProduct);
                  playBeep();
                  triggerVibration();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>زيادة</span>
              </button>
            </div>
          )}

          {notFoundCode && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-300">
                  صنف غير مسجل: الباركود <span className="font-mono text-white">[{notFoundCode}]</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  لم يتم العثور على منتج بهذا الرمز في المخزون الحالي. يمكنك تسجيل كود الباركود في شاشة إدارة المنتجات.
                </p>
              </div>
            </div>
          )}

          {/* Quick Manual Entry or Gun Scanner fallback */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="أو أدخل رقم الباركود يدوياً / قارئ الباركود اليدوي USB..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualCode.trim()) {
                    handleBarcodeDetected(manualCode.trim());
                    setManualCode('');
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              onClick={() => {
                if (manualCode.trim()) {
                  handleBarcodeDetected(manualCode.trim());
                  setManualCode('');
                }
              }}
              disabled={!manualCode.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shrink-0"
            >
              تسجيل
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileScan}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="مسح من صورة محفوظه"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition shrink-0"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Preset Demo Barcodes for Fast Testing */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Sparkles className="w-3 h-3 text-amber-400" />
                باركودات تجريبية سريعة من المخزون:
              </span>
              <span>انقر لتجربة المسح الفوري</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleBarcodeDetected(item.code)}
                  className="bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span className="font-mono text-emerald-400 font-bold">{item.code}</span>
                  <span className="text-slate-300 max-w-[90px] truncate">{item.nameAr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Session Scanned List */}
          {sessionScannedItems.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                  الأصناف الممسوحة في هذه الجلسة ({sessionScannedItems.reduce((acc, i) => acc + i.count, 0)})
                </span>
                <button
                  onClick={() => setSessionScannedItems([])}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  مسح القائمة
                </button>
              </div>

              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {sessionScannedItems.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${idx}`}
                    className="flex items-center justify-between text-xs bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800/80"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-emerald-400 font-bold font-mono">×{item.count}</span>
                      <span className="text-white truncate">{item.product.nameAr}</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px] shrink-0">
                      {(item.product.sellingPrice * item.count).toLocaleString('ar-SD')} ج.س
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400">
            {sessionScannedItems.length > 0
              ? `إجمالي الأصناف: ${sessionScannedItems.reduce((acc, i) => acc + i.count, 0)} صنف`
              : 'جاهز لمسح الباركود بالكاميرا'}
          </div>

          <button
            onClick={() => {
              stopScanner().then(() => onClose());
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-xl transition shadow active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>إتمام والعودة للسلة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
