import * as Amplitude from "@amplitude/analytics-browser";

let amplitudeInstance: Amplitude.Types.BrowserClient | null = null;

export class AmplitudeService {
  static getInstance(): Amplitude.Types.BrowserClient | null {
    if (typeof window === "undefined") return null;

    if (!amplitudeInstance) {
      amplitudeInstance = Amplitude.createInstance();
      amplitudeInstance.init(
        process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY as string,
        undefined,
        {
          defaultTracking: false,
          fetchRemoteConfig: false, // ✅ stops /config request
          autocapture: {
            pageViews: false,
            sessions: false,
            attribution: false,
          },
        }
      );
    }

    return amplitudeInstance;
  }
}
