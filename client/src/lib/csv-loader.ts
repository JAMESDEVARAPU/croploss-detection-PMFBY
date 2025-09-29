interface DistrictData {
  district: string;
  mandal: string;
  month: number;
  year: number;
  NDVI_mean: number;
  rainfall_mm_per_day: number;
  temperature_C: number;
  batch_id: string;
}

export class CSVLoader {
  private static instance: CSVLoader;
  private csvData: DistrictData[] = [];
  private isLoaded = false;

  static getInstance(): CSVLoader {
    if (!CSVLoader.instance) {
      CSVLoader.instance = new CSVLoader();
    }
    return CSVLoader.instance;
  }

  async loadCSVData(): Promise<DistrictData[]> {
    if (this.isLoaded) {
      return this.csvData;
    }

    try {
      // Load all 4 CSV files
      const csvFiles = [
        '/Telangana_Districts_0_7_NDVI_Weather_2monthGap.csv',
        '/Telangana_Districts_8_15_NDVI_Weather_2monthGap.csv',
        '/Telangana_Districts_16_23_NDVI_Weather_2monthGap.csv',
        '/Telangana_Districts_24_32_NDVI_Weather_2monthGap.csv'
      ];

      const allData: DistrictData[] = [];

      for (const file of csvFiles) {
        try {
          const response = await fetch(file);
          if (response.ok) {
            const csvText = await response.text();
            const parsedData = this.parseCSV(csvText);
            allData.push(...parsedData);
          }
        } catch (error) {
          console.warn(`Failed to load ${file}:`, error);
        }
      }

      // If no CSV files loaded, use fallback data
      if (allData.length === 0) {
        console.log('Using fallback CSV data');
        allData.push(...this.getFallbackData());
      }

      this.csvData = allData;
      this.isLoaded = true;
      return this.csvData;
    } catch (error) {
      console.error('Error loading CSV data:', error);
      return this.getFallbackData();
    }
  }

  private parseCSV(csvText: string): DistrictData[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data: DistrictData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= headers.length) {
        data.push({
          district: values[0]?.trim() || '',
          mandal: values[1]?.trim() || '',
          month: parseFloat(values[2]) || 0,
          year: parseFloat(values[3]) || 2024,
          NDVI_mean: parseFloat(values[4]) || 0,
          rainfall_mm_per_day: parseFloat(values[5]) || 0,
          temperature_C: parseFloat(values[6]) || 25,
          batch_id: values[7]?.trim() || 'batch_0'
        });
      }
    }

    return data;
  }

  private getFallbackData(): DistrictData[] {
    return [
      // Adilabad District
      { district: "Adilabad", mandal: "Adilabad Rural", month: 10, year: 2024, NDVI_mean: 0.45, rainfall_mm_per_day: 1.24, temperature_C: 25, batch_id: "batch_0" },
      { district: "Adilabad", mandal: "Adilabad Urban", month: 10, year: 2024, NDVI_mean: 0.33, rainfall_mm_per_day: 1.15, temperature_C: 26, batch_id: "batch_0" },
      { district: "Adilabad", mandal: "Bazarhathnoor", month: 10, year: 2024, NDVI_mean: 0.41, rainfall_mm_per_day: 1.40, temperature_C: 24, batch_id: "batch_0" },
      { district: "Adilabad", mandal: "Bheempoor", month: 10, year: 2024, NDVI_mean: 0.46, rainfall_mm_per_day: 1.25, temperature_C: 25, batch_id: "batch_0" },
      { district: "Adilabad", mandal: "Boath", month: 10, year: 2024, NDVI_mean: 0.40, rainfall_mm_per_day: 1.47, temperature_C: 24, batch_id: "batch_0" },
      
      // Hyderabad District
      { district: "Hyderabad", mandal: "Amberpet", month: 10, year: 2024, NDVI_mean: 0.16, rainfall_mm_per_day: 1.95, temperature_C: 28, batch_id: "batch_0" },
      { district: "Hyderabad", mandal: "Secunderabad", month: 10, year: 2024, NDVI_mean: 0.13, rainfall_mm_per_day: 1.95, temperature_C: 29, batch_id: "batch_0" },
      { district: "Hyderabad", mandal: "Charminar", month: 10, year: 2024, NDVI_mean: 0.07, rainfall_mm_per_day: 1.87, temperature_C: 30, batch_id: "batch_0" },
      { district: "Hyderabad", mandal: "Golkonda", month: 10, year: 2024, NDVI_mean: 0.26, rainfall_mm_per_day: 1.90, temperature_C: 28, batch_id: "batch_0" },
      
      // Jagtial District
      { district: "Jagtial", mandal: "Beerpur", month: 10, year: 2024, NDVI_mean: 0.41, rainfall_mm_per_day: 0.79, temperature_C: 27, batch_id: "batch_0" },
      { district: "Jagtial", mandal: "Dharmapuri", month: 10, year: 2024, NDVI_mean: 0.42, rainfall_mm_per_day: 0.80, temperature_C: 26, batch_id: "batch_0" },
      { district: "Jagtial", mandal: "Jagtial", month: 10, year: 2024, NDVI_mean: 0.00, rainfall_mm_per_day: 0.92, temperature_C: 27, batch_id: "batch_0" },
      { district: "Jagtial", mandal: "Korutla", month: 10, year: 2024, NDVI_mean: 0.08, rainfall_mm_per_day: 0.93, temperature_C: 28, batch_id: "batch_0" },
      
      // Bhadradri Kothagudem District
      { district: "Bhadradri Kothagudem", mandal: "Allapalli", month: 10, year: 2024, NDVI_mean: 0.43, rainfall_mm_per_day: 1.86, temperature_C: 25, batch_id: "batch_0" },
      { district: "Bhadradri Kothagudem", mandal: "Bhadrachalam", month: 10, year: 2024, NDVI_mean: 0.21, rainfall_mm_per_day: 2.23, temperature_C: 26, batch_id: "batch_0" },
      { district: "Bhadradri Kothagudem", mandal: "Kothagudem", month: 10, year: 2024, NDVI_mean: 0.36, rainfall_mm_per_day: 2.18, temperature_C: 26, batch_id: "batch_0" },
      { district: "Bhadradri Kothagudem", mandal: "Yellandu", month: 10, year: 2024, NDVI_mean: 0.41, rainfall_mm_per_day: 2.02, temperature_C: 25, batch_id: "batch_0" },
      { district: "Bhadradri Kothagudem", mandal: "Dammapeta", month: 10, year: 2024, NDVI_mean: 0.38, rainfall_mm_per_day: 1.95, temperature_C: 26, batch_id: "batch_0" },
      
      // Hanumakonda District
      { district: "Hanumakonda", mandal: "Hanumakonda", month: 10, year: 2024, NDVI_mean: 0.30, rainfall_mm_per_day: 1.93, temperature_C: 27, batch_id: "batch_0" },
      { district: "Hanumakonda", mandal: "Parkal", month: 10, year: 2024, NDVI_mean: 0.41, rainfall_mm_per_day: 1.62, temperature_C: 26, batch_id: "batch_0" },
      { district: "Hanumakonda", mandal: "Atmakur", month: 10, year: 2024, NDVI_mean: 0.42, rainfall_mm_per_day: 1.78, temperature_C: 26, batch_id: "batch_0" },
      
      // Jayashankar Bhupalpally District
      { district: "Jayashankar Bhupalpally", mandal: "Bhupalpally", month: 10, year: 2024, NDVI_mean: 0.44, rainfall_mm_per_day: 1.82, temperature_C: 25, batch_id: "batch_0" },
      { district: "Jayashankar Bhupalpally", mandal: "Chityal", month: 10, year: 2024, NDVI_mean: 0.43, rainfall_mm_per_day: 1.58, temperature_C: 25, batch_id: "batch_0" },
      
      // Jogulamba Gadwal District
      { district: "Jogulamba Gadwal", mandal: "Gadwal", month: 10, year: 2024, NDVI_mean: 0.39, rainfall_mm_per_day: 4.09, temperature_C: 24, batch_id: "batch_0" },
      { district: "Jogulamba Gadwal", mandal: "Alampur", month: 10, year: 2024, NDVI_mean: 0.21, rainfall_mm_per_day: 4.69, temperature_C: 24, batch_id: "batch_0" },
      { district: "Jogulamba Gadwal", mandal: "Ieeja", month: 10, year: 2024, NDVI_mean: 0.35, rainfall_mm_per_day: 3.85, temperature_C: 25, batch_id: "batch_0" },
    ];
  }

  getDistricts(): string[] {
    return [...new Set(this.csvData.map(item => item.district))];
  }

  getMandals(district: string): string[] {
    return [...new Set(
      this.csvData
        .filter(item => item.district === district)
        .map(item => item.mandal)
    )];
  }

  getLocationData(district: string, mandal: string): DistrictData | undefined {
    return this.csvData.find(
      item => item.district === district && item.mandal === mandal
    );
  }

  getDistrictAverageData(district: string): DistrictData | undefined {
    const districtData = this.csvData.filter(item => item.district === district);
    if (districtData.length === 0) return undefined;

    // Calculate averages for the district
    const avgNDVI = districtData.reduce((sum, item) => sum + item.NDVI_mean, 0) / districtData.length;
    const avgRainfall = districtData.reduce((sum, item) => sum + item.rainfall_mm_per_day, 0) / districtData.length;
    const avgTemp = districtData.reduce((sum, item) => sum + item.temperature_C, 0) / districtData.length;

    return {
      district,
      mandal: 'District Average',
      month: districtData[0].month,
      year: districtData[0].year,
      NDVI_mean: avgNDVI,
      rainfall_mm_per_day: avgRainfall,
      temperature_C: avgTemp,
      batch_id: districtData[0].batch_id
    };
  }

  getAllData(): DistrictData[] {
    return this.csvData;
  }
}

export const csvLoader = CSVLoader.getInstance();