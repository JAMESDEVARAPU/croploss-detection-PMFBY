import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Phone, User, Leaf } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Leaf className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Crop Loss Detection</CardTitle>
          <p className="text-gray-600">PMFBY Insurance System</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="mobile"
                type="tel"
                placeholder="+91 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button
            onClick={handleLogin}
            disabled={!mobile || !name || loading}
            className="w-full"
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