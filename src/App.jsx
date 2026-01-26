import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { PikminProvider } from './context/PikminContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Tracker from './pages/Tracker';
import Dashboard from './pages/Dashboard';
import Footer from './components/shared/footer';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Layout Component
const Layout = () => {
    return (
        <div className="min-h-screen text-nature-earth selection:bg-brand-primary/20">
            <Navigation />
            <main className="pt-28 pb-20 px-6">
                <Outlet />
            </main>
            <Footer />

        </div>
    );
};


import ScrollToTop from './components/shared/ScrollToTop';

function App() {
    return (
        <PikminProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="tracker" element={<Tracker />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="privacy" element={<PrivacyPolicy />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </PikminProvider>
    );
}

export default App;
