import React, { useState, useEffect } from 'react';
import styles from './AdminPage.module.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [formData, setFormData] = useState({
    semester: 'S1',
    type: 'cours',
    subject: '',
    year: '',
    pdf: null
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterType, setFilterType] = useState('');

  const ADMIN_PASSWORD = 'admin123';

  // Debug connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing connection to:', API_BASE_URL);
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        console.log('Backend connection test:', data);
        
        // Check if Appwrite is working
        if (data.services?.storage?.provider === 'Appwrite Cloud') {
          console.log('Appwrite storage status:', data.services.storage.status);
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        setMessage('Erreur: Impossible de se connecter au serveur backend');
      }
    };
    testConnection();
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // --- Auth ---
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setAuthError('');
    setActiveTab('upload');
    setFormData({
      semester: 'S1',
      type: 'cours',
      subject: '',
      year: '',
      pdf: null
    });
    setMessage('');
    setFiles([]);
    setStats(null);
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'manage') loadFiles();
    if (isAuthenticated && activeTab === 'stats') loadStats();
    // eslint-disable-next-line
  }, [isAuthenticated, activeTab]);

  // --- API ---
  const loadFiles = async () => {
    setLoading(true);
    try {
      console.log('Loading files from:', `${API_BASE_URL}/api/admin/files`);
      const response = await fetch(`${API_BASE_URL}/api/admin/files`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Files loaded:', data.length, 'files');
      setFiles(data);
      setMessage('');
    } catch (error) {
      console.error('Error loading files:', error);
      setMessage('Erreur lors du chargement des fichiers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('Loading stats from:', `${API_BASE_URL}/api/admin/stats`);
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stats loaded:', data);
        setStats(data);
      } else {
        console.warn('Failed to load stats:', response.status);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // --- Form ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file ? {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    } : null);
    
    setFormData(prev => ({
      ...prev,
      pdf: file
    }));
  };

  // --- UPLOAD --- ENHANCED FOR APPWRITE
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any existing messages
    setMessage('');
    
    // Get the actual file from the file input element as backup
    const fileInput = document.getElementById('pdf-input');
    const selectedFile = formData.pdf || fileInput?.files[0];
    
    // Debug logging
    console.log('Form validation check:', {
      semester: formData.semester,
      type: formData.type,
      subject: formData.subject,
      year: formData.year,
      formDataPdf: formData.pdf,
      selectedFile: selectedFile,
      fileInputValue: fileInput?.value,
      fileInputFiles: fileInput?.files[0]
    });

    // Validate all fields including the file
    if (
      !formData.semester ||
      !formData.type ||
      !formData.subject.trim() ||
      !formData.year.trim() ||
      !selectedFile
    ) {
      setMessage('Veuillez remplir tous les champs et sélectionner un fichier PDF.');
      return;
    }

    // Additional file validation
    if (selectedFile.type !== 'application/pdf') {
      setMessage('Veuillez sélectionner un fichier PDF valide.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB
      setMessage('Le fichier est trop volumineux. Taille maximum: 50MB.');
      return;
    }

    if (selectedFile.size === 0) {
      setMessage('Le fichier sélectionné est vide.');
      return;
    }

    setUploading(true);
    setMessage('Upload en cours vers Appwrite...');

    const uploadData = new FormData();
    uploadData.append('semester', formData.semester.trim());
    uploadData.append('type', formData.type.trim());
    uploadData.append('subject', formData.subject.trim());
    uploadData.append('year', formData.year.trim());
    uploadData.append('pdf', selectedFile);

    // Debug FormData contents
    console.log('Uploading with data:', {
      semester: formData.semester,
      type: formData.type,
      subject: formData.subject,
      year: formData.year,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: uploadData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      console.log('Upload response status:', response.status);
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        responseData = { error: 'Réponse serveur invalide: ' + text };
      }
      
      console.log('Upload response data:', responseData);

      if (response.ok) {
        setMessage('Fichier uploadé avec succès vers Appwrite Cloud Storage!');
        
        // Reset form
        setFormData({
          semester: 'S1',
          type: 'cours',
          subject: '',
          year: '',
          pdf: null
        });
        
        // Clear file input
        if (fileInput) fileInput.value = '';
        
        // Refresh files list if on manage tab
        if (activeTab === 'manage') {
          setTimeout(loadFiles, 1000); // Small delay to ensure Appwrite has processed
        }
      } else {
        const errorMessage = responseData.error || responseData.message || 'Upload failed';
        setMessage('Erreur lors de l\'upload: ' + errorMessage);
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          fullResponse: responseData
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Erreur réseau lors de l\'upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- EDIT ---
  const startEditing = (file) => {
    setEditingFile({
      ...file,
      originalName: file.originalName,
      semester: file.semester?.name || '',
      type: file.type?.name || '',
      subject: file.subject?.name || '',
      year: String(file.year?.year || '')
    });
  };

  const cancelEditing = () => setEditingFile(null);

  const saveEdit = async () => {
    if (!editingFile) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/${editingFile._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          originalName: editingFile.originalName.trim(),
          semester: editingFile.semester.trim(),
          type: editingFile.type.trim(),
          subject: editingFile.subject.trim(),
          year: editingFile.year.trim()
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Fichier mis à jour avec succès!');
        setEditingFile(null);
        loadFiles();
      } else {
        setMessage('Erreur lors de la mise à jour: ' + (data.error || data.message || 'Update failed'));
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage('Erreur lors de la mise à jour: ' + error.message);
    }
  };

  // --- DELETE ---
  const confirmDelete = (file) => setDeleteConfirm(file);
  const cancelDelete = () => setDeleteConfirm(null);

  const deleteFile = async () => {
    if (!deleteConfirm) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/${deleteConfirm._id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Fichier supprimé avec succès d\'Appwrite et de la base de données!');
        setDeleteConfirm(null);
        loadFiles();
        if (activeTab === 'stats') loadStats();
      } else {
        setMessage('Erreur lors de la suppression: ' + (data.error || data.message || 'Delete failed'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Erreur lors de la suppression: ' + error.message);
    }
  };

  // --- FILTERS ---
  const filteredFiles = files.filter(file => {
    if (!file) return false;
    
    const matchesSearch = (
      (file.originalName && file.originalName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.subject?.name && file.subject.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchesSemester = !filterSemester || file.semester?.name === filterSemester;
    const matchesType = !filterType || file.type?.name === filterType;
    
    return matchesSearch && matchesSemester && matchesType;
  });

  // --- UTILS ---
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin(e);
  };

  // --- VIEW FILE HELPER ---
  const openFileInNewTab = (file) => {
    const viewUrl = `${API_BASE_URL}/api/files/${file._id}/view`;
    console.log('Opening file:', viewUrl);
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  // --- RENDER ---
  if (!isAuthenticated) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginContainer}>
          <div className={styles.lockIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="7" r="4"/>
              <path d="M12 1v6"/>
            </svg>
          </div>
          <div>
            <h2 className={`${styles.loginTitle} ${styles.h1}`}>Accès Administrateur</h2>
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
          <button onClick={handleLogin} className={styles.loginButton} type="button">
            Se connecter
          </button>
          {authError && (
            <div className={styles.loginError}>{authError}</div>
          )}
          <div className={styles.loginDecorationTop}></div>
          <div className={styles.loginDecorationBottom}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminContainer}>
        <div className={styles.adminHeader}>
          <h1 className={`${styles.adminTitle} ${styles.h1}`}>
            Administration - Gestion des Fichiers (Appwrite Storage)
          </h1>
          <button onClick={handleLogout} className={styles.logoutButton} type="button">
            Déconnexion
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabButton} ${activeTab === 'upload' ? styles.active : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📤 Upload vers Appwrite
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'manage' ? styles.active : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            📁 Gérer les Fichiers
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistiques
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div>
            <div className={styles.uploadInfo}>
              <p>🚀 Fichiers stockés dans Appwrite Cloud Storage pour une performance optimale</p>
            </div>
            <form onSubmit={handleSubmit} className={styles.uploadForm}>
              <div className={styles.formGroup}>
                <label htmlFor="semester">Semestre</label>
                <select id="semester" name="semester" value={formData.semester} onChange={handleInputChange} required>
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                  <option value="S3">Semestre 3</option>
                  <option value="S4">Semestre 4</option>
                  <option value="S5">Semestre 5</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="type">Type</label>
                <select id="type" name="type" value={formData.type} onChange={handleInputChange} required>
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
                <label htmlFor="pdf-input">Fichier PDF (Max 50MB)</label>
                <input
                  id="pdf-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                {formData.pdf && (
                  <div className={styles.fileInfo}>
                    ✅ Fichier sélectionné: {formData.pdf.name} ({formatFileSize(formData.pdf.size)})
                  </div>
                )}
              </div>
              <button type="submit" disabled={uploading} className={styles.submitButton}>
                {uploading ? '⏳ Upload vers Appwrite en cours...' : '🚀 Uploader vers Appwrite Cloud'}
              </button>
            </form>
          </div>
        )}

        {/* Manage Files Tab */}
        {activeTab === 'manage' && (
          <div className={styles.manageSection}>
            <div className={styles.filtersSection}>
              <div className={styles.searchGroup}>
                <input
                  type="text"
                  placeholder="Rechercher par nom de fichier ou matière..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className={styles.filterSelect}>
                  <option value="">Tous les semestres</option>
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                  <option value="S3">Semestre 3</option>
                  <option value="S4">Semestre 4</option>
                  <option value="S5">Semestre 5</option>
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.filterSelect}>
                  <option value="">Tous les types</option>
                  <option value="cours">Cours</option>
                  <option value="tp">Travaux Pratiques</option>
                  <option value="td">Travaux Dirigés</option>
                  <option value="devoirs">Devoirs</option>
                  <option value="compositions">Compositions</option>
                  <option value="ratrapages">Rattrapages</option>
                </select>
              </div>
              <button onClick={loadFiles} className={styles.refreshButton} disabled={loading}>
                {loading ? '⏳' : '🔄'} Actualiser
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}>⏳ Chargement depuis Appwrite...</div>
            ) : (
              <div className={styles.filesTable}>
                {filteredFiles.length === 0 ? (
                  <div className={styles.noFiles}>
                    {files.length === 0 ? 'Aucun fichier dans Appwrite' : 'Aucun fichier trouvé avec ces filtres'}
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Nom du Fichier</th>
                        <th>Semestre</th>
                        <th>Type</th>
                        <th>Matière</th>
                        <th>Année</th>
                        <th>Taille</th>
                        <th>Date</th>
                        <th>Stockage</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => (
                        <tr key={file._id}>
                          <td>
                            {editingFile && editingFile._id === file._id ? (
                              <input
                                type="text"
                                value={editingFile.originalName}
                                onChange={(e) => setEditingFile({
                                  ...editingFile,
                                  originalName: e.target.value
                                })}
                                className={styles.editInput}
                              />
                            ) : (
                              <span title={file.originalName}>{file.originalName}</span>
                            )}
                          </td>
                          <td>
                            {editingFile && editingFile._id === file._id ? (
                              <select
                                value={editingFile.semester}
                                onChange={(e) => setEditingFile({
                                  ...editingFile,
                                  semester: e.target.value
                                })}
                                className={styles.editSelect}
                              >
                                <option value="S1">S1</option>
                                <option value="S2">S2</option>
                                <option value="S3">S3</option>
                                <option value="S4">S4</option>
                                <option value="S5">S5</option>
                              </select>
                            ) : (
                              <span>{file.semester?.displayName || file.semester?.name}</span>
                            )}
                          </td>
                          <td>
                            {editingFile && editingFile._id === file._id ? (
                              <select
                                value={editingFile.type}
                                onChange={(e) => setEditingFile({
                                  ...editingFile,
                                  type: e.target.value
                                })}
                                className={styles.editSelect}
                              >
                                <option value="cours">cours</option>
                                <option value="tp">tp</option>
                                <option value="td">td</option>
                                <option value="devoirs">devoirs</option>
                                <option value="compositions">compositions</option>
                                <option value="ratrapages">ratrapages</option>
                              </select>
                            ) : (
                              <span>{file.type?.displayName || file.type?.name}</span>
                            )}
                          </td>
                          <td>
                            {editingFile && editingFile._id === file._id ? (
                              <input
                                type="text"
                                value={editingFile.subject}
                                onChange={(e) => setEditingFile({
                                  ...editingFile,
                                  subject: e.target.value
                                })}
                                className={styles.editInput}
                              />
                            ) : (
                              <span>{file.subject?.name}</span>
                            )}
                          </td>
                          <td>
                            {editingFile && editingFile._id === file._id ? (
                              <input
                                type="text"
                                value={editingFile.year}
                                onChange={(e) => setEditingFile({
                                  ...editingFile,
                                  year: e.target.value
                                })}
                                className={styles.editInput}
                              />
                            ) : (
                              <span>{file.year?.year}</span>
                            )}
                          </td>
                          <td>{formatFileSize(file.fileSize)}</td>
                          <td>{formatDate(file.uploadedAt)}</td>
                          <td>
                            <span className={styles.storageBadge}>
                              {file.storageProvider === 'appwrite' ? '☁️ Appwrite' : '🗄️ Local'}
                            </span>
                          </td>
                          <td className={styles.actions}>
                            {editingFile && editingFile._id === file._id ? (
                              <>
                                <button onClick={saveEdit} className={styles.saveButton} title="Sauvegarder">💾</button>
                                <button onClick={cancelEditing} className={styles.cancelButton} title="Annuler">❌</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditing(file)} className={styles.editButton} title="Modifier">✏️</button>
                                <button 
                                  onClick={() => openFileInNewTab(file)} 
                                  className={styles.viewButton} 
                                  title="Voir le PDF"
                                >
                                  👁️
                                </button>
                                <button onClick={() => confirmDelete(file)} className={styles.deleteButton} title="Supprimer">🗑️</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className={styles.statsSection}>
            {stats ? (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>📁 Total Fichiers</h3>
                  <div className={styles.statNumber}>{stats.overview?.totalFiles || 0}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>📚 Semestres</h3>
                  <div className={styles.statNumber}>{stats.overview?.totalSemesters || 0}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>📖 Matières</h3>
                  <div className={styles.statNumber}>{stats.overview?.totalSubjects || 0}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>💾 Taille Totale</h3>
                  <div className={styles.statNumber}>{stats.overview?.totalSizeFormatted || '0 Bytes'}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>☁️ Fichiers Appwrite</h3>
                  <div className={styles.statNumber}>{stats.overview?.appwriteFiles || 0}</div>
                  <div className={styles.statSubtext}>{stats.overview?.appwriteSizeFormatted || '0 Bytes'}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>🗂️ Stockage</h3>
                  <div className={styles.statText}>{stats.storageProvider || 'Appwrite Cloud'}</div>
                </div>
                {stats.filesByType && stats.filesByType.length > 0 && (
                  <div className={`${styles.statCard} ${styles.fullWidth}`}>
                    <h3>📊 Fichiers par Type</h3>
                    <div className={styles.typeStats}>
                      {stats.filesByType.map((type) => (
                        <div key={type._id} className={styles.typeStatItem}>
                          <span>{type._id}:</span>
                          <span>{type.count} ({type.totalSizeFormatted})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {stats.recentUploads && stats.recentUploads.length > 0 && (
                  <div className={`${styles.statCard} ${styles.fullWidth}`}>
                    <h3>📅 Uploads Récents</h3>
                    <div className={styles.recentList}>
                      {stats.recentUploads.slice(0, 5).map((file) => (
                        <div key={file._id} className={styles.recentItem}>
                          <span className={styles.recentName}>{file.originalName}</span>
                          <span className={styles.recentSize}>{file.fileSizeFormatted}</span>
                          <span className={styles.recentDate}>{formatDate(file.uploadedAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.loading}>⏳ Chargement des statistiques Appwrite...</div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>⚠️ Confirmer la suppression</h3>
              <p>Êtes-vous sûr de vouloir supprimer le fichier "<strong>{deleteConfirm.originalName}</strong>" ?</p>
              <div className={styles.deleteWarning}>
                <p>🗑️ Cette action supprimera définitivement :</p>
                <ul>
                  <li>Le fichier depuis Appwrite Cloud Storage</li>
                  <li>Les métadonnées de la base de données</li>
                </ul>
                <p><strong>Cette action est irréversible!</strong></p>
              </div>
              <div className={styles.modalActions}>
                <button onClick={deleteFile} className={styles.deleteConfirmButton}>
                  🗑️ Oui, Supprimer Définitivement
                </button>
                <button onClick={cancelDelete} className={styles.cancelButton}>
                  ❌ Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={message.includes('succès') ? styles.successMessage : styles.errorMessage}>
            {message}
            <button 
              onClick={() => setMessage('')} 
              className={styles.closeMessage}
              title="Fermer"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};