// src/utils/mobileUtils.js - Comprehensive mobile handling utilities

export const deviceDetection = {
  // Get comprehensive device information
  getDeviceInfo: () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    return {
      // Mobile detection
      isMobile: /mobile|android|iphone|ipad|ipod|webos|blackberry|iemobile|opera mini/i.test(userAgent) || window.innerWidth < 768,
      
      // iOS detection
      isIOS: /iphone|ipad|ipod/.test(userAgent),
      isIPhone: /iphone/.test(userAgent),
      isIPad: /ipad/.test(userAgent),
      
      // Android detection
      isAndroid: /android/.test(userAgent),
      
      // Browser detection
      isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
      isChrome: /chrome/.test(userAgent),
      isFirefox: /firefox/.test(userAgent),
      isSamsung: /samsungbrowser/.test(userAgent),
      isEdge: /edge/.test(userAgent),
      
      // Version detection
      iOSVersion: (() => {
        const match = userAgent.match(/os (\d+)_(\d+)/);
        return match ? parseFloat(`${match[1]}.${match[2]}`) : null;
      })(),
      
      androidVersion: (() => {
        const match = userAgent.match(/android (\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : null;
      })(),
      
      // Screen info
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      
      // Touch support
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      
      // Orientation
      isLandscape: window.innerWidth > window.innerHeight,
      isPortrait: window.innerHeight > window.innerWidth,
      
      // Network info (if available)
      connectionType: navigator.connection?.effectiveType || 'unknown',
      
      // User agent string
      userAgent: userAgent,
      platform: platform
    };
  },

  // Check if device supports inline PDF viewing
  supportsPDFViewing: () => {
    const device = deviceDetection.getDeviceInfo();
    
    // Desktop browsers generally support PDF viewing
    if (!device.isMobile) {
      return true;
    }
    
    // iOS Safari has limited PDF support
    if (device.isIOS && device.isSafari) {
      // iOS 13+ has better PDF support
      return device.iOSVersion >= 13;
    }
    
    // Android Chrome usually supports PDFs
    if (device.isAndroid && device.isChrome) {
      return true;
    }
    
    // Samsung browser on Android
    if (device.isAndroid && device.isSamsung) {
      return true;
    }
    
    // Default to false for unknown mobile browsers
    return false;
  },

  // Get recommended PDF handling strategy
  getPDFStrategy: () => {
    const device = deviceDetection.getDeviceInfo();
    
    if (!device.isMobile) {
      return 'inline'; // Desktop: open in new tab
    }
    
    if (device.isIOS) {
      if (device.isSafari) {
        return device.iOSVersion >= 14 ? 'blob' : 'download';
      }
      return 'download'; // Other iOS browsers
    }
    
    if (device.isAndroid) {
      if (device.isChrome || device.isSamsung) {
        return 'intent'; // Use Android intent system
      }
      return 'download';
    }
    
    return 'download'; // Safe fallback
  }
};

export const pdfHandlers = {
  // Handle PDF viewing based on device capabilities
  handlePDFView: async (fileId, fileName, apiBaseUrl) => {
    const device = deviceDetection.getDeviceInfo();
    const strategy = deviceDetection.getPDFStrategy();
    const fileUrl = `${apiBaseUrl}/api/files/${fileId}/view`;
    
    console.log('PDF Strategy:', strategy, 'Device:', device);
    
    switch (strategy) {
      case 'inline':
        return pdfHandlers.openInline(fileUrl);
      
      case 'blob':
        return pdfHandlers.openWithBlob(fileUrl, fileName);
      
      case 'intent':
        return pdfHandlers.openWithIntent(fileUrl, fileName);
      
      case 'download':
      default:
        return pdfHandlers.forceDownload(fileId, fileName, apiBaseUrl);
    }
  },

  // Open PDF inline (desktop)
  openInline: (fileUrl) => {
    return new Promise((resolve, reject) => {
      try {
        const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          resolve({ success: true, method: 'inline' });
        } else {
          reject(new Error('Popup blocked'));
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // Open PDF using blob URL (iOS Safari)
  openWithBlob: async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM and click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup after delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      return { success: true, method: 'blob' };
    } catch (error) {
      throw new Error(`Blob method failed: ${error.message}`);
    }
  },

  // Open PDF with Android intent system
  openWithIntent: (fileUrl, fileName) => {
    return new Promise((resolve, reject) => {
      try {
        // Try to use Android intent
        const intentUrl = `intent:${fileUrl}#Intent;scheme=https;type=application/pdf;end`;
        
        // First try the intent
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = intentUrl;
        document.body.appendChild(iframe);
        
        // Fallback to direct link after short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.open(fileUrl, '_blank', 'noopener,noreferrer');
          resolve({ success: true, method: 'intent' });
        }, 500);
        
      } catch (error) {
        reject(error);
      }
    });
  },

  // Force download
  forceDownload: async (fileId, fileName, apiBaseUrl) => {
    try {
      const downloadUrl = `${apiBaseUrl}/api/files/${fileId}/download`;
      
      // For mobile, direct navigation works best
      const device = deviceDetection.getDeviceInfo();
      if (device.isMobile) {
        window.location.href = downloadUrl;
      } else {
        // Desktop - create invisible download link
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      return { success: true, method: 'download' };
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }
};

export const notificationUtils = {
  // Show user-friendly notifications based on device
  showPDFInstructions: (device) => {
    if (device.isIOS && device.isSafari) {
      return {
        title: "PDF Viewing on iOS",
        message: "Your PDF will open in Safari. You can also save it to Files app for offline viewing.",
        action: "Tap 'Open in Safari' or 'Download'"
      };
    }
    
    if (device.isAndroid) {
      return {
        title: "PDF Viewing on Android",
        message: "Your PDF will open in your default PDF viewer or browser.",
        action: "Tap 'Open' or 'Download'"
      };
    }
    
    return {
      title: "PDF Viewing",
      message: "Choose how you'd like to view this PDF.",
      action: "Select an option"
    };
  },

  // Show error messages
  showError: (error, device) => {
    const deviceName = device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : 'your device';
    
    return {
      title: "Unable to Open PDF",
      message: `There was an issue opening the PDF on ${deviceName}. You can download it instead.`,
      suggestion: "Try downloading the file and opening it with your device's PDF reader app.",
      error: error.message
    };
  }
};

// Export a unified mobile handler
export const mobileFileHandler = {
  // Main function to handle any file on mobile
  handleFile: async (file, apiBaseUrl) => {
    const device = deviceDetection.getDeviceInfo();
    const isPDF = file.originalName.toLowerCase().endsWith('.pdf');
    
    try {
      if (isPDF) {
        return await pdfHandlers.handlePDFView(file._id, file.originalName, apiBaseUrl);
      } else {
        // Non-PDF files
        const fileUrl = `${apiBaseUrl}/api/files/${file._id}/view`;
        return await pdfHandlers.openInline(fileUrl);
      }
    } catch (error) {
      console.error('Mobile file handler error:', error);
      // Fallback to download
      return await pdfHandlers.forceDownload(file._id, file.originalName, apiBaseUrl);
    }
  },

  // Get device-specific instructions
  getInstructions: () => {
    const device = deviceDetection.getDeviceInfo();
    return notificationUtils.showPDFInstructions(device);
  },

  // Check if device needs special handling
  needsSpecialHandling: () => {
    const device = deviceDetection.getDeviceInfo();
    return device.isMobile && (device.isIOS || device.isAndroid);
  }
};

export default mobileFileHandler;