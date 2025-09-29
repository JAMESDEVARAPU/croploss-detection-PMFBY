import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, Leaf } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Leaf className="h-16 w-16 text-gray-400" />
          </div>
          <CardTitle className="text-6xl font-bold text-gray-600 mb-2">404</CardTitle>
          <p className="text-xl text-gray-600">Page Not Found</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-500">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="space-y-2">
            <Link href="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>
            
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 pt-4">
            <p>Crop Loss Detection System</p>
            <p>PMFBY Insurance Platform</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}