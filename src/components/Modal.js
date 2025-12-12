import React from 'react';

const Modal = ({ isOpen, onClose, children, title, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ImageModal = ({ isOpen, onClose, imageSrc, alt = 'Image' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <img src={imageSrc} alt={alt} className="modal-image" />
      </div>
    </div>
  );
};

export const DataModal = ({ isOpen, onClose, title, driveStored, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content data-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <div className="data-modal-header">
          <h2 className="data-modal-title">{title}</h2>
          {driveStored && <span className="drive-badge">Stored in Drive</span>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
