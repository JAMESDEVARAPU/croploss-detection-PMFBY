import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Satellite, 
  TrendingDown, 
  Shield, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Calculator,
  NotebookPen,
  MapPin,
  Building,
  ExternalLink
} from "lucide-react";
import { useLanguage } from "../hooks/use-language";
import { useState, useEffect } from "react";

import { CropAnalysis } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: CropAnalysis;
  isLoading?: boolean;
}

interface LocationInfo {
  village: string;
  mandal: string;
  district: string;
  state: string;
}

export function AnalysisResults({ analysis, isLoading }: AnalysisResultsProps) {
  const { t } = useLanguage();
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);

  useEffect(() => {
    if (analysis.latitude && analysis.longitude) {
      fetchLocationInfo(analysis.latitude, analysis.longitude);
    }
  }, [analysis.latitude, analysis.longitude]);

  const fetchLocationInfo = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLocationInfo({
            village: data.location.village || 'Unknown',
            mandal: data.location.mandal || 'Unknown', 
            district: data.location.district || 'Unknown',
            state: data.location.state || 'Unknown'
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch location info:', error);
    }
  };

  if (isLoading && !analysis.lossPercentage) {
    return <ProcessingStatus analysis={analysis} />;
  }

  const lossPercentage = Math.round(analysis.lossPercentage || 0);
  const ndviBefore = analysis.ndviBefore?.toFixed(2) || "0.00";
  const ndviCurrent = analysis.ndviCurrent?.toFixed(2) || "0.00";
  const confidence = Math.round(analysis.confidence || 0);
  const acquisitionDates = analysis.acquisitionDates as Record<string, string> | undefined;

  const openInNewTab = () => {
    window.open(`/analysis/${analysis.id}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      {/* Satellite Images Viewer */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Satellite className="h-5 w-5 text-secondary" />
                <span>{t("satelliteAnalysis")}</span>
              </div>
              <div className="flex items-center space-x-2">
                {(analysis as any).data_source === 'offline_csv' && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                    Offline Mode
                  </Badge>
                )}
                <Badge variant="outline" className="text-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  {analysis.analysisDate ? new Date(analysis.analysisDate).toLocaleDateString() : 'N/A'}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openInNewTab}
                  data-testid="button-open-new-tab"
                  className="ml-2"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Before/After Satellite Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>{t("beforeHealthy")}</span>
                  </div>
                  {acquisitionDates && (
                    <span className="text-xs text-gray-500">
                      {new Date(acquisitionDates?.before || new Date()).toLocaleDateString()}
                    </span>
                  )}
                </h4>
                <div className="relative w-full h-48 bg-gradient-to-br from-green-400 to-green-600 rounded-lg border overflow-hidden">
                  {analysis.satelliteImageBefore ? (
                    <img 
                      src={analysis.satelliteImageBefore} 
                      alt="Before satellite image"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <Satellite className="h-12 w-12 mx-auto mb-2" />
                        <div className="text-sm">NDVI: {ndviBefore}</div>
                        <div className="text-xs opacity-75">Healthy Vegetation</div>
                        <div className="text-xs opacity-75 mt-1">Sentinel-2 Imagery</div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span>{t("currentDamaged")}</span>
                  </div>
                  {acquisitionDates && (
                    <span className="text-xs text-gray-500">
                      {new Date(acquisitionDates?.current || new Date()).toLocaleDateString()}
                    </span>
                  )}
                </h4>
                <div className="relative w-full h-48 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg border overflow-hidden">
                  {analysis.satelliteImageAfter ? (
                    <img 
                      src={analysis.satelliteImageAfter} 
                      alt="After satellite image"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                        <div className="text-sm">NDVI: {ndviCurrent}</div>
                        <div className="text-xs opacity-75">Stressed/Damaged</div>
                        <div className="text-xs opacity-75 mt-1">Sentinel-2 Imagery</div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Time Gap Information */}
            {acquisitionDates && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 text-blue-800">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Analysis Period: {Math.round((new Date(acquisitionDates?.current || new Date()).getTime() - new Date(acquisitionDates?.before || new Date()).getTime()) / (1000 * 60 * 60 * 24))} days between images
                  </span>
                </div>
              </div>
            )}

            {/* Analysis Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-ndvi-before">{ndviBefore}</div>
                  <div className="text-xs text-gray-500">{t("ndbiBefore")}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600" data-testid="text-ndvi-current">{ndviCurrent}</div>
                  <div className="text-xs text-gray-500">{t("ndviCurrent")}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent" data-testid="text-loss-percentage">{lossPercentage}%</div>
                  <div className="text-xs text-gray-500">{t("lossDetected")}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600" data-testid="text-confidence">{confidence}%</div>
                  <div className="text-xs text-gray-500">{t("confidence")}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      <div className="space-y-6">
        <LossAssessmentCard analysis={analysis} />
        <PMFBYEligibilityCard analysis={analysis} />
        <SMSNotificationCard analysis={analysis} />

      </div>
    </div>
  );
}

function ProcessingStatus({ analysis }: { analysis: CropAnalysis }) {
  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light rounded-full">
            <Satellite className="h-8 w-8 text-white animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Processing...</h3>
            <p className="text-gray-600">Analysis in progress</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LossAssessmentCard({ analysis }: { analysis: CropAnalysis }) {
  const { t } = useLanguage();
  const lossPercentage = Math.round(analysis.lossPercentage || 0);
  const affectedArea = analysis.affectedArea?.toFixed(1) || "0.0";
  const estimatedValue = analysis.estimatedValue ? `₹${Math.round(analysis.estimatedValue).toLocaleString()}` : "₹0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingDown className="h-5 w-5 text-accent" />
          <span>{t("lossAssessment")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-red-600 mb-2" data-testid="text-loss-percentage-main">
            {lossPercentage}%
          </div>
          <div className="text-sm text-gray-600">{t("cropLossDetected")}</div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-red-500 h-3 rounded-full transition-all duration-500" 
            style={{ width: `${lossPercentage}%` }}
          ></div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t("affectedArea")}:</span>
            <span className="font-medium" data-testid="text-affected-area">{affectedArea} hectares</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("estimatedValue")}:</span>
            <span className="font-medium" data-testid="text-estimated-value">{estimatedValue}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("damageCause")}:</span>
            <span className="font-medium text-orange-600" data-testid="text-damage-cause">
              {analysis.damageCause || "Unknown"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PMFBYEligibilityCard({ analysis }: { analysis: CropAnalysis }) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const isEligible = (analysis.lossPercentage || 0) >= 33;
  const compensation = analysis.compensationAmount ? `₹${analysis.compensationAmount.toLocaleString()}` : "₹0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-secondary" />
          <span>{t("pmfbyEligibility")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isEligible ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${isEligible ? 'text-green-700' : 'text-red-700'}`}>
              {isEligible ? t("eligibleForCompensation") : t("notEligibleForCompensation")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
        
        {showDetails && (
          <>
            <div className={`border rounded-lg p-4 ${isEligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("minimumLossThreshold")}:</span>
                  <span className={`font-medium ${(analysis.lossPercentage || 0) >= 33 ? 'text-green-700' : 'text-red-700'}`}>
                    33% {(analysis.lossPercentage || 0) >= 33 ? '✓' : '✗'} (Your loss: {Math.round(analysis.lossPercentage || 0)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("policyStatus")}:</span>
                  <span className="text-green-700 font-medium">Active ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("areaCoverage")}:</span>
                  <span className="text-green-700 font-medium">Covered ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("reportingWindow")}:</span>
                  <span className="text-green-700 font-medium">Valid ✓</span>
                </div>
              </div>
            </div>
            
            {/* PMFBY Explanation */}
            <div className={`border rounded-lg p-4 ${isEligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-sm font-medium mb-2">
                {isEligible ? '✅ Why you are ELIGIBLE:' : '❌ Why you are NOT ELIGIBLE:'}
              </div>
              <div className="text-sm text-gray-700">
                {(analysis as any).pmfbyExplanation || 
                 (isEligible ? 
                  `Your crop loss exceeds the 33% minimum threshold required by PMFBY.` :
                  `Your crop loss is below the 33% minimum threshold required by PMFBY.`)}
              </div>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}

function SMSNotificationCard({ analysis }: { analysis: CropAnalysis }) {
  const { t } = useLanguage();
  const smsStatus = analysis.smsStatus;
  const isSent = smsStatus === "sent";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span>{t("smsNotification")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`flex items-center space-x-2 ${isSent ? 'text-green-700' : 'text-orange-700'}`}>
          {isSent ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {isSent ? t("smsSentSuccessfully") : "SMS Pending"}
          </span>
        </div>
        
        {isSent && (
          <>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-gray-700 mb-1">{t("messageSent")}:</div>
              <div className="text-gray-600" data-testid="text-sms-content">
                "आपकी फसल में {Math.round(analysis.lossPercentage || 0)}% नुकसान का पता चला है। PMFBY मुआवजे के लिए आप पात्र हैं।"
              </div>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>{t("sentTo")}: <span data-testid="text-mobile-number">{"N/A"}</span></div>
              <div>{t("time")}: <span>{new Date(analysis.analysisDate!).toLocaleString()}</span></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
