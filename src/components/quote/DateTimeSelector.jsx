import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

// Function to generate time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 8; i <= 17; i++) { // 8 AM to 5 PM
    slots.push(`${String(i).padStart(2, '0')}:00`);
    if (i < 17) {
      slots.push(`${String(i).padStart(2, '0')}:30`);
    }
  }
  return slots;
};

export default function DateTimeSelector({ selectedDateTime, onDateTimeChange, isDisabled = false }) {
  const timeSlots = generateTimeSlots();

  const handleDateSelect = (date) => {
    if (!date) {
      onDateTimeChange(null);
      return;
    }
    
    const newDateTime = new Date(date);
    if (selectedDateTime) {
      // Keep existing time if we had one
      newDateTime.setHours(selectedDateTime.getHours(), selectedDateTime.getMinutes());
    } else {
      // Set default time to 9 AM
      newDateTime.setHours(9, 0);
    }
    onDateTimeChange(newDateTime);
  };

  const handleTimeSelect = (timeValue) => {
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newDateTime = new Date(selectedDateTime || new Date());
    newDateTime.setHours(hours, minutes);
    onDateTimeChange(newDateTime);
  };

  const formatSelectedDate = (date) => {
    if (!date) return "Pick a date";
    return date.toLocaleDateString();
  };

  const formatSelectedTime = (date) => {
    if (!date) return null;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getSelectedTimeValue = () => {
    if (!selectedDateTime) return null;
    const hours = selectedDateTime.getHours();
    const minutes = selectedDateTime.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-full justify-start text-left font-normal h-12 ${!selectedDateTime && "text-muted-foreground"}`}
            disabled={isDisabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatSelectedDate(selectedDateTime)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDateTime}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
          />
        </PopoverContent>
      </Popover>
      
      <Select
        onValueChange={handleTimeSelect}
        value={getSelectedTimeValue()}
        disabled={!selectedDateTime || isDisabled}
      >
        <SelectTrigger className="h-12">
          <SelectValue placeholder="Pick a time" />
        </SelectTrigger>
        <SelectContent>
          {timeSlots.map(time => {
            const [hours, minutes] = time.split(':').map(Number);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            
            return (
              <SelectItem key={time} value={time}>{displayTime}</SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}