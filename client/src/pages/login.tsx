import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Phone, User, Leaf } from "lucide-react";
import backgroundImage from "@assets/seva_1759926468291.jpg";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!mobile || !name) return;
    
    setLoading(true);
    
    // Simulate login
    setTimeout(() => {
      const user = {
        id: Date.now().toString(),
        name,
        mobile,
        email: "",
        farmLocation: "",
        preferredLanguage: "en"
      };
      
      onLogin(user);
      setLoading(false);
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/50 to-white/60 backdrop-blur-sm"></div>
      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur shadow-2xl border-2 border-white/60">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Leaf className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Crop Loss Detection</CardTitle>
          <p className="text-gray-600">PMFBY Insurance System</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-11 text-base"
                data-testid="input-name"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="mobile" className="text-sm font-medium">Mobile Number</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="mobile"
                type="tel"
                placeholder="+91 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="pl-10 h-11 text-base"
                data-testid="input-mobile"
              />
            </div>
          </div>
          
          <Button
            onClick={handleLogin}
            disabled={!mobile || !name || loading}
            className="w-full h-12 text-base font-semibold bg-green-700 hover:bg-green-800 transition-colors"
            data-testid="button-login"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
          
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Secure farmer authentication</p>
            <p>• PMFBY insurance verification</p>
            <p>• Multi-language support</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}