'use client';

interface ModeToggleProps {
  mode: 'ai' | 'human';
  onToggle: (newMode: 'ai' | 'human') => void;
  disabled?: boolean;
}

export default function ModeToggle({ mode, onToggle, disabled }: ModeToggleProps) {
  const handleToggle = () => {
    if (disabled) return;
    onToggle(mode === 'ai' ? 'human' : 'ai');
  };

  return (
    <div className="mode-toggle" style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: disabled ? 0.6 : 1 }}>

      {/* 🤖 ĐẠ ĐỔI: Thay emoji bằng icon AI.png */}
      <span
        className={`mode-label ${mode === 'ai' ? 'active-ai' : 'inactive'}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <img
          src="/AI.png"
          alt="AI Mode"
          style={{
            width: '18px',
            height: '18px',
            objectFit: 'contain',
            opacity: mode === 'ai' ? 1 : 0.4 // Làm mờ nhẹ khi không kích hoạt
          }}
        />
        AI
      </span>

      {/* Giữ nguyên track gạt switch chuẩn chỉnh của bạn */}
      <div
        className={`toggle-track ${mode}`}
        onClick={handleToggle}
        role="switch"
        aria-checked={mode === 'human'}
        tabIndex={disabled ? -1 : 0}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <div className="toggle-thumb" />
      </div>

      {/* 👤 ĐÃ ĐỔI: Thay emoji bằng icon human.png */}
      <span
        className={`mode-label ${mode === 'human' ? 'active-human' : 'inactive'}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <img
          src="/human.png"
          alt="Human Mode"
          style={{
            width: '18px',
            height: '18px',
            objectFit: 'contain',
            opacity: mode === 'human' ? 1 : 0.4 // Làm mờ nhẹ khi không kích hoạt
          }}
        />
        Human
      </span>

    </div>
  );
}