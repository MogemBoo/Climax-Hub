import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Details from "./Details";
import Details from './fakeDetails.jsx';
import YourProfile from './YourProfile.jsx';
import Community from './Community.jsx';
import Admin from './Admin.jsx';
import Genre from './Genre.jsx';
import Episodes from './Episodes.jsx';
import SearchResult from './SearchResult.jsx';


import './index.css';
import HomePage from './Home.jsx';
import TopMovies from './TopMovie.jsx';
import Layout from './Layout.jsx';
import GetAll from './GetAll.jsx';
import Login from './fakeLogin.jsx';
import TopSeries from './TopSeries.jsx';
import YourWatchlist from './YourWatchlist.jsx';
import YourRatings from './YourRating.jsx';
import ScrollToTop from './ScrollToTop.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/top-movies" element={<TopMovies />} />
        <Route path="/top-series" element={<TopSeries />} />
        <Route path="/your-profile" element={<YourProfile />} />
        <Route path="/get-all" element={<GetAll />} />
        <Route path="/details/:type/:id" element={<Details />} />
        <Route path="/login" element={<Login />} />
        <Route path="/movies/:id" element={<Details />} />
        <Route path="/community" element={<Community />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/genre/:genre" element={<Genre />} />
        <Route path="/your-watchlist" element={<YourWatchlist />} />
        <Route path="/your-ratings" element={<YourRatings />} />
        <Route path="/series/:id/episodes" element={<Episodes />} />
        <Route path="/search" element={<SearchResult />} />
        

        </Route>
      </Routes>
    </Router>
  </StrictMode>
);
