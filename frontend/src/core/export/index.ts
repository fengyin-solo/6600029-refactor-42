import type { FlightPlan, ExportOptions, Exporter } from '../types';

function exportKML(plan: FlightPlan, options: ExportOptions): string {
  const coords = plan.waypoints
    .map((w) => `            ${w.lng},${w.lat},${w.altitude}`)
    .join('\n');

  const placemarks = plan.waypoints
    .map(
      (w, i) => {
        const desc = options.includeWaypointActions !== false
          ? `<description>Alt: ${w.altitude}m, Speed: ${w.speed}m/s, Action: ${w.action}</description>`
          : '';
        return `    <Placemark>
      <name>WP${i + 1}</name>
      ${desc}
      <Point><coordinates>${w.lng},${w.lat},${w.altitude}</coordinates></Point>
    </Placemark>`;
      }
    )
    .join('\n');

  const name = options.name || plan.name;
  const description = options.description ? `<description>${options.description}</description>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${name}</name>
    ${description}
    <Placemark>
      <name>Flight Route</name>
      <LineString>
        <altitudeMode>absolute</altitudeMode>
        <coordinates>
${coords}
        </coordinates>
      </LineString>
    </Placemark>
${placemarks}
  </Document>
</kml>`;
}

function exportGeoJSON(plan: FlightPlan, _options: ExportOptions): string {
  const coordinates = plan.waypoints.map((w) => [w.lng, w.lat, w.altitude]);

  const featureCollection = {
    type: 'FeatureCollection',
    properties: {
      name: plan.name,
      totalDistance: plan.totalDistance,
      estimatedTime: plan.estimatedTime,
      batteryUsage: plan.batteryUsage,
    },
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          name: 'Flight Route',
        },
      },
      ...plan.waypoints.map((w, i) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [w.lng, w.lat, w.altitude],
        },
        properties: {
          name: `WP${i + 1}`,
          altitude: w.altitude,
          speed: w.speed,
          action: w.action,
        },
      })),
    ],
  };

  return JSON.stringify(featureCollection, null, 2);
}

function exportGPX(plan: FlightPlan, options: ExportOptions): string {
  const name = options.name || plan.name;

  const waypoints = plan.waypoints
    .map(
      (w, i) => `    <wpt lat="${w.lat}" lon="${w.lng}">
      <ele>${w.altitude}</ele>
      <name>WP${i + 1}</name>
      <speed>${w.speed}</speed>
      ${w.action !== 'none' ? `<type>${w.action}</type>` : ''}
    </wpt>`
    )
    .join('\n');

  const trackPoints = plan.waypoints
    .map((w) => `      <trkpt lat="${w.lat}" lon="${w.lng}"><ele>${w.altitude}</ele></trkpt>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="DronePlanner">
  <metadata>
    <name>${name}</name>
    <desc>Total Distance: ${plan.totalDistance.toFixed(0)}m, Estimated Time: ${plan.estimatedTime.toFixed(0)}s</desc>
  </metadata>
${waypoints}
  <trk>
    <name>${name}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

const exporters = new Map<string, (plan: FlightPlan, options: ExportOptions) => string>();
exporters.set('kml', exportKML);
exporters.set('geojson', exportGeoJSON);
exporters.set('gpx', exportGPX);

export const flightExporter: Exporter = {
  supportedFormats: [...exporters.keys()],

  export(plan: FlightPlan, options: ExportOptions): string {
    const exporter = exporters.get(options.format);
    if (!exporter) {
      throw new Error(`Unsupported export format: ${options.format}. Available: ${this.supportedFormats.join(', ')}`);
    }
    return exporter(plan, options);
  },
};

export function registerExporter(
  format: string,
  handler: (plan: FlightPlan, options: ExportOptions) => string
): void {
  exporters.set(format, handler);
  flightExporter.supportedFormats.push(format);
}
