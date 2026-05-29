# RouteMate MVP

## Overview
RouteMate is a verified commute network tailored for enterprise teams. It enables coworkers to securely discover trusted rides, view robust "Route Transparency" (such as expected detours, stops, and ETAs) before booking, connect natively with verified poolers, and provides employers an Admin dashboard to track commute savings, rewards, and CO2 emissions.

---

## Client Demo Flow Script

Follow this script to successfully demonstrate the full capabilities of RouteMate V1.

### 1. The Employee & Rider Journey
1. **Launch App**: Open the RouteMate app. Notice the premium branding on the "Get Started" screen. 
2. **Login**: Tap "View Demo Credentials" to autofill the employee credentials (`ananya@nexora.com` / `password123`) and log in.
3. **Home Screen**: Show the animated green car hero, designed to mimic a top-tier ride app. 
4. **Location Search**: Tap the "Leaving from" input. Notice how a full-screen native modal slides up with auto-completed location suggestions. 
5. **Search Results**: Tap "Search Rides". The map preview at the top will dynamically render the exact requested polyline from origin to destination, dropping markers for any active, overlapping rides.
6. **Route Transparency (Ride Details)**: Tap "View Details" on Arjun's ride. Scroll through the "Planned Route Sequence" to see precisely how many detours/stops occur *before* dropping Ananya off. Explain the privacy controls (names/addresses are locked).
7. **AI Ride Assistant**: Tap the purple "Ask AI" banner. Select a suggested question like "How much detour?". See how the AI natively pulls the data.
8. **Communication**: Tap the Call button on the Ride Details page to demonstrate the secure in-app phone overlay.
9. **Booking & My Rides**: Book the seat! Navigate to the "Rides" tab on the bottom nav to see the confirmed ride status.
10. **Live Map**: Tap the "Live Map" tab. Approve location permissions. Toggle seamlessly between "Rides" and "Poolers" to see the map dynamically swap data and bottom-sheet UI.
11. **Profile & Security**: Open the "Profile" tab to show the "Verified Nexora Employee" badge. Tap "Logout" to properly clear the session.

### 2. The Admin Dashboard
1. **Login as Admin**: Use the credentials `meera@nexora.com` / `password123`.
2. **Dashboard Review**: You'll be logged directly into the `Company Admin` view.
3. **Enterprise Benefits**: Show the KPI blocks tracking "Completed Rides", "Active Poolers", "CO2 Saved", and "Cost Saved".
4. **Rewards & Fuel Vouchers**: Scroll down to the Fuel Voucher Queue showing eligible poolers earning ₹1200 based on their safe, shared trips. Explain how this builds trust and scales corporate carpooling!

---

## Google Maps API Setup & Key Rotation
RouteMate uses the real Google Maps SDK and Directions API.

**To rotate keys securely for a production deployment:**
1. Navigate to Google Cloud Console.
2. Generate a new API Key.
3. **Critically Restrict** the key: Bind it *only* to your production domain or specific Android/iOS App package signatures. Restrict the API usage to Maps JavaScript API, Maps SDK for Android/iOS.
4. Update the environment variables:
   - For backend: `GOOGLE_MAPS_API_KEY` in `backend/.env`
   - For frontend: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `frontend/.env`
5. Restart the backend and trigger an Expo rebuild.
6. Once validated, delete the old key entirely.

---

## Technical Information
**What is Real vs Mocked:**
- **Real:** Auth/JWT sessions, database relationships (company boundaries, visibility rules), real-time booking decrements, map logic, location permission tracking, and route sequence arrays.
- **Mocked/Simulated:** The VoIP Call screen is a UI simulation. The AI chat utilizes a static rule-based engine parsing live database values (instead of hitting an external LLM). 

**Future Production Improvements:**
- Transition the `location/update` polling into a robust WebSocket/Rust microservice for high-frequency GPS fanout.
- Add physical payout integration for the Fuel Vouchers (Stripe/Razorpay).
- Implement the 'Partner Network' cross-company logic.
