import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";

export default function BrandingEditor({ branding, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...branding, [key]: value });
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Palette className="w-4 sm:w-5 h-4 sm:h-5" />
          Header Color
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header Color - Available to Everyone */}
        <div>
          <Label htmlFor="primary_color" className="text-sm font-medium">Header Color</Label>
          <p className="text-xs text-gray-500 mb-2">Choose the color for your quote form header</p>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              id="primary_color"
              value={branding.primary_color || "#87A96B"}
              onChange={(e) => handleChange("primary_color", e.target.value)}
              className="w-14 h-10 rounded-lg border border-gray-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
              title="Pick a color"
            />
            <Input
              value={branding.primary_color || "#87A96B"}
              onChange={(e) => handleChange("primary_color", e.target.value)}
              className="flex-1 min-w-0 font-mono text-sm"
              placeholder="#87A96B"
            />
          </div>
          {/* Color Preview */}
          <div className="mt-3">
            <div 
              className="w-full h-16 rounded-lg shadow-inner flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: branding.primary_color || "#87A96B" }}
            >
              Header Preview
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}