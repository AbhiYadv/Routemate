# Corporate Commute Connect MVP

## Google Maps API Key Rotation
The application uses Google Maps for live tracking, route polyline drawing, and discovering nearby rides. 
Currently, a demo API key is injected via environment variables.

### Before production, rotate and restrict the Google Maps API key:
1. Create a new key in Google Cloud Console.
2. Restrict the new key by domain/package and enabled APIs (Maps JavaScript API, Maps SDK for Android/iOS, Directions API, etc.).
3. Update the environment variables in both `backend/.env` (`GOOGLE_MAPS_API_KEY`) and `frontend/.env` (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`).
4. Redeploy the app.
5. Disable the old key after validating that the new one works perfectly in production.
6. Use separate keys for dev/staging/prod environments.
