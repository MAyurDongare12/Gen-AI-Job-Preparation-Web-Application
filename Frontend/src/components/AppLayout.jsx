import React from 'react';
import { Outlet } from 'react-router';
import Navbar from './Navbar';

const AppLayout = () => {
    return (
        <div className="app-shell">
            <Navbar />
            <main className="app-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
