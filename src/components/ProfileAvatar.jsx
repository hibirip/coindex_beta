export default function ProfileAvatar({ gradientColors, size = 'md', nickname }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const [color1, color2] = gradientColors ? gradientColors.split(',') : ['#667eea', '#764ba2'];
  
  return (
    <div 
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shadow-lg`}
      style={{
        background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
      }}
    >
      {nickname ? nickname.charAt(0).toUpperCase() : '?'}
    </div>
  );
} 