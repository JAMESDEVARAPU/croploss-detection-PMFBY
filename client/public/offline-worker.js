// Offline Service Worker for Real-Time Processing
const CACHE_NAME = 'krishi-offline-v1';
const OFFLINE_ASSETS = [
  '/',
  '/offline-demo',
  '/manifest.json',
  '/Telangana_Districts_0_7_NDVI_Weather_2monthGap.csv',
  '/Telangana_Districts_8_15_NDVI_Weather_2monthGap.csv',
  '/Telangana_Districts_16_23_NDVI_Weather_2monthGap.csv',
  '/Telangana_Districts_24_32_NDVI_Weather_2monthGap.csv'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Handle API requests for offline processing
  if (event.request.url.includes('/api/offline/')) {
    event.respondWith(handleOfflineAPI(event.request));
    return;
  }

  // Handle regular requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline-demo');
        }
      })
  );
});

// Handle offline API requests
async function handleOfflineAPI(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.includes('/analyze')) {
    return handleOfflineAnalysis(request);
  }

  if (path.includes('/voice-process')) {
    return handleOfflineVoiceProcessing(request);
  }

  return new Response(JSON.stringify({ error: 'Offline API not available' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Offline analysis processing
async function handleOfflineAnalysis(request) {
  try {
    const data = await request.json();
    
    // Simulate crop loss analysis
    const lossPercentage = Math.random() * 60 + 10; // 10-70%
    const pmfbyEligible = lossPercentage >= 33;
    
    const result = {
      success: true,
      lossPercentage: Math.round(lossPercentage * 10) / 10,
      pmfbyEligible,
      confidence: 85 + Math.random() * 10,
      features: [
        {
          name: 'Crop Loss Percentage',
          importance: 0.4,
          value: lossPercentage,
          impact: pmfbyEligible ? 'positive' : 'negative'
        },
        {
          name: 'NDVI Health',
          importance: 0.3,
          value: 0.45 + Math.random() * 0.3,
          impact: 'negative'
        },
        {
          name: 'Weather Conditions',
          importance: 0.2,
          value: Math.random() * 2,
          impact: 'negative'
        }
      ],
      explanation: pmfbyEligible 
        ? `Your crop shows ${lossPercentage.toFixed(1)}% loss and qualifies for PMFBY compensation.`
        : `Your crop shows ${lossPercentage.toFixed(1)}% loss, which is below the 33% threshold.`,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Analysis failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Offline voice processing
async function handleOfflineVoiceProcessing(request) {
  try {
    const data = await request.json();
    const { transcript, language } = data;
    
    // Simple command processing
    let commandType = 'unknown';
    let response = '';
    
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('analyze') || lowerTranscript.includes('check') || 
        lowerTranscript.includes('विश्लेषण') || lowerTranscript.includes('విశ్లేషణ')) {
      commandType = 'analyze';
      response = language === 'hi' ? 'फसल का विश्लेषण शुरू कर रहे हैं...' :
                 language === 'te' ? 'పంట విశ్లేషణ ప్రారంభిస్తున్నాము...' :
                 'Starting crop analysis...';
    } else if (lowerTranscript.includes('help') || lowerTranscript.includes('सहायता') || 
               lowerTranscript.includes('సహాయం')) {
      commandType = 'help';
      response = language === 'hi' ? 'मैं आपकी फसल विश्लेषण में मदद कर सकता हूं।' :
                 language === 'te' ? 'నేను మీ పంట విశ్లేషణలో సహాయం చేయగలను.' :
                 'I can help you with crop analysis.';
    }

    return new Response(JSON.stringify({
      success: true,
      commandType,
      response,
      confidence: 0.9,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Voice processing failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Sync any pending data when connection is restored
  console.log('Syncing offline data...');
}