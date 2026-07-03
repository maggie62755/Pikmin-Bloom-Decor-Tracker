import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { PikminProvider } from './context/PikminContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Tracker from './pages/Tracker';
import Dashboard from './pages/Dashboard';
import Footer from './components/shared/footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import GlobalToast from './components/shared/GlobalToast';
import ScrollToTop from './components/shared/ScrollToTop';

// Layout Component
const Layout = () => {
    return (
        <div className="min-h-screen text-journal-ink selection:bg-brand-primary/20">
            <Navigation />
            {/* pt-28: 頂部導覽列空間, pb-24 md:pb-8: 手機底部 Tab Bar + 電腦無底部 Tab */}
            <main className="pt-28 pb-24 md:pb-8 px-4 md:px-6">
                <Outlet />
            </main>
            <Footer />
            <GlobalToast />
        </div>
    );
};

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
