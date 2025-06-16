// client/src/components/Modal.jsx
import React from 'react';
import './Modal.css'; // Nous créerons ce fichier CSS juste après

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}> {/* Ferme si on clique sur l'overlay */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Empêche la fermeture si on clique dans le contenu */}
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;