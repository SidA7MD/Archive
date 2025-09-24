import React, { useState, useEffect } from 'react';
import styles from './AdminPage.module.css';

// Fixed backend URL to include https protocol
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://archive-mi73.onrender.com';

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

  // Enhanced connection test with better error handling
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing connection to:', API_BASE_URL);
        
        // Add timeout and proper error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Backend connection test successful:', data);
        
        if (data.status === 'Warning') {
          setMessage(`Avertissement: ${data.message}. Services: ${JSON.stringify(data.services)}`);
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        if (error.name === 'AbortError') {
          setMessage('Erreur: Timeout de connexion au serveur backend');
        } else {
          setMessage(`Erreur: Impossible de se connecter au serveur backend - ${error.message}`);
        }
      }
    };
    testConnection();
  }, []);

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
      const response = await fetch(`${API_BASE_URL}/api/admin/files`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error loading files:', error);
      setMessage('Erreur lors du chargement des fichiers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
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
    console.log('File selected:', file);
    setFormData(prev => ({
      ...prev,
      pdf: file
    }));
  };

  // --- ENHANCED UPLOAD ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      selectedFile: selectedFile
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
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setMessage('Veuillez sélectionner un fichier PDF valide.');
      return;
    }

    if (selectedFile && selectedFile.size > 50 * 1024 * 1024) { // 50MB
      setMessage('Le fichier est trop volumineux. Taille maximum: 50MB.');
      return;
    }

    setUploading(true);
    setMessage('');

    const uploadData = new FormData();
    uploadData.append('semester', formData.semester);
    uploadData.append('type', formData.type);
    uploadData.append('subject', formData.subject);
    uploadData.append('year', formData.year);
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
      // Enhanced fetch with proper error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: uploadData,
        signal: controller.signal,
        // Don't set Content-Type header - let browser set it with boundary for FormData
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response isn't JSON, use status text
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('Upload response data:', responseData);

      setMessage('Fichier uploadé avec succès!');
      
      // Reset form
      setFormData({
        semester: 'S1',
        type: 'cours',
        subject: '',
        year: '',
        pdf: null
      });
      
      // Clear file input
      const fileInput = document.getElementById('pdf-input');
      if (fileInput) fileInput.value = '';
      
      // Refresh lists if on those tabs
      if (activeTab === 'manage') loadFiles();
      if (activeTab === 'stats') loadStats();
      
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.name === 'AbortError') {
        setMessage('Erreur: Timeout lors de l\'upload (30s). Veuillez réessayer.');
      } else if (error.message.includes('CORS')) {
        setMessage('Erreur CORS: Problème de configuration serveur. Contactez l\'administrateur.');
      } else {
        setMessage('Erreur lors de l\'upload: ' + error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  // --- EDIT ---
  const startEditing = (file) => {
    setEditingFile({
      ...file,
      originalName: file.originalName,
      semester: file.semester?.name || file.semester || '',
      type: file.type?.name || file.type || '',
      subject: file.subject?.name || file.subject || '',
      year: file.year?.year || file.year || ''
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
          originalName: editingFile.originalName,
          semester: editingFile.semester,
          type: editingFile.type,
          subject: editingFile.subject,
          year: editingFile.year
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMessage('Fichier mis à jour avec succès!');
      setEditingFile(null);
      loadFiles();
    } catch (error) {
      console.error('Edit error:', error);
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
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMessage('Fichier supprimé avec succès!');
      setDeleteConfirm(null);
      loadFiles();
      if (activeTab === 'stats') loadStats();
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Erreur lors de la suppression: ' + error.message);
    }
  };

  // --- FILTERS ---
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.subject?.name && file.subject.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.subject && typeof file.subject === 'string' && file.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const fileSemester = file.semester?.name || file.semester;
    const matchesSemester = !filterSemester || fileSemester === filterSemester;
    
    const fileType = file.type?.name || file.type;
    const matchesType = !filterType || fileType === filterType;
    
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin(e);
  };

  // Get display name for semester/type
  const getDisplayName = (item, field) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.displayName || item.name || item;
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
            Administration - Gestion des Fichiers
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
          >Upload</button>
          <button
            className={`${styles.tabButton} ${activeTab === 'manage' ? styles.active : ''}`}
            onClick={() => setActiveTab('manage')}
          >Gérer les Fichiers</button>
          <button
            className={`${styles.tabButton} ${activeTab === 'stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('stats')}
          >Statistiques</button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
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
              <label htmlFor="pdf-input">Fichier PDF</label>
              <input
                id="pdf-input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
              />
              {formData.pdf && (
                <div className={styles.fileInfo}>
                  Fichier sélectionné: {formData.pdf.name} ({formatFileSize(formData.pdf.size)})
                </div>
              )}
            </div>
            <button type="submit" disabled={uploading} className={styles.submitButton}>
              {uploading ? 'Upload en cours...' : 'Uploader le fichier'}
            </button>
          </form>
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
                Actualiser
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}>Chargement...</div>
            ) : (
              <div className={styles.filesTable}>
                {filteredFiles.length === 0 ? (
                  <div className={styles.noFiles}>Aucun fichier trouvé</div>
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
                              <span>{getDisplayName(file.semester)}</span>
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
                                <option value="cours">Cours</option>
                                <option value="tp">TP</option>
                                <option value="td">TD</option>
                                <option value="devoirs">Devoirs</option>
                                <option value="compositions">Compositions</option>
                                <option value="ratrapages">Rattrapages</option>
                              </select>
                            ) : (
                              <span>{getDisplayName(file.type)}</span>
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
                              <span>{getDisplayName(file.subject)}</span>
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
                              <span>{file.year?.year || file.year}</span>
                            )}
                          </td>
                          <td>{formatFileSize(file.fileSize)}</td>
                          <td>
                            <span className={styles.storageBadge}>
                              {file.storageProvider === 'appwrite' ? 'Appwrite' : 'Local'}
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
                                <a
                                  href={`${API_BASE_URL}/api/files/${file._id}/view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.viewButton}
                                  title="Voir le fichier"
                                >👁️</a>
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
                  <h3>Total Fichiers</h3>
                  <div className={styles.statNumber}>{stats.overview?.totalFiles || 0}</div>
                  <div className={styles.statSubtitle}>
                    {stats.overview?.appwriteFiles && `${stats.overview.appwriteFiles} dans Appwrite`}
                  </div>
                </div>
                <div className={styles.statCard}>
                  <h3>Semestres</h3>
                  <div className={styles.statNumber}>{stats.overview?.totalSemesters || 0}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>Matières</h3>
                  <div className={styles.statNumber}>{stats.overview?.totalSubjects || 0}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>Taille Totale</h3>
                  <div className={styles.statNumber}>{stats.overview?.totalSizeFormatted || '0 Bytes'}</div>
                  <div className={styles.statSubtitle}>
                    {stats.overview?.appwriteSizeFormatted && `${stats.overview.appwriteSizeFormatted}`}
                  </div>
                </div>
                
                {stats.filesByType && stats.filesByType.length > 0 && (
                  <div className={`${styles.statCard} ${styles.fullWidth}`}>
                    <h3>Fichiers par Type</h3>
                    <div className={styles.typeStats}>
                      {stats.filesByType.map((type) => (
                        <div key={type._id} className={styles.typeStatItem}>
                          <span>{type._id}:</span>
                          <span>{type.count} fichiers ({type.totalSizeFormatted})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats.filesBySemester && stats.filesBySemester.length > 0 && (
                  <div className={`${styles.statCard} ${styles.fullWidth}`}>
                    <h3>Fichiers par Semestre</h3>
                    <div className={styles.typeStats}>
                      {stats.filesBySemester.map((semester) => (
                        <div key={semester._id} className={styles.typeStatItem}>
                          <span>{semester._id}:</span>
                          <span>{semester.count} fichiers ({semester.totalSizeFormatted})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats.storageProvider && (
                  <div className={`${styles.statCard} ${styles.fullWidth}`}>
                    <h3>Stockage</h3>
                    <div className={styles.storageInfo}>
                      <p><strong>Provider:</strong> {stats.storageProvider}</p>
                      <p><strong>Location:</strong> {stats.storageLocation}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.loading}>Chargement des statistiques...</div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>Confirmer la suppression</h3>
              <p>Êtes-vous sûr de vouloir supprimer le fichier "{deleteConfirm.originalName}" ?</p>
              <p><strong>Cette action est irréversible!</strong></p>
              <div className={styles.modalActions}>
                <button onClick={deleteFile} className={styles.deleteConfirmButton}>Oui, Supprimer</button>
                <button onClick={cancelDelete} className={styles.cancelButton}>Annuler</button>
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
              className={styles.closeMessageButton}
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

export default AdminPage;