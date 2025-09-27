
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical } from "lucide-react";

export default function ServiceEditor({ service, onUpdate, onRemove }) {
  const serviceTypes = [
    { value: "fixed", label: "Fixed Price", description: "A one-time charge for a service" },
    { value: "per_unit", label: "Per Unit", description: "Price is multiplied by quantity" },
    { value: "recurring", label: "Recurring Service", description: "For subscription based services" }
  ];

  const selectionMethods = [
    { value: "checkbox", label: "Checkbox", description: "Simple yes/no selection" },
    { value: "numeric", label: "Numeric Stepper", description: "Select quantity with +/- buttons" },
    { value: "text_input", label: "Text Input", description: "Type in quantity" }
  ];

  const handleTypeChange = (value) => {
    const updates = { type: value };
    if (value !== 'per_unit') {
      updates.unit_label = undefined;
    }
    if (value !== 'recurring') {
      updates.frequency = undefined;
    }
    onUpdate(updates);
  };

  return (
    <Card className="border border-gray-200 hover:border-green-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="mt-2 text-gray-400 cursor-grab">
            <GripVertical className="w-5 h-5" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono text-xs">
                {service.type} • {service.selection_method || 'checkbox'}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Service Name*</Label>
                <Input
                  value={service.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="New Service"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-sm">Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={service.price > 0 ? service.price : ''}
                  onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Pricing Type</Label>
                <Select value={service.type} onValueChange={handleTypeChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                    {serviceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col items-start text-left w-full">
                          <span className="font-medium text-left">{type.label}</span>
                          <span className="text-xs text-gray-500 text-left whitespace-normal">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Selection Method</Label>
                <Select 
                  value={service.selection_method || "checkbox"} 
                  onValueChange={(value) => onUpdate({ selection_method: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                    {selectionMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex flex-col items-start text-left w-full">
                          <span className="font-medium text-left">{method.label}</span>
                          <span className="text-xs text-gray-500 text-left whitespace-normal">{method.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {service.type === 'per_unit' && (
              <div>
                <Label className="text-sm">Unit Label</Label>
                <Input
                  value={service.unit_label || ""}
                  onChange={(e) => onUpdate({ unit_label: e.target.value })}
                  placeholder="e.g., 'drinks', 'hours', 'guests'"
                  className="h-9"
                />
              </div>
            )}

            {service.type === 'recurring' && (
              <div>
                <Label className="text-sm">Frequency</Label>
                <Input
                  value={service.frequency || ""}
                  onChange={(e) => onUpdate({ frequency: e.target.value })}
                  placeholder="e.g., Weekly, Monthly, Yearly"
                  className="h-9"
                />
              </div>
            )}
            
            <div>
              <Label className="text-sm">Description (optional)</Label>
              <Textarea
                value={service.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Briefly describe this service"
                rows={2}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
