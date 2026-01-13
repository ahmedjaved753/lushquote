import React, { useEffect, useRef, useCallback, useState } from 'react';

export default function CalendlyEmbed({
  schedulingUrl,
  prefillData = {},
  ownerTimezone,
  onEventScheduled,
}) {
  const containerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(!!window.Calendly);
  const widgetInitializedRef = useRef(false);

  // Build the embed URL with prefill parameters
  const buildEmbedUrl = useCallback(() => {
    if (!schedulingUrl) return '';

    const url = new URL(schedulingUrl);

    // Add prefill data
    if (prefillData.name) {
      url.searchParams.set('name', prefillData.name);
    }
    if (prefillData.email) {
      url.searchParams.set('email', prefillData.email);
    }

    // Set timezone to owner's timezone for display
    if (ownerTimezone) {
      // Note: Calendly uses IANA timezone names
      url.searchParams.set('timezone', ownerTimezone);
    }

    // Hide event type details to keep it clean
    url.searchParams.set('hide_event_type_details', '1');
    url.searchParams.set('hide_gdpr_banner', '1');

    return url.toString();
  }, [schedulingUrl, prefillData, ownerTimezone]);

  useEffect(() => {
    // Handle Calendly events
    const handleCalendlyEvent = (e) => {
      if (e.origin !== 'https://calendly.com') return;

      if (e.data.event === 'calendly.event_scheduled') {
        const payload = e.data.payload;
        onEventScheduled?.({
          eventUri: payload.event?.uri,
          inviteeUri: payload.invitee?.uri,
          startTime: payload.event?.start_time,
          endTime: payload.event?.end_time,
        });
      }
    };

    window.addEventListener('message', handleCalendlyEvent);

    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }, [onEventScheduled]);

  // Load Calendly script
  useEffect(() => {
    if (window.Calendly) {
      setScriptLoaded(true);
      return;
    }

    // Remove any existing Calendly script tags to avoid caching issues
    document.querySelectorAll('script[src*="calendly.com/assets/external/widget"]').forEach(s => s.remove());

    // Create and load script with cache-busting to avoid browser caching issues
    const script = document.createElement('script');
    script.src = `https://assets.calendly.com/assets/external/widget.js?v=${Date.now()}`;
    script.async = true;

    // Use both onload callback and polling for robustness
    const checkCalendly = setInterval(() => {
      if (window.Calendly) {
        setScriptLoaded(true);
        clearInterval(checkCalendly);
      }
    }, 100);

    script.onload = () => {
      // Give it a moment after load event
      setTimeout(() => {
        if (window.Calendly) {
          setScriptLoaded(true);
          clearInterval(checkCalendly);
        }
      }, 100);
    };

    script.onerror = () => {
      console.error('Failed to load Calendly widget script');
      clearInterval(checkCalendly);
    };

    // Append to body instead of head for better execution
    document.body.appendChild(script);

    // Clean up interval after 15 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkCalendly);
      if (!window.Calendly) {
        console.error('Calendly script timeout - window.Calendly not available');
      }
    }, 15000);

    return () => {
      clearInterval(checkCalendly);
      clearTimeout(timeout);
    };
  }, []);

  // Initialize widget when script is loaded and container is ready
  useEffect(() => {
    if (!scriptLoaded || !window.Calendly || !containerRef.current || !schedulingUrl) {
      return;
    }

    // Prevent re-initialization
    if (widgetInitializedRef.current) {
      return;
    }

    widgetInitializedRef.current = true;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Initialize inline widget
    window.Calendly.initInlineWidget({
      url: buildEmbedUrl(),
      parentElement: containerRef.current,
      prefill: {
        name: prefillData.name || '',
        email: prefillData.email || '',
      },
    });
  }, [scriptLoaded, schedulingUrl, buildEmbedUrl, prefillData]);

  if (!schedulingUrl) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
        <p className="text-amber-800">Scheduling is not properly configured.</p>
      </div>
    );
  }

  return (
    <div className="calendly-embed-container">
      <div
        ref={containerRef}
        className="calendly-inline-widget"
        style={{
          minWidth: '320px',
          height: '700px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
