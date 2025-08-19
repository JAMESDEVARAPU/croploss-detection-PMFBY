import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Phone, LogIn, CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";

interface UserLoginProps {
  onLogin?: (user: any) => void;
}

export function UserLogin({ onLogin }: UserLoginProps) {
  const { language } = useLanguage();
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleLogin = async () => {
    if (!mobile || mobile.length < 10) {
      setLoginStatus('error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, name })
      });

      const result = await response.json();
      
      if (result.success && result.user) {
        setUser(result.user);
        setLoginStatus('success');
        onLogin?.(result.user);
      } else {
        setLoginStatus('error');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = () => {
    const texts = {
      'en': {
        title: 'Farmer Profile Login',
        mobile: 'Mobile Number',
        name: 'Name (Optional)',
        login: 'Login / Register',
        success: 'Login Successful!',
        error: 'Login failed. Check mobile number.',
        loading: 'Logging in...'
      },
      'hi': {
        title: 'किसान प्रोफ़ाइल लॉगिन',
        mobile: 'मोबाइल नंबर',
        name: 'नाम (वैकल्पिक)',
        login: 'लॉगिन / पंजीकरण',
        success: 'लॉगिन सफल!',
        error: 'लॉगिन असफल। मोबाइल नंबर जांचें।',
        loading: 'लॉगिन हो रहा है...'
      },
      'te': {
        title: 'రైతు ప్రొఫైల్ లాగిన్',
        mobile: 'మొబైల్ నంబర్',
        name: 'పేరు (ఐచ్ఛికం)',
        login: 'లాగిన్ / రిజిస్టర్',
        success: 'లాగిన్ విజయవంతం!',
        error: 'లాగిన్ విఫలం. మొబైల్ నంబర్ తనిఖీ చేయండి.',
        loading: 'లాగిన్ అవుతోంది...'
      }
    };
    return texts[language as keyof typeof texts] || texts['en'];
  };

  const text = getStatusText();

  if (user) {
    return (
      <Card className="mb-4 border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-800">
                  {text.success}
                </div>
                <div className="text-sm text-green-600">
                  <Phone className="inline h-3 w-3 mr-1" />
                  {user.mobile}
                </div>
              </div>
            </div>
            <Badge variant="secondary">
              <User className="h-3 w-3 mr-1" />
              Farmer
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5 text-primary" />
          <span>{text.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="mobile" className="text-sm font-medium text-gray-700 block mb-1">
            {text.mobile}
          </Label>
          <Input
            id="mobile"
            type="tel"
            placeholder="9959321421"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            maxLength={10}
            data-testid="input-mobile"
          />
        </div>
        
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700 block mb-1">
            {text.name}
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-name"
          />
        </div>

        <Button
          onClick={handleLogin}
          disabled={isLoading || !mobile || mobile.length < 10}
          className="w-full"
          data-testid="button-login"
        >
          <LogIn className="h-4 w-4 mr-2" />
          {isLoading ? text.loading : text.login}
        </Button>

        {loginStatus === 'error' && (
          <div className="text-sm text-red-600 text-center">
            {text.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}