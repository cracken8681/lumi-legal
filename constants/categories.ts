import { Category } from '../store/useAppStore';

export const CATEGORIES: Record<Category, { label: string; emoji: string; color: string }> = {
  food:          { label: 'Food',          emoji: '🛒', color: '#00C896' },
  transport:     { label: 'Transport',     emoji: '🚗', color: '#5B5FEF' },
  entertainment: { label: 'Entertainment', emoji: '🎬', color: '#FF6B6B' },
  shopping:      { label: 'Shopping',      emoji: '🛍️', color: '#FFB547' },
  bills:         { label: 'Bills',         emoji: '💡', color: '#8B8FA8' },
  health:        { label: 'Health',        emoji: '❤️', color: '#FF4757' },
  other:         { label: 'Other',         emoji: '📦', color: '#A78BFA' },
};
