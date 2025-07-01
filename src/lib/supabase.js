import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = 'https://uzdfqhmdrzcwylnfbxku.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ZGZxaG1kcnpjd3lsbmZieGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExMjcsImV4cCI6MjA2Njg4NzEyN30.1GOgTRSA8ePGLiGPBmujLVd4sKAMXcnzunumL021vDk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// 랜덤 그라데이션 색상 생성
export const generateGradientColors = () => {
  const colors = [
    ['#FF6B6B', '#4ECDC4'],
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#30cfd0', '#330867'],
    ['#a8edea', '#fed6e3'],
    ['#8ed1fc', '#0693e3'],
    ['#d299c2', '#fef9d7']
  ];
  
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex].join(',');
}; 