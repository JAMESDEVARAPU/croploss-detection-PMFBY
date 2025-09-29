import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, Leaf, Phone, Satellite } from "lucide-react";
import { useLanguage } from "../hooks/use-language";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CoordinateInputProps {
  onAnalysisStart: (analysisId: string) => void;
}

interface AnalysisRequest {
  latitude: number;
  longitude: number;
  fieldArea: number;
  cropType: string;
  mobile: string;
  language: string;
}

export function CoordinateInput({ onAnalysisStart }: CoordinateInputProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    latitude: "",
    longitude: "",
    fieldArea: "",
    cropType: "",
    mobile: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const analysisMutation = useMutation({
    mutationFn: async (data: AnalysisRequest) => {
      const response = await apiRequest("POST", "/api/crop-analysis", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Started",
        description: "Your crop analysis has been initiated. Results will be available shortly.",
      });
      
      // Cache the analysis data
      queryClient.setQueryData(["/api/crop-analysis", data.id], data);
      
      onAnalysisStart(data.id);
      setFormData({
        latitude: "",
        longitude: "",
        fieldArea: "",
        cropType: "",
        mobile: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to start crop analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.latitude || isNaN(Number(formData.latitude))) {
      newErrors.latitude = t("errors.invalidCoordinates");
    }
    
    if (!formData.longitude || isNaN(Number(formData.longitude))) {
      newErrors.longitude = t("errors.invalidCoordinates");
    }
    
    if (!formData.fieldArea || isNaN(Number(formData.fieldArea)) || Number(formData.fieldArea) <= 0) {
      newErrors.fieldArea = "Please enter a valid field area";
    }
    
    if (!formData.cropType) {
      newErrors.cropType = "Please select a crop type";
    }
    
    if (!formData.mobile || !/^\+?[\d\s-()]+$/.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid mobile number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    const analysisData = {
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      fieldArea: Number(formData.fieldArea),
      cropType: formData.cropType,
      mobile: formData.mobile,
      language,
    };
    
    analysisMutation.mutate(analysisData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Satellite className="h-5 w-5 text-primary" />
          <span>{t("cropAnalysis")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center space-x-1 mb-2">
              <Compass className="h-4 w-4" />
              <span>{t("latitude")}</span>
            </Label>
            <Input
              type="number"
              step="any"
              placeholder="e.g., 17.3850"
              value={formData.latitude}
              onChange={(e) => handleInputChange("latitude", e.target.value)}
              className={errors.latitude ? "border-red-500" : ""}
            />
            {errors.latitude && (
              <p className="text-xs text-red-500 mt-1">{errors.latitude}</p>
            )}
          </div>
          <div>
            <Label className="flex items-center space-x-1 mb-2">
              <Compass className="h-4 w-4" />
              <span>{t("longitude")}</span>
            </Label>
            <Input
              type="number"
              step="any"
              placeholder="e.g., 78.4867"
              value={formData.longitude}
              onChange={(e) => handleInputChange("longitude", e.target.value)}
              className={errors.longitude ? "border-red-500" : ""}
            />
            {errors.longitude && (
              <p className="text-xs text-red-500 mt-1">{errors.longitude}</p>
            )}
          </div>
        </div>
        
        <div>
          <Label className="flex items-center space-x-1 mb-2">
            <div className="h-4 w-4 border border-gray-400 rounded"></div>
            <span>{t("fieldArea")}</span>
          </Label>
          <Input
            type="number"
            step="0.01"
            placeholder="e.g., 2.5"
            value={formData.fieldArea}
            onChange={(e) => handleInputChange("fieldArea", e.target.value)}
            className={errors.fieldArea ? "border-red-500" : ""}
          />
          {errors.fieldArea && (
            <p className="text-xs text-red-500 mt-1">{errors.fieldArea}</p>
          )}
        </div>
        
        <div>
          <Label className="flex items-center space-x-1 mb-2">
            <Leaf className="h-4 w-4" />
            <span>{t("cropType")}</span>
          </Label>
          <Select 
            value={formData.cropType} 
            onValueChange={(value) => handleInputChange("cropType", value)}
          >
            <SelectTrigger className={errors.cropType ? "border-red-500" : ""}>
              <SelectValue placeholder={t("selectCrop")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rice">{t("crops.rice")}</SelectItem>
              <SelectItem value="wheat">{t("crops.wheat")}</SelectItem>
              <SelectItem value="cotton">{t("crops.cotton")}</SelectItem>
              <SelectItem value="sugarcane">{t("crops.sugarcane")}</SelectItem>
              <SelectItem value="maize">{t("crops.maize")}</SelectItem>
            </SelectContent>
          </Select>
          {errors.cropType && (
            <p className="text-xs text-red-500 mt-1">{errors.cropType}</p>
          )}
        </div>
        
        <div>
          <Label className="flex items-center space-x-1 mb-2">
            <Phone className="h-4 w-4" />
            <span>{t("mobileNumber")}</span>
          </Label>
          <Input
            type="tel"
            placeholder="+91 9876543210"
            value={formData.mobile}
            onChange={(e) => handleInputChange("mobile", e.target.value)}
            className={errors.mobile ? "border-red-500" : ""}
          />
          {errors.mobile && (
            <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
          )}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={analysisMutation.isPending}
          className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3"
        >
          <Satellite className="h-4 w-4 mr-2" />
          {analysisMutation.isPending ? t("analyzing") : t("analyzeCropLoss")}
        </Button>
      </CardContent>
    </Card>
  );
}