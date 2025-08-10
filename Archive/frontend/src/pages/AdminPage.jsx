import React, { useState } from 'react';
import styles from './AdminPage.module.css';

export const AdminPage = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Your existing form state
  const [formData, setFormData] = useState({
    semester: 'S1',
    type: 'cours',
    subject: '',
    year: '',
    pdf: null
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Password configuration - change this to your desired password
  const ADMIN_PASSWORD = 'admin123';

  // Authentication handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      setPassword('');
    } else {
      setAuthError('Mot de passe incorrect');
      setPassword('');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setAuthError('');
    // Reset form data on logout
    setFormData({
      semester: 'S1',
      type: 'cours',
      subject: '',
      year: '',
      pdf: null
    });
    setMessage('');
  };

  // Your existing handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      pdf: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pdf) {
      setMessage('Veuillez sélectionner un fichier PDF');
      return;
    }

    setUploading(true);
    setMessage('');

    const uploadData = new FormData();
    uploadData.append('semester', formData.semester);
    uploadData.append('type', formData.type);
    uploadData.append('subject', formData.subject);
    uploadData.append('year', formData.year);
    uploadData.append('pdf', formData.pdf);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: uploadData
      });
      
      if (response.ok) {
        setMessage('Fichier uploadé avec succès!');
        setFormData({
          semester: 'S1',
          type: 'cours',
          subject: '',
          year: '',
          pdf: null
        });
        // Reset file input
        const fileInput = document.getElementById('pdf-input');
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setMessage('Erreur lors de l\'upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle Enter key for login
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };

  // Render login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginContainer}>
          {/* Lock icon */}
          <div className={styles.lockIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="7" r="4"/>
              <path d="M12 1v6"/>
            </svg>
          </div>
          
          <div>
            <h2 className={`${styles.loginTitle} ${styles.h1}`}>
              Accès Administrateur
            </h2>
            <p className={styles.loginSubtitle}>
              Entrez votre mot de passe pour accéder au panneau d'administration
            </p>
          </div>

          <div className={styles.loginInputContainer}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mot de passe"
              className={styles.loginInput}
              autoFocus
              required
            />
          </div>
          
          <button 
            onClick={handleLogin}
            className={styles.loginButton}
            type="button"
          >
            Se connecter
          </button>

          {authError && (
            <div className={styles.loginError}>
              {authError}
            </div>
          )}

          {/* Decorative elements */}
          <div className={styles.loginDecorationTop}></div>
          <div className={styles.loginDecorationBottom}></div>
        </div>
      </div>
    );
  }

  // Render admin panel if authenticated
  return (
    <div className={styles.adminPage}>
      <div className={styles.adminContainer}>
        <div className={styles.adminHeader}>
          <h1 className={`${styles.adminTitle} ${styles.h1}`}>
            Administration - Upload de Fichiers
          </h1>
          <button 
            onClick={handleLogout}
            className={styles.logoutButton}
            type="button"
          >
            Déconnexion
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.uploadForm}>
          <div className={styles.formGroup}>
            <label htmlFor="semester">Semestre</label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              required
            >
              <option value="S1">Semestre 1</option>
              <option value="S2">Semestre 2</option>
              <option value="S3">Semestre 3</option>
              <option value="S4">Semestre 4</option>
              <option value="S5">Semestre 5</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="cours">Cours</option>
              <option value="tp">Travaux Pratiques</option>
              <option value="td">Travaux Dirigés</option>
              <option value="devoirs">Devoirs</option>
              <option value="compositions">Compositions</option>
              <option value="ratrapages">Rattrapages</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="subject">Matière</label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Ex: Mathématiques, Physique..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="year">Année</label>
            <input
              id="year"
              name="year"
              type="text"
              value={formData.year}
              onChange={handleInputChange}
              placeholder="Ex: 2024, 2023-2024"
              required
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label htmlFor="pdf-input">Fichier PDF</label>
            <input
              id="pdf-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            className={styles.submitButton}
          >
            {uploading ? 'Upload en cours...' : 'Uploader le fichier'}
          </button>
        </form>

        {message && (
          <div className={message.includes('succès') ? styles.successMessage : styles.errorMessage}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};