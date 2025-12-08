import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../../hooks/useSocket';

const createCustomIcon = (severity, isNew = false) => {
  const colors = {
    critical: '#ff0033',
    high: '#ff6600',
    medium: '#ffcc00',
    low: '#00ff99'
  };

  const color = colors[severity?.toLowerCase()] || colors.low;

  return L.divIcon({
    className: 'attack-marker',
    html: `
      <div class="marker-container">
        ${isNew ? '<div class="attack-burst"></div>' : ''}
        <div class="pulse ${isNew ? 'new-attack' : ''}" style="border-color: ${color}; box-shadow: 0 0 20px ${color}, 0 0 10px ${color};">
          <div class="inner-glow" style="background: ${color};"></div>
        </div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  
  return null;
};

export default function GeoMap({ logs = [] }) {
  const socket = useSocket();
  const [center, setCenter] = useState([20, 0]);
  const [zoom, setZoom] = useState(2);
  const [realtimeMarkers, setRealtimeMarkers] = useState([]);

  const mapLogs = React.useMemo(() => {
    return logs
      .filter(log => log.metadata?.geo_location?.lat && log.metadata?.geo_location?.lon)
      .map((log, index) => ({
        id: log._id || log.log_id || `log-${index}`,
        lat: log.metadata.geo_location.lat,
        lon: log.metadata.geo_location.lon,
        country: log.metadata.geo_location.country || 'Unknown',
        city: log.metadata.geo_location.city || 'Unknown',
        source_ip: log.source_ip,
        event_type: log.event_type || log.attack_type,
        severity: log.severity || 'low',
        timestamp: log.timestamp || log.created_at || new Date(),
        isNew: false
      }));
  }, [logs]);

  const allMarkers = React.useMemo(() => {
    return [...realtimeMarkers, ...mapLogs].slice(0, 500);
  }, [realtimeMarkers, mapLogs]);

  useEffect(() => {
    if (!socket) return;

    const handleNewLog = (log) => {
      if (log.metadata?.geo_location?.lat && log.metadata?.geo_location?.lon) {
        const newMarker = {
          id: log.log_id || `realtime-${Date.now()}`,
          lat: log.metadata.geo_location.lat,
          lon: log.metadata.geo_location.lon,
          country: log.metadata.geo_location.country || 'Unknown',
          city: log.metadata.geo_location.city || 'Unknown',
          source_ip: log.source_ip,
          event_type: log.event_type || log.attack_type,
          severity: log.severity || 'low',
          timestamp: new Date(),
          isNew: true
        };

        setRealtimeMarkers(prev => [newMarker, ...prev].slice(0, 100));

        if (log.severity?.toLowerCase() === 'critical') {
          setCenter([newMarker.lat, newMarker.lon]);
          setZoom(6);
          setTimeout(() => setZoom(2), 3000);
        }
      }
    };

    socket.on('log:new', handleNewLog);

    return () => {
      if (socket?.off) {
        socket.off('log:new', handleNewLog);
      }
    };
  }, [socket]);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ff0033',
      high: '#ff6600',
      medium: '#ffcc00',
      low: '#00ff99'
    };
    return colors[severity?.toLowerCase()] || colors.low;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/10">
      <style>{`
        .map-container-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 15px rgba(255, 0, 51, 0.4));
        }

        .leaflet-container {
          background: #0a0f1a;
          font-family: 'Roboto Mono', monospace;
        }
        
        .leaflet-tile-pane {
          opacity: 0.8;
        }

        .map-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 0, 51, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 0, 51, 0.08) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 400;
        }

        .attack-marker {
          background: transparent;
        }

        .marker-container {
          position: relative;
          width: 20px;
          height: 20px;
        }

        .pulse {
          position: absolute;
          width: 14px;
          height: 14px;
          border: 3px solid;
          border-radius: 50%;
          background: transparent;
          animation: pulseAnim 1.5s infinite ease-in-out;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .pulse.new-attack {
          animation: pulseAnim 1.5s infinite ease-in-out, criticalPulse 2s infinite;
        }

        .inner-glow {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.8;
        }

        @keyframes pulseAnim {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.9; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.9; }
        }

        @keyframes criticalPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.8); }
        }

        .attack-burst {
          position: absolute;
          width: 20px;
          height: 20px;
          background: rgba(255, 0, 51, 0.4);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: burst 0.8s ease-out forwards;
          pointer-events: none;
        }

        @keyframes burst {
          from { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
          to { transform: translate(-50%, -50%) scale(5); opacity: 0; }
        }
        
        .leaflet-control-attribution {
          display: none;
        }
        
        .leaflet-control-zoom {
          border: 1px solid rgba(255, 0, 51, 0.4) !important;
          background: rgba(0, 0, 0, 0.9) !important;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 20px rgba(255, 0, 51, 0.3);
        }
        
        .leaflet-control-zoom a {
          background: rgba(255, 0, 51, 0.1) !important;
          color: #ff0033 !important;
          border: 1px solid rgba(255, 0, 51, 0.3) !important;
          font-family: 'Orbitron', sans-serif;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255, 0, 51, 0.8);
        }
        
        .leaflet-control-zoom a:hover {
          background: rgba(255, 0, 51, 0.3) !important;
          box-shadow: 0 0 15px rgba(255, 0, 51, 0.6);
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(0, 0, 0, 0.98) !important;
          border: 1px solid rgba(255, 0, 51, 0.5);
          border-radius: 8px;
          box-shadow: 0 0 30px rgba(255, 0, 51, 0.4), inset 0 0 20px rgba(255, 0, 51, 0.05);
          backdrop-filter: blur(15px);
        }
        
        .leaflet-popup-content {
          margin: 0;
          font-family: 'Roboto Mono', monospace;
          font-size: 12px;
          color: #e5e7eb;
        }
        
        .leaflet-popup-tip {
          background: rgba(0, 0, 0, 0.98) !important;
          border: 1px solid rgba(255, 0, 51, 0.5);
        }
        
        .marker-cluster {
          background: rgba(255, 0, 51, 0.4) !important;
          border: 2px solid #ff0033 !important;
          box-shadow: 0 0 25px rgba(255, 0, 51, 0.8), inset 0 0 15px rgba(255, 0, 51, 0.3);
        }
        
        .marker-cluster div {
          background: rgba(255, 0, 51, 0.7) !important;
          color: white !important;
          font-family: 'Orbitron', sans-serif;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        }
      `}</style>

      <div className="map-container-wrapper">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <MapUpdater center={center} zoom={zoom} />
          
          <TileLayer
            url="https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
            attribution="&copy; CartoDB"
            maxZoom={20}
          />

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
            {allMarkers.map((log) => (
              <Marker
                key={log.id}
                position={[log.lat, log.lon]}
                icon={createCustomIcon(log.severity, log.isNew)}
              >
              <Popup>
                <div className="p-3 min-w-[220px]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-500/30">
                    <span className="text-xs font-['Orbitron'] text-red-400 uppercase tracking-wider">
                      Attack Detected
                    </span>
                    <div 
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{
                        background: `${getSeverityColor(log.severity)}20`,
                        color: getSeverityColor(log.severity),
                        border: `1px solid ${getSeverityColor(log.severity)}60`
                      }}
                    >
                      {log.severity}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">
                        Source IP
                      </div>
                      <div className="text-sm font-['Roboto_Mono'] text-cyan-400 font-bold">
                        {log.source_ip}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">
                          Country
                        </div>
                        <div className="text-xs font-['Roboto_Mono'] text-gray-300">
                          {log.country}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">
                          City
                        </div>
                        <div className="text-xs font-['Roboto_Mono'] text-gray-300">
                          {log.city}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">
                        Attack Type
                      </div>
                      <div className="text-xs font-['Roboto_Mono'] text-orange-400">
                        {log.event_type?.replace(/_/g, ' ').toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">
                        Timestamp
                      </div>
                      <div className="text-[10px] font-['Roboto_Mono'] text-gray-400">
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  {log.isNew && (
                    <div className="mt-3 pt-2 border-t border-red-500/30">
                      <div className="text-[9px] text-red-400 uppercase tracking-wider animate-pulse">
                        ⚡ Live Attack
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Cyber Grid Overlay */}
      <div className="map-grid-overlay"></div>

      {/* Map Stats Overlay */}
      <div className="absolute top-4 left-4 z-1000 bg-black/90 backdrop-blur-md border border-red-500/40 rounded-lg p-3 min-w-[180px] shadow-[0_0_20px_rgba(255,0,51,0.3)]">
        <div className="text-xs font-['Orbitron'] text-red-400 uppercase tracking-wider mb-2">
          Live Attack Map
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Total Attacks:</span>
            <span className="text-xs font-['Roboto_Mono'] text-cyan-400 font-bold">
              {allMarkers.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Critical:</span>
            <span className="text-xs font-['Roboto_Mono'] text-red-400 font-bold">
              {allMarkers.filter(l => l.severity === 'critical').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">High:</span>
            <span className="text-xs font-['Roboto_Mono'] text-orange-400 font-bold">
              {allMarkers.filter(l => l.severity === 'high').length}
            </span>
          </div>
        </div>
      </div>

      {/* Severity Legend */}
      <div className="absolute bottom-4 left-4 z-1000 bg-black/90 backdrop-blur-md border border-red-500/40 rounded-lg p-3 shadow-[0_0_20px_rgba(255,0,51,0.3)]">
        <div className="text-xs font-['Orbitron'] text-red-400 uppercase tracking-wider mb-2">
          Threat Level
        </div>
        <div className="space-y-1.5">
          {['critical', 'high', 'medium', 'low'].map(severity => (
            <div key={severity} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border"
                style={{ 
                  background: getSeverityColor(severity),
                  borderColor: getSeverityColor(severity),
                  boxShadow: `0 0 12px ${getSeverityColor(severity)}`
                }}
              />
              <span className="text-[10px] text-gray-400 uppercase font-['Roboto_Mono']">
                {severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
}
