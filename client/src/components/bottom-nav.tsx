import { MapPin, Mic, BarChart3, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/gps", icon: MapPin, label: "GPS Coordinates" },
    { path: "/voice-analysis", icon: Mic, label: "Voice-Guided Analysis" },
    { path: "/district-analysis", icon: BarChart3, label: "District & Mandal" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-2">
        <div className="grid grid-cols-4 gap-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <a
                  data-testid={`nav-${item.path.slice(1)}`}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-green-50 text-green-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive ? "text-green-600" : "text-gray-500"}`} />
                  <span className="text-xs mt-1 text-center font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
