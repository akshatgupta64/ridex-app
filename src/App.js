import React, { Suspense } from 'react';
import './App.css';
import { DataProvider } from './Context/Context';
import { AuthProvider } from './Context/AuthContext';
import AuthModal from './Components/Auth/AuthModal';
import Navbar from './Components/Navbar/Navbar';
import ErrorBoundary from './Components/ErrorBoundary/ErrorBoundary';
import NotFound from './Components/NotFound/NotFound';
import { Routes, Route } from 'react-router-dom';
import ClipLoader from "react-spinners/ClipLoader";

const Home = React.lazy(() => import('./Components/Home/Home'));
const About = React.lazy(() => import('./Components/About/About'));
const Careers = React.lazy(() => import('./Components/Carrers/Careers'));
const Safety = React.lazy(() => import('./Components/Safety/Safety'));
const Contact = React.lazy(() => import('./Components/Contact/Contact'));
const BookingApp = React.lazy(() => import('./Components/Booking/BookingApp'));
const SystemDesign = React.lazy(() => import('./Components/SystemDesign/SystemDesign'));

function App() {
  const loader = (
    <div className='suspense'>
      <ClipLoader color={"#f9c935"} aria-label="Loading Spinner" data-testid="loader" />
    </div>
  );

  return (
    <div>
      <ErrorBoundary>
        <AuthProvider>
          <DataProvider>
            <Navbar />
            <AuthModal />
            <Routes>
            <Route path="/" element={<Suspense fallback={loader}><Home /></Suspense>} />
            <Route path="/book" element={<Suspense fallback={loader}><BookingApp initialTab="book" /></Suspense>} />
            <Route path="/carpool" element={<Suspense fallback={loader}><BookingApp initialTab="carpool" /></Suspense>} />
            <Route path="/parcel" element={<Suspense fallback={loader}><BookingApp initialTab="parcel" /></Suspense>} />
            <Route path="/rides" element={<Suspense fallback={loader}><BookingApp initialTab="rides" /></Suspense>} />
            <Route path="/wallet" element={<Suspense fallback={loader}><BookingApp initialTab="wallet" /></Suspense>} />
            <Route path="/safety-toolkit" element={<Suspense fallback={loader}><BookingApp initialTab="safety" /></Suspense>} />
            <Route path="/system-design" element={<Suspense fallback={loader}><SystemDesign /></Suspense>} />
            <Route path="/about" element={<Suspense fallback={loader}><About /></Suspense>} />
            <Route path="/safety" element={<Suspense fallback={loader}><Safety /></Suspense>} />
            <Route path="/careers" element={<Suspense fallback={loader}><Careers /></Suspense>} />
            <Route path="/contact" element={<Suspense fallback={loader}><Contact /></Suspense>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
