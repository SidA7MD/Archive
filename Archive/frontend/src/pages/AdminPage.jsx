import React, { useState, useEffect } from 'react';
import styles from './AdminPage.module.css';

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const AdminPage = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState('upload');

  // Upload form state
  const [formData, setFormData] = useState({
    semester: 'S1',
    type: 'cours',
    subject: '',
    year: '',
    pdf: null
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Files management state
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [stats, setStats] = useState(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterType, setFilterType] = useState('');

  // Password configuration
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

  // Load files when switching to manage tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'manage') {
      loadFiles();
    }
    if (isAuthenticated && activeTab === 'stats') {
      loadStats();
    }
  }, [isAuthenticated, activeTab]);

  // Load files from API
  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/files`);
      const data = await response.json();
      if (response.ok) {
        setFiles(data);
      } else {
        setMessage('Erreur lors du chargement des fichiers: ' + data.error);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setMessage('Erreur lors du chargement des fichiers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load stats from API
  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Upload form handlers
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
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: uploadData
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        setMessage('Fichier uploadé avec succès!');
        setFormData({
          semester: 'S1',
          type: 'cours',
          subject: '',
          year: '',
          pdf: null
        });
        const fileInput = document.getElementById('pdf-input');
        if (fileInput) fileInput.value = '';
        
        // Reload files if on manage tab
        if (activeTab === 'manage') {
          loadFiles();
        }
      } else {
        throw new Error(responseData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Erreur lors de l\'upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Edit file handlers
  const startEditing = (file) => {
    setEditingFile({
      ...file,
      originalName: file.originalName,
      semester: file.semester?.name || '',
      type: file.type?.name || '',
      subject: file.subject?.name || '',
      year: file.year?.year || ''
    });
  };

  const cancelEditing = () => {
    setEditingFile(null);
  };

  const saveEdit = async () => {
    if (!editingFile) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/files/${editingFile._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalName: editingFile.originalName,
          semester: editingFile.semester,
          type: editingFile.type,
          subject: editingFile.subject,
          year: editingFile.year
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Fichier mis à jour avec succès!');
        setEditingFile(null);
        loadFiles();
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage('Erreur lors de la mise à jour: ' + error.message);
    }
  };

  // Delete file handlers
  const confirmDelete = (file) => {
    setDeleteConfirm(file);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const deleteFile = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/files/${deleteConfirm._id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Fichier supprimé avec succès!');
        setDeleteConfirm(null);
        loadFiles();
        if (activeTab === 'stats') {
          loadStats();
        }
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Erreur lors de la suppression: ' + error.message);
    }
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.subject?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = !filterSemester || file.semester?.name === filterSemester;
    const matchesType = !filterType || file.type?.name === filterType;
    
    return matchesSearch && matchesSemester && matchesType;
  });

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            Administration - Gestion des Fichiers
          </h1>
          <button 
            onClick={handleLogout}
            className={styles.logoutButton}
            type="button"
          >
            Déconnexion
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'upload' ? styles.active : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📤 Upload
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
        )}

        {/* Manage Files Tab */}
        {activeTab === 'manage' && (
          <div className={styles.manageSection}>
            {/* Search and Filters */}
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
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">Tous les semestres</option>
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                  <option value="S3">Semestre 3</option>
                  <option value="S4">Semestre 4</option>
                  <option value="S5">Semestre 5</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">Tous les types</option>
                  <option value="cours">Cours</option>
                  <option value="tp">Travaux Pratiques</option>
                  <option value="td">Travaux Dirigés</option>
                  <option value="devoirs">Devoirs</option>
                  <option value="compositions">Compositions</option>
                  <option value="ratrapages">Rattrapages</option>
                </select>
              </div>
              <button
                onClick={loadFiles}
                className={styles.refreshButton}
                disabled={loading}
              >
                🔄 Actualiser
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
                              <span>{file.originalName}</span>
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
                              <span>{file.semester?.displayName}</span>
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
                              <span>{file.type?.displayName}</span>
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
                          <td className={styles.actions}>
                            {editingFile && editingFile._id === file._id ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  className={styles.saveButton}
                                >
                                  💾
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className={styles.cancelButton}
                                >
                                  ❌
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(file)}
                                  className={styles.editButton}
                                >
                                  ✏️
                                </button>
                                <a
                                  href={`${API_BASE_URL}/api/files/${file._id}/view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.viewButton}
                                >
                                  👁️
                                </a>
                                <button
                                  onClick={() => confirmDelete(file)}
                                  className={styles.deleteButton}
                                >
                                  🗑️
                                </button>
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
                  <div className={styles.statNumber}>{stats.totalFiles}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>📚 Semestres</h3>
                  <div className={styles.statNumber}>{stats.totalSemesters}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>📖 Matières</h3>
                  <div className={styles.statNumber}>{stats.totalSubjects}</div>
                </div>
                <div className={styles.statCard}>
                  <h3>💾 Taille Totale</h3>
                  <div className={styles.statNumber}>{formatFileSize(stats.totalSize)}</div>
                </div>
                
                {stats.filesByType && stats.filesByType.length > 0 && (
                  <div className={styles.statCard + ' ' + styles.fullWidth}>
                    <h3>📊 Fichiers par Type</h3>
                    <div className={styles.typeStats}>
                      {stats.filesByType.map((type) => (
                        <div key={type._id} className={styles.typeStatItem}>
                          <span>{type._id}:</span>
                          <span>{type.count}</span>
                        </div>
                      ))}
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
                <button
                  onClick={deleteFile}
                  className={styles.deleteConfirmButton}
                >
                  Oui, Supprimer
                </button>
                <button
                  onClick={cancelDelete}
                  className={styles.cancelButton}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={message.includes('succès') ? styles.successMessage : styles.errorMessage}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};