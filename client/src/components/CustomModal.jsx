import React from 'react';
import ReactDOM from 'react-dom/client';
import { Info, HelpCircle, FileText } from 'lucide-react';
import './CustomModal.css';

class ModalManager {
  constructor() {
    this.container = null;
    this.root = null;
  }

  ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'custom-modal-root';
      document.body.appendChild(this.container);
      this.root = ReactDOM.createRoot(this.container);
    }
  }

  destroy() {
    if (this.container) {
      const modalOverlay = document.querySelector('.custom-modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.add('custom-modal-fade-out');
        const modalBox = document.querySelector('.custom-modal-box');
        if (modalBox) {
          modalBox.classList.add('custom-modal-scale-down');
        }
      }
      setTimeout(() => {
        if (this.root) {
          this.root.unmount();
          this.root = null;
        }
        if (this.container) {
          this.container.remove();
          this.container = null;
        }
      }, 300);
    }
  }

  alert(message, title = 'Notification') {
    this.ensureContainer();
    return new Promise((resolve) => {
      const element = (
        <div className="custom-modal-overlay">
          <div className="custom-modal-box alert-modal">
            <div className="modal-header-accent"></div>
            <div className="custom-modal-icon-wrap alert-icon">
              <Info size={28} />
            </div>
            <h3 className="custom-modal-title">{title}</h3>
            <p className="custom-modal-message">{message}</p>
            <div className="custom-modal-actions">
              <button 
                className="custom-modal-btn custom-modal-btn-primary"
                onClick={() => {
                  this.destroy();
                  resolve(true);
                }}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      );
      this.root.render(element);
    });
  }

  confirm(message, title = 'Confirm Action') {
    this.ensureContainer();
    return new Promise((resolve) => {
      const element = (
        <div className="custom-modal-overlay">
          <div className="custom-modal-box confirm-modal">
            <div className="modal-header-accent"></div>
            <div className="custom-modal-icon-wrap confirm-icon">
              <HelpCircle size={28} />
            </div>
            <h3 className="custom-modal-title">{title}</h3>
            <p className="custom-modal-message">{message}</p>
            <div className="custom-modal-actions">
              <button 
                className="custom-modal-btn custom-modal-btn-secondary"
                onClick={() => {
                  this.destroy();
                  resolve(false);
                }}
              >
                Cancel
              </button>
              <button 
                className="custom-modal-btn custom-modal-btn-primary"
                onClick={() => {
                  this.destroy();
                  resolve(true);
                }}
                autoFocus
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      );
      this.root.render(element);
    });
  }

  prompt(message, defaultValue = '', title = 'Input Required') {
    this.ensureContainer();
    return new Promise((resolve) => {
      let inputValue = defaultValue;
      const handleInputChange = (e) => {
        inputValue = e.target.value;
      };

      const handleSubmit = () => {
        this.destroy();
        resolve(inputValue);
      };

      const handleCancel = () => {
        this.destroy();
        resolve(null);
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          handleSubmit();
        } else if (e.key === 'Escape') {
          handleCancel();
        }
      };

      const element = (
        <div className="custom-modal-overlay">
          <div className="custom-modal-box prompt-modal">
            <div className="modal-header-accent"></div>
            <div className="custom-modal-icon-wrap prompt-icon">
              <FileText size={28} />
            </div>
            <h3 className="custom-modal-title">{title}</h3>
            <p className="custom-modal-message">{message}</p>
            <div className="custom-modal-input-group">
              <input 
                type="text" 
                className="custom-modal-input" 
                defaultValue={defaultValue} 
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <div className="custom-modal-actions">
              <button 
                className="custom-modal-btn custom-modal-btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                className="custom-modal-btn custom-modal-btn-primary"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      );
      this.root.render(element);
    });
  }
}

const modalManager = new ModalManager();

export const customAlert = (message, title) => modalManager.alert(message, title);
export const customConfirm = (message, title) => modalManager.confirm(message, title);
export const customPrompt = (message, defaultValue, title) => modalManager.prompt(message, defaultValue, title);

// Override globally
window.customAlert = customAlert;
window.customConfirm = customConfirm;
window.customPrompt = customPrompt;
