import { useEffect, useState } from 'react';

interface CelebrationEffectProps {
  show: boolean;
  onComplete: () => void;
}

interface Emoji {
  id: number;
  emoji: string;
  x: number;
  delay: number;
}

export default function CelebrationEffect({ show, onComplete }: CelebrationEffectProps) {
  const [emojis, setEmojis] = useState<Emoji[]>([]);

  useEffect(() => {
    if (show) {
      const emojiList = ['😊', '👍', '🎉', '😄', '👏', '🌟'];
      const newEmojis = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        emoji: emojiList[Math.floor(Math.random() * emojiList.length)],
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
      }));

      setEmojis(newEmojis);

      const timer = setTimeout(() => {
        setEmojis([]);
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute bottom-0 text-4xl animate-float-up"
          style={{
            left: `${emoji.x}%`,
            animationDelay: `${emoji.delay}s`,
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
}
