import React, { useState, useEffect } from 'react';
import styles from './AdminPage.module.css';

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
  const [connectionStatus, setConnectionStatus] = useState('testing');

  const ADMIN_PASSWORD = 'admin123';

  useEffect(() => {
    const testConnection = async () => {
      setConnectionStatus('testing');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          setConnectionStatus('connected');
          if (data.status === 'Warning') {
            setMessage(`Avertissement serveur: ${data.message}`);
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        setConnectionStatus('failed');
        if (error.name === 'AbortError') {
          setMessage('Timeout de connexion au serveur (15s)');
        } else if (error.message.includes('CORS')) {
          setMessage('Erreur CORS: Vérifiez la configuration serveur');
        } else {
          setMessage(`Connexion échouée: ${error.message}`);
        }
      }
    };
    testConnection();
  }, []);

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
    if (isAuthenticated && connectionStatus === 'connected') {
      if (activeTab === 'manage') loadFiles();
      if (activeTab === 'stats') loadStats();
    }
  }, [isAuthenticated, activeTab, connectionStatus]);

  const makeApiRequest = async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        },
        mode: 'cors'
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await makeApiRequest('/api/admin/files');
      setFiles(data);
    } catch (error) {
      setMessage('Erreur chargement fichiers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await makeApiRequest('/api/admin/stats');
      setStats(data);
    } catch (error) {}
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      pdf: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (connectionStatus !== 'connected') {
      setMessage('Serveur non disponible. Veuillez attendre la connexion.');
      return;
    }
    const fileInput = document.getElementById('pdf-input');
    const selectedFile = formData.pdf || fileInput?.files[0];
    if (!formData.semester || !formData.type || !formData.subject.trim() || 
        !formData.year.trim() || !selectedFile) {
      setMessage('Veuillez remplir tous les champs et sélectionner un fichier PDF.');
      return;
    }
    if (selectedFile.type !== 'application/pdf') {
      setMessage('Veuillez sélectionner un fichier PDF valide.');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setMessage('Fichier trop volumineux (max 50MB).');
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
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: uploadData,
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      const result = await response.json();
      setMessage('Fichier uploadé avec succès!');
      setFormData({
        semester: 'S1',
        type: 'cours',
        subject: '',
        year: '',
        pdf: null
      });
      const fileInputElement = document.getElementById('pdf-input');
      if (fileInputElement) fileInputElement.value = '';
      if (activeTab === 'manage') loadFiles();
      if (activeTab === 'stats') loadStats();
    } catch (error) {
      if (error.name === 'AbortError') {
        setMessage('Upload timeout (60s). Veuillez réessayer avec un fichier plus petit.');
      } else {
        setMessage('Erreur upload: ' + error.message);
      }
    } finally {
      setUploading(false);
    }
  };

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
      await makeApiRequest(`/api/files/${editingFile._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalName: editingFile.originalName,
          semester: editingFile.semester,
          type: editingFile.type,
          subject: editingFile.subject,
          year: editingFile.year
        })
      });
      setMessage('Fichier mis à jour avec succès!');
      setEditingFile(null);
      loadFiles();
    } catch (error) {
      setMessage('Erreur mise à jour: ' + error.message);
    }
  };

  const confirmDelete = (file) => setDeleteConfirm(file);
  const cancelDelete = () => setDeleteConfirm(null);

  const deleteFile = async () => {
    if (!deleteConfirm) return;
    try {
      await makeApiRequest(`/api/files/${deleteConfirm._id}`, {
        method: 'DELETE'
      });
      setMessage('Fichier supprimé avec succès!');
      setDeleteConfirm(null);
      loadFiles();
      if (activeTab === 'stats') loadStats();
    } catch (error) {
      setMessage('Erreur suppression: ' + error.message);
    }
  };

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

  const getDisplayName = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.displayName || item.name || item;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'failed': return '#dc3545';
      case 'testing': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connecté';
      case 'failed': return 'Échec connexion';
      case 'testing': return 'Test connexion...';
      default: return 'Inconnu';
    }
  };

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
          <div className={styles.connectionStatus} style={{ 
            color: getConnectionStatusColor(), 
            marginBottom: '1rem',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            Statut serveur: {getConnectionStatusText()}
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
              disabled={connectionStatus !== 'connected'}
            />
          </div>
          <button 
            onClick={handleLogin} 
            className={styles.loginButton} 
            type="button"
            disabled={connectionStatus !== 'connected'}
          >
            {connectionStatus === 'connected' ? 'Se connecter' : 'Serveur non disponible'}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              color: getConnectionStatusColor(), 
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              {getConnectionStatusText()}
            </div>
            <button onClick={handleLogout} className={styles.logoutButton} type="button">
              Déconnexion
            </button>
          </div>
        </div>
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabButton} ${activeTab === 'upload' ? styles.active : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'manage' ? styles.active : ''}`}
            onClick={() => setActiveTab('manage')}
            disabled={connectionStatus !== 'connected'}
          >
            Gérer les Fichiers
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('stats')}
            disabled={connectionStatus !== 'connected'}
          >
            Statistiques
          </button>
        </div>
        {activeTab === 'upload' && (
          <div>
            {connectionStatus !== 'connected' && (
              <div className={styles.warningMessage} style={{ 
                background: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                color: '#856404',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginBottom: '1rem'
              }}>
                Serveur non disponible. L'upload est désactivé.
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.uploadForm}>
              <div className={styles.formGroup}>
                <label htmlFor="semester">Semestre</label>
                <select 
                  id="semester" 
                  name="semester" 
                  value={formData.semester} 
                  onChange={handleInputChange} 
                  required
                  disabled={uploading || connectionStatus !== 'connected'}
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
                  disabled={uploading || connectionStatus !== 'connected'}
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
                  disabled={uploading || connectionStatus !== 'connected'}
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
                  disabled={uploading || connectionStatus !== 'connected'}
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
                  disabled={uploading || connectionStatus !== 'connected'}
                />
                {formData.pdf && (
                  <div className={styles.fileInfo}>
                    Fichier sélectionné: {formData.pdf.name} ({formatFileSize(formData.pdf.size)})
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={uploading || connectionStatus !== 'connected'} 
                className={styles.submitButton}
              >
                {uploading ? 'Upload en cours...' : 'Uploader le fichier'}
              </button>
            </form>
          </div>
        )}
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
                {loading ? 'Chargement...' : 'Actualiser'}
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
                              {file.storageProvider === 'local' ? 'Local' : file.storageProvider}
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
                                  href={file.viewUrl || file.cloudinaryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.viewButton}
                                  title="Voir le fichier"
                                >👁️</a>
                                <a
                                  href={file.downloadUrl || file.cloudinaryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.downloadButton}
                                  title="Télécharger"
                                >⬇️</a>
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
        {activeTab === 'stats' && (
          <div className={styles.statsSection}>
            {stats ? (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Total Fichiers</h3>
                  <div className={styles.statNumber}>{stats.overview?.totalFiles || 0}</div>
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
                      <p><strong>Location:</strong> {stats.storageLocation || 'Cloudinary'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.loading}>Chargement des statistiques...</div>
            )}
          </div>
        )}
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