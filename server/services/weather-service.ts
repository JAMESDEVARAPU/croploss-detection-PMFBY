interface WeatherData {
  temperature: number;
  humidity: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  windSpeed: number;
  precipitation: number;
  recommendation: string;
}

interface WeatherForecast {
  current: WeatherData;
  forecast: WeatherData[];
  alerts: string[];
}

export class WeatherService {
  
  /**
   * Get weather forecast for agricultural planning
   */
  async getWeatherForecast(latitude: number, longitude: number, language: string = 'en'): Promise<WeatherForecast> {
    try {
      // In production, integrate with weather APIs like OpenWeatherMap, AccuWeather
      // For demo purposes, generate realistic weather data
      
      const currentWeather = this.generateRealisticWeather();
      const forecast = Array.from({ length: 7 }, () => this.generateRealisticWeather());
      const alerts = this.generateWeatherAlerts(currentWeather, language);
      
      return {
        current: currentWeather,
        forecast,
        alerts
      };
    } catch (error) {
      throw new Error(`Weather service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get agricultural recommendations based on weather
   */
  getAgriculturalRecommendations(weather: WeatherData, cropType: string, language: string = 'en'): string {
    const recommendations = {
      'en': {
        hot_dry: `High temperature (${weather.temperature}°C) and low humidity. Consider irrigation for ${cropType}. Avoid pesticide application during peak heat.`,
        rainy: `Rainy conditions detected. Monitor ${cropType} for fungal diseases. Ensure proper drainage in fields.`,
        ideal: `Good weather conditions for ${cropType}. Temperature ${weather.temperature}°C is optimal for growth.`,
        windy: `High wind speeds (${weather.windSpeed} km/h). Secure tall crops and postpone pesticide spraying.`
      },
      'hi': {
        hot_dry: `उच्च तापमान (${weather.temperature}°C) और कम आर्द्रता। ${cropType} के लिए सिंचाई पर विचार करें। गर्मी के दौरान कीटनाशक का उपयोग न करें।`,
        rainy: `बारिश की स्थिति। ${cropType} में फंगल रोगों की निगरानी करें। खेतों में उचित जल निकासी सुनिश्चित करें।`,
        ideal: `${cropType} के लिए अच्छी मौसम स्थितियां। ${weather.temperature}°C तापमान विकास के लिए आदर्श है।`,
        windy: `तेज़ हवाएं (${weather.windSpeed} किमी/घंटा)। लंबी फसलों को सुरक्षित करें और कीटनाशक छिड़काव स्थगित करें।`
      },
      'te': {
        hot_dry: `అధిక ఉష్ణోగ్రత (${weather.temperature}°C) మరియు తక్కువ తేమ. ${cropType} కోసం నీటిపారుదల పరిగణించండి. వేడిమి సమయంలో కీటనాశకాలు వేయవద్దు.`,
        rainy: `వర్షపు పరిస్థితులు. ${cropType}లో ఫంగల్ వ్యాధుల కోసం పర్యవేక్షించండి. పొలాల్లో సరైన నీటి నిష్కాసన నిర్ధారించండి.`,
        ideal: `${cropType} కోసం మంచి వాతావరణ పరిస్థితులు. ${weather.temperature}°C ఉష్ణోగ్రత పెరుగుదలకు అనుకూలం.`,
        windy: `అధిక గాలి వేగం (${weather.windSpeed} కిమీ/గంట). ఎత్తైన పంటలను భద్రపరచండి మరియు కీటనాశక చల్లడం వాయిదా వేయండి.`
      }
    };

    const langRecs = recommendations[language as keyof typeof recommendations] || recommendations['en'];
    
    if (weather.temperature > 35 && weather.humidity < 40) {
      return langRecs.hot_dry;
    } else if (weather.precipitation > 5) {
      return langRecs.rainy;
    } else if (weather.windSpeed > 25) {
      return langRecs.windy;
    } else {
      return langRecs.ideal;
    }
  }

  /**
   * Generate realistic weather data for demonstration
   */
  private generateRealisticWeather(): WeatherData {
    const conditions: Array<'sunny' | 'cloudy' | 'rainy' | 'stormy'> = ['sunny', 'cloudy', 'rainy', 'stormy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    // Generate temperature based on condition
    let baseTemp = 28;
    switch (condition) {
      case 'sunny':
        baseTemp = 32 + Math.random() * 8; // 32-40°C
        break;
      case 'cloudy':
        baseTemp = 26 + Math.random() * 6; // 26-32°C  
        break;
      case 'rainy':
        baseTemp = 22 + Math.random() * 6; // 22-28°C
        break;
      case 'stormy':
        baseTemp = 20 + Math.random() * 8; // 20-28°C
        break;
    }
    
    const humidity = condition === 'rainy' || condition === 'stormy' ? 70 + Math.random() * 20 : 40 + Math.random() * 40;
    const windSpeed = condition === 'stormy' ? 20 + Math.random() * 30 : 5 + Math.random() * 15;
    const precipitation = condition === 'rainy' ? 2 + Math.random() * 20 : condition === 'stormy' ? 10 + Math.random() * 40 : 0;
    
    return {
      temperature: Math.round(baseTemp),
      humidity: Math.round(humidity),
      condition,
      windSpeed: Math.round(windSpeed),
      precipitation: Math.round(precipitation),
      recommendation: 'Weather-based farming advice'
    };
  }

  /**
   * Generate weather alerts for farmers
   */
  private generateWeatherAlerts(weather: WeatherData, language: string): string[] {
    const alerts = [];
    
    const alertMessages = {
      'en': {
        heat_wave: 'Heat wave alert! Temperature exceeding 38°C. Ensure adequate water supply for crops.',
        heavy_rain: 'Heavy rain expected. Check drainage systems and cover sensitive crops.',
        high_wind: 'Strong winds forecasted. Secure tall crops and farming equipment.',
        drought: 'Extended dry period. Plan water conservation measures.'
      },
      'hi': {
        heat_wave: 'गर्मी की लहर की चेतावनी! 38°C से अधिक तापमान। फसलों के लिए पर्याप्त पानी की आपूर्ति सुनिश्चित करें।',
        heavy_rain: 'भारी बारिश की संभावना। जल निकासी प्रणाली की जांच करें और संवेदनशील फसलों को ढकें।',
        high_wind: 'तेज़ हवाओं का पूर्वानुमान। लंबी फसलों और कृषि उपकरणों को सुरक्षित करें।',
        drought: 'लंबी सूखे की अवधि। जल संरक्षण उपायों की योजना बनाएं।'
      },
      'te': {
        heat_wave: 'వేడిమి తరంగ హెచ్చరిక! 38°C కంటే ఎక్కుva ఉష్ణోగ్రత. పంటలకు తగినంత నీటి సరఫరా నిర్ధారించండి.',
        heavy_rain: 'భారీ వర్షాలు అంచనా. డ్రైనేజీ వ్యవస్థలను తనిఖీ చేసి, సున్నితమైన పంటలను కప్పండి.',
        high_wind: 'బలమైన గాలులు అంచనా. ఎత్తైన పంటలు మరియు వ్యవసాయ పరికరాలను భద్రపరచండి.',
        drought: 'పొడిగించిన పొడి కాలం. నీటి పరిరక్షణ చర్యలను ప్రణాళిక చేయండి.'
      }
    };

    const langAlerts = alertMessages[language as keyof typeof alertMessages] || alertMessages['en'];
    
    if (weather.temperature > 38) {
      alerts.push(langAlerts.heat_wave);
    }
    if (weather.precipitation > 15) {
      alerts.push(langAlerts.heavy_rain);
    }
    if (weather.windSpeed > 25) {
      alerts.push(langAlerts.high_wind);
    }
    if (weather.precipitation === 0 && weather.temperature > 35) {
      alerts.push(langAlerts.drought);
    }
    
    return alerts;
  }
}

export const weatherService = new WeatherService();