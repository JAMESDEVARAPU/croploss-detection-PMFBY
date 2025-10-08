import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, MapPin, LogOut } from "lucide-react";
import backgroundImage from "@assets/seva_1759926468291.jpg";

interface ProfileProps {
  user: any;
  onLogout: () => void;
}

export default function Profile({ user, onLogout }: ProfileProps) {
  return (
    <div 
      className="min-h-screen pb-20 relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/80 to-white/85 backdrop-blur-[2px]"></div>
      
      <div className="relative z-10">
        <header className="bg-white/95 backdrop-blur shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 space-x-3">
              <User className="text-green-600 h-8 w-8" />
              <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-green-600" />
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium" data-testid="text-username">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-medium" data-testid="text-mobile">{user.mobile}</p>
                  </div>
                </div>

                {user.email && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium" data-testid="text-email">{user.email}</p>
                    </div>
                  </div>
                )}

                {user.farmLocation && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Farm Location</p>
                      <p className="font-medium" data-testid="text-location">{user.farmLocation}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={onLogout}
                  variant="destructive"
                  className="w-full"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
