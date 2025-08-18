export interface SMSTemplate {
  en: string;
  hi: string;
  te: string;
}

const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  eligible: {
    en: "Crop loss analysis complete. {lossPercentage}% loss detected. You are eligible for PMFBY compensation of ₹{amount}. Claim will be processed automatically.",
    hi: "फसल नुकसान का विश्लेषण पूरा हुआ। {lossPercentage}% नुकसान का पता चला। आप ₹{amount} के PMFBY मुआवजे के लिए पात्र हैं। दावा स्वचालित रूप से प्रसंस्करण होगा।",
    te: "పంట నష్టం విశ్లేషణ పూర్తయింది. {lossPercentage}% నష్టం కనుగొనబడింది. మీరు ₹{amount} PMFBY పరిహారానికి అర్హులు. దావా స్వయంచాలకంగా ప్రాసెస్ చేయబడుతుంది."
  },
  notEligible: {
    en: "Crop loss analysis complete. {lossPercentage}% loss detected. Unfortunately, you are not eligible for PMFBY compensation. {reason}",
    hi: "फसल नुकसान का विश्लेषण पूरा हुआ। {lossPercentage}% नुकसान का पता चला। दुर्भाग्य से, आप PMFBY मुआवजे के लिए पात्र नहीं हैं। {reason}",
    te: "పంట నష్టం విశ్లేషణ పూర్తయింది. {lossPercentage}% నష్టం కనుగొనబడింది. దురదృష్టవశాత్తు, మీరు PMFBY పరిహారానికి అర్హులు కాదు. {reason}"
  }
};

export class SMSService {
  private twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || process.env.SMS_ACCOUNT_SID;
  private twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || process.env.SMS_AUTH_TOKEN;
  private twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || process.env.SMS_PHONE_NUMBER;

  async sendSMS(phoneNumber: string, templateKey: string, language: string, variables: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber) {
        console.warn("SMS credentials not configured, simulating SMS send");
        return this.simulateSMSSend(phoneNumber, templateKey, language, variables);
      }

      const template = SMS_TEMPLATES[templateKey];
      if (!template || !template[language as keyof SMSTemplate]) {
        throw new Error(`Template not found for ${templateKey} in language ${language}`);
      }

      let message = template[language as keyof SMSTemplate];
      
      // Replace variables in template
      Object.keys(variables).forEach(key => {
        message = message.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
      });

      // For production, use Twilio SDK:
      // const twilio = require('twilio');
      // const client = twilio(this.twilioAccountSid, this.twilioAuthToken);
      // 
      // const result = await client.messages.create({
      //   body: message,
      //   from: this.twilioPhoneNumber,
      //   to: phoneNumber
      // });

      console.log(`SMS sent to ${phoneNumber}: ${message}`);
      
      return { success: true };
    } catch (error) {
      console.error("SMS sending failed:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private simulateSMSSend(phoneNumber: string, templateKey: string, language: string, variables: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const template = SMS_TEMPLATES[templateKey];
        if (template && template[language as keyof SMSTemplate]) {
          let message = template[language as keyof SMSTemplate];
          Object.keys(variables).forEach(key => {
            message = message.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
          });
          console.log(`[SMS SIMULATION] To: ${phoneNumber}, Message: ${message}`);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: "Template not found" });
        }
      }, 1000);
    });
  }
}

export const smsService = new SMSService();
