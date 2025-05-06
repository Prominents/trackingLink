import UAParser from 'ua-parser-js';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import axios from 'axios';
import DeviceDetector from 'device-detector-js';

export interface TrackingData {
  timestamp: string;
  ip_address: string;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  device: string;
  browser: string;
  vpn_status: string;
  location_permission: string;
  estimated_location: string;
  fingerprint: string;
  screen_resolution: string;
  timezone: string;
  language: string;
  connection_type: string;
}

function getDetailedDeviceInfo(): { model: string; vendor: string; osVersion: string } {
  const userAgent = navigator.userAgent;
  let model = "Unknown";
  let vendor = "Unknown";
  let osVersion = "Unknown";

  // Initialize UAParser with user agent
  const uaParser = new UAParser(userAgent);
  const uaResult = uaParser.getResult();

  // Get OS version
  if (uaResult.os.version) {
    osVersion = uaResult.os.version;
  }

  // Try to get device info from UAParser first
  const uaDevice = uaParser.getDevice();
  vendor = uaDevice.vendor || "Unknown";
  model = uaDevice.model || "Unknown";

  // If UAParser didn't provide manufacturer info, try DeviceDetector
  if (!vendor || vendor === "Unknown") {
    const detector = new DeviceDetector();
    const deviceResult = detector.parse(userAgent);
    
    if (deviceResult.device) {
      vendor = deviceResult.device.brand || vendor;
      if (model === "Unknown" && deviceResult.device.model) {
        model = deviceResult.device.model;
      }
    }
  }

  // If still unknown, try pattern matching as last resort
  if (vendor === "Unknown" || model === "Unknown") {
    const patterns = [
      // Samsung patterns
      { pattern: /SM-[A-Z0-9]+/, vendor: "Samsung" },
      { pattern: /SM-[A-Z][0-9]+/, vendor: "Samsung" },
      { pattern: /SM-[A-Z][0-9][A-Z]/, vendor: "Samsung" },
      { pattern: /SM-[A-Z][0-9][A-Z][0-9]/, vendor: "Samsung" },
      { pattern: /Samsung\s([^;)]+)/i, vendor: "Samsung" },
      // Xiaomi patterns
      { pattern: /MI\s[A-Z0-9]+/, vendor: "Xiaomi" },
      { pattern: /Redmi\s[A-Z0-9]+/, vendor: "Xiaomi" },
      { pattern: /POCO\s[A-Z0-9]+/, vendor: "Xiaomi" },
      { pattern: /M[0-9]{4}[A-Z0-9]+/, vendor: "Xiaomi" },
      { pattern: /Xiaomi\s([^;)]+)/i, vendor: "Xiaomi" },
      // OnePlus patterns
      { pattern: /ONEPLUS\s[A-Z0-9]+/, vendor: "OnePlus" },
      { pattern: /KB[0-9]{4}/, vendor: "OnePlus" },
      { pattern: /OnePlus\s([^;)]+)/i, vendor: "OnePlus" },
      // Google Pixel patterns
      { pattern: /Pixel\s[A-Z0-9]+/, vendor: "Google" },
      { pattern: /Pixel\s[0-9]/, vendor: "Google" },
      // OPPO patterns
      { pattern: /CPH[0-9]{4}/, vendor: "OPPO" },
      { pattern: /PEXM[0-9]{2}/, vendor: "OPPO" },
      { pattern: /OPPO\s([^;)]+)/i, vendor: "OPPO" },
      // Vivo patterns
      { pattern: /V[0-9]{4}/, vendor: "Vivo" },
      { pattern: /Y[0-9]{2}/, vendor: "Vivo" },
      { pattern: /Vivo\s([^;)]+)/i, vendor: "Vivo" },
      // Realme patterns
      { pattern: /RMX[0-9]{4}/, vendor: "Realme" },
      { pattern: /Realme\s([^;)]+)/i, vendor: "Realme" },
      // Motorola patterns
      { pattern: /moto\s[A-Z0-9]+/i, vendor: "Motorola" },
      { pattern: /XT[0-9]{4}/, vendor: "Motorola" },
      { pattern: /Motorola\s([^;)]+)/i, vendor: "Motorola" },
      // General Android pattern
      { pattern: /;\s([^;)]+)\sBuild/, vendor: null }
    ];

    for (const { pattern, vendor: patternVendor } of patterns) {
      const match = userAgent.match(pattern);
      if (match) {
        if (model === "Unknown") {
          model = match[0].trim();
        }
        if (vendor === "Unknown" && patternVendor) {
          vendor = patternVendor;
        }
        if (model !== "Unknown" && vendor !== "Unknown") {
          break;
        }
      }
    }
  }

  // Try to get additional info from device memory
  if ((navigator as any).deviceMemory) {
    model += ` (${(navigator as any).deviceMemory}GB RAM)`;
  }

  // Try to get screen info
  if (window.screen) {
    const width = window.screen.width;
    const height = window.screen.height;
    const pixelRatio = window.devicePixelRatio;
    model += ` (${width}x${height} @${pixelRatio}x)`;
  }

  return { model, vendor, osVersion };
}

export async function getTrackingData(): Promise<TrackingData> {
  const data: TrackingData = {
    timestamp: new Date().toISOString(),
    ip_address: "Unknown",
    coordinates: { latitude: null, longitude: null },
    device: "Unknown",
    browser: "Unknown",
    vpn_status: "Unknown",
    location_permission: "Unknown",
    estimated_location: "Unknown",
    fingerprint: "Unknown",
    screen_resolution: "Unknown",
    timezone: "Unknown",
    language: "Unknown",
    connection_type: "Unknown"
  };

  // Get IP and VPN status
  try {
    const ipResponse = await axios.get('https://ipapi.co/json/');
    const ipData = ipResponse.data;
    data.ip_address = ipData.ip || "Unknown";
    data.vpn_status = ipData.proxy || ipData.vpn ? "Yes" : "No";
    data.estimated_location = ipData.city && ipData.country_name 
      ? `${ipData.city}, ${ipData.country_name}` 
      : "Unknown";
  } catch (error) {
    console.error("Failed to get IP data:", error);
  }

  // Get device and browser info
  try {
    const parser = new UAParser();
    const result = parser.getResult();
    
    data.browser = result.browser.name && result.browser.version 
      ? `${result.browser.name} ${result.browser.version}` 
      : "Unknown Browser";
    
    // Get detailed device info
    const deviceInfo = getDetailedDeviceInfo();
    
    // Construct device string with more detailed information
    if (result.device.type === "mobile") {
      data.device = `${deviceInfo.vendor} ${deviceInfo.model} (Android ${deviceInfo.osVersion})`;
    } else if (result.device.type === "tablet") {
      data.device = `${deviceInfo.vendor} ${deviceInfo.model} (Android ${deviceInfo.osVersion})`;
    } else {
      data.device = `${result.os.name} ${result.os.version || ""}`;
    }

    // Get screen resolution
    data.screen_resolution = `${window.screen.width}x${window.screen.height}`;
    
    // Get timezone
    data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get language
    data.language = navigator.language;
    
    // Get connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      data.connection_type = connection.effectiveType || "Unknown";
    }

  } catch (error) {
    console.error("Failed to get device info:", error);
  }

  // Get fingerprint
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    data.fingerprint = result.visitorId;
  } catch (error) {
    console.error("Failed to get fingerprint:", error);
  }

  return data;
}

export async function getGeolocation(): Promise<{latitude: number, longitude: number} | null> {
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  } catch (error) {
    console.error("Failed to get geolocation:", error);
    return null;
  }
} 