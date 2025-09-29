import { storage } from "../storage";

export class WhatsAppService {
  private static instance: WhatsAppService;

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async processMessage(message: string, from: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Handle greetings
    if (this.isGreeting(lowerMessage)) {
      return this.handleGreeting(from);
    }

    // Handle registration requests
    if (this.isRegistrationRequest(lowerMessage)) {
      return this.handleRegistrationRequest(from);
    }

    // Handle information requests
    if (this.isInformationRequest(lowerMessage)) {
      return this.handleInformationRequest(lowerMessage);
    }

    // Handle crop analysis requests
    if (this.isCropAnalysisRequest(lowerMessage)) {
      return this.handleCropAnalysisRequest(from);
    }

    // Handle PMFBY queries
    if (this.isPMFBYQuery(lowerMessage)) {
      return this.handlePMFBYQuery(from);
    }

    // Default response
    return this.handleDefaultResponse();
  }

  private isGreeting(message: string): boolean {
    const greetings = ['halo', 'hello', 'hi', 'hai', 'selamat', 'assalamualaikum'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private isRegistrationRequest(message: string): boolean {
    const keywords = ['daftar', 'register', 'signup', 'join', 'kpab', 'pmfby'];
    return keywords.some(keyword => message.includes(keyword)) &&
           (message.includes('mau') || message.includes('want') || message.includes('ingin'));
  }

  private isInformationRequest(message: string): boolean {
    const keywords = ['syarat', 'requirements', 'cara', 'how', 'apa', 'what', 'info'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isCropAnalysisRequest(message: string): boolean {
    const keywords = ['crop', 'tanaman', 'analysis', 'analisis', 'loss', 'kerugian', 'health', 'kesehatan'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isPMFBYQuery(message: string): boolean {
    const keywords = ['pmfby', 'insurance', 'asuransi', 'claim', 'klaim', 'compensation', 'kompensasi'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private async handleGreeting(from: string): Promise<string> {
    // Check if user exists
    const user = await storage.getUserByMobile(from);
    const userName = user ? user.name : 'Petani';

    return `Halo ${userName}! 👋

Selamat datang di layanan Crop Loss Detection PMFBY.

Saya dapat membantu Anda dengan:
• Pendaftaran program asuransi tanaman
• Analisis kerugian tanaman menggunakan citra satelit
• Cek kelayakan PMFBY
• Informasi cuaca dan rekomendasi pertanian

Apa yang bisa saya bantu hari ini?`;
  }

  private async handleRegistrationRequest(from: string): Promise<string> {
    const user = await storage.getUserByMobile(from);

    if (user) {
      return `Anda sudah terdaftar dalam sistem kami dengan nama ${user.name}.

Untuk melakukan analisis tanaman, silakan kirim lokasi lahan Anda atau gunakan aplikasi web kami.

Apakah ada yang ingin ditanyakan?`;
    }

    return `Untuk mendaftar program PMFBY, saya perlu beberapa informasi dari Anda:

1. Nama lengkap
2. Nomor HP (sudah tercatat: ${from})
3. Lokasi lahan pertanian
4. Jenis tanaman yang ditanam

Silakan kirim informasi tersebut satu per satu, atau gunakan aplikasi web kami untuk pendaftaran yang lebih mudah.

Kunjungi: http://localhost:5173`;
  }

  private async handleInformationRequest(message: string): Promise<string> {
    if (message.includes('syarat') || message.includes('requirements')) {
      return `Syarat pendaftaran PMFBY:

✅ Warga negara India
✅ Memiliki lahan pertanian
✅ Menanam tanaman yang didukung PMFBY
✅ Membayar premi asuransi
✅ Melaporkan kerugian dalam 72 jam

Tanaman yang didukung:
• Padi (Rice)
• Gandum (Wheat)
• Kapas (Cotton)
• Tebu (Sugarcane)
• Jagung (Maize)

Untuk informasi lebih detail, kunjungi situs resmi PMFBY.`;
    }

    if (message.includes('cara') || message.includes('how')) {
      return `Cara mendaftar PMFBY:

1️⃣ Daftar melalui aplikasi web kami
2️⃣ Isi formulir pendaftaran dengan data lengkap
3️⃣ Verifikasi lokasi lahan
4️⃣ Pilih jenis tanaman
5️⃣ Bayar premi asuransi

Atau daftar langsung melalui:
📱 Aplikasi web: http://localhost:5173
📞 Call center PMFBY

Butuh bantuan lebih lanjut?`;
    }

    return `Informasi yang tersedia:

• Syarat pendaftaran PMFBY
• Cara mendaftar online
• Jenis tanaman yang didukung
• Proses klaim asuransi
• Analisis kerugian tanaman

Kirim pesan dengan kata kunci yang sesuai untuk informasi spesifik.`;
  }

  private async handleCropAnalysisRequest(from: string): Promise<string> {
    const user = await storage.getUserByMobile(from);

    if (!user) {
      return `Untuk melakukan analisis tanaman, Anda perlu mendaftar terlebih dahulu.

Silakan daftar melalui aplikasi web: http://localhost:5173

Atau kirim pesan "daftar" untuk panduan pendaftaran.`;
    }

    return `Untuk analisis kerugian tanaman, saya dapat membantu dengan:

🔍 Analisis kesehatan tanaman menggunakan citra satelit
📊 Hitung persentase kerugian
💰 Cek kelayakan kompensasi PMFBY
🌦️ Rekomendasi cuaca dan pertanian

Kirim lokasi lahan Anda (koordinat GPS) atau gunakan aplikasi web untuk analisis yang lebih akurat.

Contoh: "analisis tanaman di 20.5937, 78.9629"`;
  }

  private async handlePMFBYQuery(from: string): Promise<string> {
    const user = await storage.getUserByMobile(from);

    if (!user) {
      return `Untuk informasi PMFBY, Anda perlu terdaftar dalam sistem.

Silakan daftar terlebih dahulu melalui aplikasi web: http://localhost:5173`;
    }

    // Get user's recent analyses
    const analyses = await storage.getCropAnalysesByUser(user.id);
    const recentAnalysis = analyses[0]; // Most recent

    if (!recentAnalysis) {
      return `Anda belum memiliki analisis tanaman.

Lakukan analisis terlebih dahulu untuk mengecek kelayakan PMFBY.

Kirim "analisis tanaman" untuk memulai.`;
    }

    const eligible = recentAnalysis.pmfbyEligible;
    const lossPercent = recentAnalysis.lossPercentage || 0;
    const compensation = recentAnalysis.compensationAmount || 0;

    if (eligible) {
      return `✅ Status PMFBY Anda: LAYAK

📊 Kerugian terdeteksi: ${lossPercent.toFixed(1)}%
💰 Estimasi kompensasi: ₹${compensation.toLocaleString()}

Silakan ajukan klaim melalui aplikasi web atau kantor PMFBY terdekat.

Dokumen yang diperlukan:
• Laporan analisis
• Foto lahan
• Bukti kepemilikan lahan`;
    } else {
      return `❌ Status PMFBY Anda: TIDAK LAYAK

📊 Kerugian terdeteksi: ${lossPercent.toFixed(1)}%
📝 Alasan: Kerugian di bawah threshold 33%

Untuk informasi lebih detail tentang syarat kelayakan PMFBY, kirim "syarat pmfby".`;
    }
  }

  private handleDefaultResponse(): string {
    return `Maaf, saya tidak mengerti pesan Anda. 🤔

Saya dapat membantu dengan:
• Pendaftaran PMFBY
• Analisis kerugian tanaman
• Informasi program asuransi
• Cek status klaim

Kirim salah satu dari:
• "halo" - untuk salam
• "daftar" - untuk pendaftaran
• "syarat" - untuk syarat dan ketentuan
• "cara daftar" - untuk panduan pendaftaran
• "analisis" - untuk analisis tanaman
• "pmfby" - untuk informasi asuransi

Atau gunakan aplikasi web: http://localhost:5173`;
  }
}

export const whatsappService = WhatsAppService.getInstance();
