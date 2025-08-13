import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { TypesPage } from './pages/TypesPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { YearsPage } from './pages/YearsPage';
import { FilesPage } from './pages/FilesPage';
import { AdminPage } from './pages/AdminPage';

import './App.css';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <div className="page-wrapper">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/semester/:semesterId/types" element={<TypesPage />} />
              <Route path="/semester/:semesterId/type/:typeId/subjects" element={<SubjectsPage />} />
              <Route path="/semester/:semesterId/type/:typeId/subject/:subjectId/years" element={<YearsPage />} />
              <Route path="/year/:yearId/files" element={<FilesPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;