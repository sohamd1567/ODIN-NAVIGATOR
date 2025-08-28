import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function StarField() {
  const starfieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createStars = () => {
      if (!starfieldRef.current) return;

      const numStars = 100;
      const starfield = starfieldRef.current;

      // Clear existing stars
      starfield.innerHTML = "";

      for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = `${Math.random() * 3 + 1}px`;
        star.style.height = star.style.width;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        starfield.appendChild(star);
      }
    };

    const createFloatingParticles = () => {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.width = '2px';
      particle.style.height = '2px';
      particle.style.background = 'hsl(195, 100%, 50%)';
      particle.style.borderRadius = '50%';
      particle.style.left = '-5px';
      particle.style.top = `${Math.random() * window.innerHeight}px`;
      particle.style.animation = 'drift 15s linear forwards';
      particle.style.opacity = '0.6';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '5';
      document.body.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 15000);
    };

    createStars();

    // Create floating particles periodically
    const particleInterval = setInterval(createFloatingParticles, 3000);

    return () => {
      clearInterval(particleInterval);
    };
  }, []);

  return (
    <motion.div 
      ref={starfieldRef}
      className="fixed inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    />
  );
}
