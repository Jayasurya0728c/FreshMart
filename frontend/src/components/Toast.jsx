export default function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="toast-notification" role="status" aria-live="polite">
      <div className="toast-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="toast-icon">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span className="toast-text">{message}</span>
      </div>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Dismiss notification">✕</button>
      )}
    </div>
  );
}

