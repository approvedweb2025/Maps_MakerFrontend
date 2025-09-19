import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserProvider } from './Context/UserContext.jsx';
import { MapProvider } from './Context/MapContext.jsx';

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="1095880633623-6qk34obmap23cta2vrhoim29bfmi6tg9.apps.googleusercontent.com">

    <MapProvider>
      <UserProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UserProvider>
    </MapProvider>
  </GoogleOAuthProvider>
);
