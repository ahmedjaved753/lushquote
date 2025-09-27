
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import ServiceEditor from './ServiceEditor';

export default function ServiceList({ services, setServices }) {
  const addService = () => {
    const newService = {
      id: `service_${Date.now()}`,
      type: "fixed",
      name: "", // Changed from "New Service" to empty string
      description: "",
      price: 0,
      selection_method: "checkbox", // Ensure default selection method is set
    };
    setServices([...services, newService]);
  };

  const updateService = (id, updates) => {
    setServices(services.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeService = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Services & Pricing</CardTitle>
          <Button onClick={addService} variant="outline" size="sm" className="hover:bg-green-50">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.map((service, index) => (
          <Draggable key={service.id} draggableId={service.id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <ServiceEditor
                  service={service}
                  onUpdate={(updates) => updateService(service.id, updates)}
                  onRemove={() => removeService(service.id)}
                />
              </div>
            )}
          </Draggable>
        ))}
        {services.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">No services added yet.</p>
            <Button onClick={addService} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Service
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
