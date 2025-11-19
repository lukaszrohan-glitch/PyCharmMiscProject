import React, { useState, useEffect } from 'react';
import styles from './RotatingQuotes.module.css';

const quotes = [
  // Finance & Business
  {
    text: "Price is what you pay. Value is what you get.",
    author: "Warren Buffett",
    category: "finance"
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    category: "finance"
  },
  {
    text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
    author: "Philip Fisher",
    category: "finance"
  },
  {
    text: "Efficiency is doing things right; effectiveness is doing the right things.",
    author: "Peter Drucker",
    category: "business"
  },

  // Ricky Gervais
  {
    text: "Just because you're offended, doesn't mean you're right.",
    author: "Ricky Gervais",
    category: "comedy"
  },
  {
    text: "The best advice I've ever received is: No one else knows what they're doing either.",
    author: "Ricky Gervais",
    category: "comedy"
  },
  {
    text: "Remember, if you don't sin, Jesus died for nothing.",
    author: "Ricky Gervais",
    category: "comedy"
  },
  {
    text: "The truth doesn't hurt. Whatever it is, it doesn't hurt. It's better to know the truth.",
    author: "Ricky Gervais",
    category: "comedy"
  },

  // Monty Python
  {
    text: "Nobody expects the Spanish Inquisition!",
    author: "Monty Python",
    category: "comedy"
  },
  {
    text: "Always look on the bright side of life.",
    author: "Monty Python",
    category: "comedy"
  },
  {
    text: "I'm not dead yet!",
    author: "Monty Python",
    category: "comedy"
  },
  {
    text: "It's just a flesh wound.",
    author: "Monty Python",
    category: "comedy"
  },
  {
    text: "Ni!",
    author: "Monty Python - Knights Who Say Ni",
    category: "comedy"
  },
  {
    text: "What is the airspeed velocity of an unladen swallow?",
    author: "Monty Python",
    category: "comedy"
  },

  // Little Britain
  {
    text: "Computer says no.",
    author: "Little Britain",
    category: "comedy"
  },
  {
    text: "Yeah, but no, but yeah, but no...",
    author: "Little Britain - Vicky Pollard",
    category: "comedy"
  },
  {
    text: "I'm the only gay in the village.",
    author: "Little Britain - Daffyd",
    category: "comedy"
  },
  {
    text: "I want that one.",
    author: "Little Britain",
    category: "comedy"
  },
  {
    text: "Eh eh ehhhhh!",
    author: "Little Britain",
    category: "comedy"
  },

  // Manufacturing & Production (bonus)
  {
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle",
    category: "business"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: "business"
  }
];

export default function RotatingQuotes({ lang }) {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length);
        setIsAnimating(false);
      }, 500); // Half of animation time

    }, 8000); // Change quote every 8 seconds

    return () => clearInterval(interval);
  }, []);

  const quote = quotes[currentQuote];

  return (
    <div className={styles.container}>
      <div
        className={`${styles.quote} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}
      >
        <blockquote className={styles.text}>
          "{quote.text}"
        </blockquote>
        <cite className={styles.author}>
          — {quote.author}
        </cite>
      </div>

      {/* Quote indicator dots */}
      <div className={styles.indicators} aria-label={lang === 'pl' ? 'Wskaźniki cytatów' : 'Quote indicators'}>
        {quotes.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${index === currentQuote ? styles.dotActive : ''}`}
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setCurrentQuote(index);
                setIsAnimating(false);
              }, 300);
            }}
            aria-label={`${lang === 'pl' ? 'Cytat' : 'Quote'} ${index + 1}`}
            aria-current={index === currentQuote}
          />
        ))}
      </div>
    </div>
  );
}

