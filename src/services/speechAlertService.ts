/**
 * Web Speech API Voice Notification Engine
 * Provides Arabic text-to-speech announcements for critical warehouse & inventory alerts,
 * such as out-of-stock items, critical reorder thresholds, and quick-restock events.
 */

export interface SpeechSettings {
  enabled: boolean;
  rate: number; // 0.8 to 1.2
  pitch: number; // 0.8 to 1.2
  volume: number; // 0.0 to 1.0
  announceOutOfStock: boolean;
  announceReorderWarning: boolean;
  announceSalesRestock: boolean;
}

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  enabled: true,
  rate: 0.95,
  pitch: 1.0,
  volume: 1.0,
  announceOutOfStock: true,
  announceReorderWarning: true,
  announceSalesRestock: true,
};

class SpeechAlertService {
  private static instance: SpeechAlertService;
  private settings: SpeechSettings = DEFAULT_SPEECH_SETTINGS;
  private isSupported: boolean = false;
  private lastAnnouncedMap: Map<string, number> = new Map(); // key -> timestamp to debounce duplicate alerts
  private preferredVoice: SpeechSynthesisVoice | null = null;

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupported = true;
      this.loadSettings();
      this.initVoices();
    }
  }

  public static getInstance(): SpeechAlertService {
    if (!SpeechAlertService.instance) {
      SpeechAlertService.instance = new SpeechAlertService();
    }
    return SpeechAlertService.instance;
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('hisabati_speech_settings');
      if (saved) {
        this.settings = { ...DEFAULT_SPEECH_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = DEFAULT_SPEECH_SETTINGS;
    }
  }

  public saveSettings(newSettings: Partial<SpeechSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('hisabati_speech_settings', JSON.stringify(this.settings));
    } catch {
      // storage unavailable
    }
  }

  public getSettings(): SpeechSettings {
    return { ...this.settings };
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }

  private initVoices() {
    if (!this.isSupported) return;

    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Look for Arabic voices (ar, ar-SA, ar-EG, ar-SD, etc.)
      const arabicVoice = voices.find(
        (v) => v.lang.startsWith('ar') || v.lang.includes('Arabic') || v.name.includes('Arabic')
      );
      this.preferredVoice = arabicVoice || null;
    };

    findVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findVoice;
    }
  }

  /**
   * Speak a text message in Arabic using Web Speech API
   */
  public speak(text: string, force: boolean = false, priority: 'critical' | 'normal' = 'normal'): boolean {
    if (!this.isSupported || (!this.settings.enabled && !force)) {
      return false;
    }

    try {
      // If priority is critical, cancel previous ongoing speech to announce immediately
      if (priority === 'critical' || force) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;

      if (!this.preferredVoice) {
        this.initVoices();
      }
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
      return false;
    }
  }

  /**
   * Announce low stock or out of stock with automatic debounce (won't repeat same item within 30 seconds unless force)
   */
  public announceStockAlert(
    productName: string,
    currentStock: number,
    baseUnit: string,
    minStockAlert: number,
    force: boolean = false
  ): boolean {
    if (!this.settings.enabled && !force) return false;

    const isOutOfStock = currentStock <= 0;
    const isCritical = currentStock <= minStockAlert * 0.4;

    // Setting gates
    if (isOutOfStock && !this.settings.announceOutOfStock && !force) return false;
    if (!isOutOfStock && !this.settings.announceReorderWarning && !force) return false;

    // Debounce key
    const debounceKey = `${productName}_${isOutOfStock ? 'out' : 'low'}`;
    const now = Date.now();
    const lastTime = this.lastAnnouncedMap.get(debounceKey) || 0;
    // Suppress duplicates within 25 seconds unless forced
    if (!force && now - lastTime < 25000) {
      return false;
    }
    this.lastAnnouncedMap.set(debounceKey, now);

    let message = '';
    if (isOutOfStock) {
      message = `تنبيه عاجل: لقد نفد مخزون ${productName} بالكامل من الرفوف والمخزن! يرجى إعادة الطلب فوراً.`;
    } else if (isCritical) {
      message = `تحذير حرج: مخزون صنف ${productName} انخفض بشدة إلى ${currentStock} ${baseUnit} فقط! أقل بكثير من حد الطلب.`;
    } else {
      message = `تنبيه: صنف ${productName} وصل إلى حد إعادة الطلب، الرصيد المتبقي ${currentStock} ${baseUnit}.`;
    }

    return this.speak(message, force, isOutOfStock ? 'critical' : 'normal');
  }

  /**
   * Stop any ongoing speech
   */
  public cancel() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechAlertService = SpeechAlertService.getInstance();
