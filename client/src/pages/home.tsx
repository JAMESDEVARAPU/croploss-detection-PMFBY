import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoordinateInput } from "@/components/coordinate-input";
import { AnalysisResults } from "@/components/analysis-results";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { 
  History, 
  Leaf, 
  AlertTriangle, 
  TrendingDown,
  User,
  Phone,
  Mail,
  Building
} from "lucide-react";
import { CropAnalysis } from "@shared/schema";

export default function Home() {
  const { t } = useLanguage();
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  const { data: currentAnalysis, isLoading } = useQuery({
    queryKey: ["/api/crop-analysis", currentAnalysisId],
    enabled: !!currentAnalysisId,
    refetchInterval: currentAnalysisId && (!currentAnalysis?.lossPercentage) ? 3000 : false,
  });

  const handleAnalysisStart = (analysisId: string) => {
    setCurrentAnalysisId(analysisId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Leaf className="text-primary text-2xl h-8 w-8" />
                <h1 className="text-xl font-semibold text-gray-900">{t("appTitle")}</h1>
              </div>
              <span className="text-sm text-gray-500 hidden sm:block">{t("pmfbySubtitle")}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700 hidden sm:block">User Profile</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CoordinateInput onAnalysisStart={handleAnalysisStart} />
        
        {currentAnalysis && (
          <AnalysisResults 
            analysis={currentAnalysis} 
            isLoading={isLoading || !currentAnalysis.lossPercentage} 
          />
        )}
        
        <RecentAnalyses />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">About PMFBY</h4>
              <p className="text-sm text-gray-600">
                Pradhan Mantri Fasal Bima Yojana provides comprehensive crop insurance coverage to farmers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>Helpline: 1800-123-4567</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>Email: support@pmfby.gov.in</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Powered By</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4">🛰️</div>
                  <span>Google Earth Engine</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>Ministry of Agriculture</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t mt-6 pt-6 text-center text-sm text-gray-500">
            © 2024 Crop Loss Detection System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function RecentAnalyses() {
  const { t } = useLanguage();

  // Mock data for recent analyses
  const recentAnalyses = [
    {
      id: "1",
      location: "Guntur, Andhra Pradesh",
      lossPercentage: 48,
      pmfbyEligible: true,
      compensation: 18500,
      date: "2024-01-15, 2:30 PM",
      status: "severe",
    },
    {
      id: "2", 
      location: "Warangal, Telangana",
      lossPercentage: 12,
      pmfbyEligible: false,
      compensation: 0,
      date: "2024-01-12, 10:15 AM",
      status: "healthy",
    },
    {
      id: "3",
      location: "Kurnool, Andhra Pradesh", 
      lossPercentage: 35,
      pmfbyEligible: true,
      compensation: 14200,
      date: "2024-01-10, 4:45 PM",
      status: "moderate",
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "severe":
        return <AlertTriangle className="text-red-600" />;
      case "moderate":
        return <TrendingDown className="text-orange-600" />;
      default:
        return <Leaf className="text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "severe":
        return "bg-red-100";
      case "moderate":
        return "bg-orange-100";
      default:
        return "bg-green-100";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-gray-600" />
            <span>{t("recentAnalyses")}</span>
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark" data-testid="button-view-all">
            {t("viewAll")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              data-testid={`analysis-item-${analysis.id}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${getStatusColor(analysis.status)} rounded-lg flex items-center justify-center`}>
                  {getStatusIcon(analysis.status)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{analysis.location}</div>
                  <div className="text-sm text-gray-600">
                    {t("loss")}: <span className={`font-medium ${analysis.status === "healthy" ? "text-green-600" : analysis.status === "severe" ? "text-red-600" : "text-orange-600"}`}>
                      {analysis.lossPercentage}%
                    </span> • {analysis.pmfbyEligible ? t("pmfbyEligible") : t("healthyCrop")}
                  </div>
                  <div className="text-xs text-gray-500">{analysis.date}</div>
                </div>
              </div>
              <div className="text-right">
                {analysis.compensation > 0 ? (
                  <>
                    <div className="text-sm font-medium text-green-600">₹{analysis.compensation.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{t("compensation")}</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium text-gray-500">{t("noClaim")}</div>
                    <div className="text-xs text-gray-500">{t("belowThreshold")}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
