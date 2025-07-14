import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Details from "./Details";
// import Details from '../../../.gitignore/fakeDetails.jsx';
import YourProfile from './YourProfile.jsx';



import './index.css';
import HomePage from './Home.jsx';
import TopMovies from './TopMovie.jsx';
import GetAll from './GetAll.jsx';
import Login from './fakeLogin.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/top-movies" element={<TopMovies />} />
        <Route path="/your-profile" element={<YourProfile />} />
        <Route path="/get-all" element={<GetAll />} />
        <Route path="/details/:type/:id" element={<Details />} />
        <Route path="/login" element={<Login />} />

      </Routes>
    </Router>
  </StrictMode>
);
