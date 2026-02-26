import { useEffect } from 'react';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function useMotionEffects(triggerKey: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups: Array<() => void> = [];

    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (revealItems.length) {
      if (reduceMotion) {
        revealItems.forEach((item) => item.setAttribute('data-reveal-state', 'visible'));
      } else {
        const revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const target = entry.target as HTMLElement;
              const once = target.dataset.revealOnce !== 'false';
              if (entry.isIntersecting) {
                target.setAttribute('data-reveal-state', 'visible');
                if (once) revealObserver.unobserve(target);
              } else if (!once) {
                target.removeAttribute('data-reveal-state');
              }
            });
          },
          { threshold: 0.22, rootMargin: '0px 0px -10% 0px' }
        );

        revealItems.forEach((item, index) => {
          const delay = Number(item.dataset.revealDelay ?? index * 40);
          item.style.setProperty('--reveal-delay', `${delay}ms`);
          revealObserver.observe(item);
        });

        cleanups.push(() => revealObserver.disconnect());
      }
    }

    const tiltItems = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'));
    if (tiltItems.length) {
      tiltItems.forEach((item) => {
        if (reduceMotion) {
          item.style.setProperty('--tilt-rx', '0deg');
          item.style.setProperty('--tilt-ry', '0deg');
          item.style.setProperty('--tilt-glare-x', '50%');
          item.style.setProperty('--tilt-glare-y', '50%');
          return;
        }

        const onMove = (event: MouseEvent) => {
          const rect = item.getBoundingClientRect();
          const relativeX = (event.clientX - rect.left) / rect.width;
          const relativeY = (event.clientY - rect.top) / rect.height;
          const centeredX = clamp(relativeX - 0.5, -0.5, 0.5);
          const centeredY = clamp(relativeY - 0.5, -0.5, 0.5);
          const tiltStrengthRaw = Number(item.dataset.tiltStrength ?? 10);
          const tiltStrength = clamp(Number.isFinite(tiltStrengthRaw) ? tiltStrengthRaw : 10, 2.5, 14);
          const rotateX = centeredY * -tiltStrength;
          const rotateY = centeredX * tiltStrength;

          item.style.setProperty('--tilt-rx', `${rotateX.toFixed(2)}deg`);
          item.style.setProperty('--tilt-ry', `${rotateY.toFixed(2)}deg`);
          item.style.setProperty('--tilt-glare-x', `${clamp(relativeX * 100, 0, 100).toFixed(1)}%`);
          item.style.setProperty('--tilt-glare-y', `${clamp(relativeY * 100, 0, 100).toFixed(1)}%`);
        };

        const onLeave = () => {
          item.style.setProperty('--tilt-rx', '0deg');
          item.style.setProperty('--tilt-ry', '0deg');
          item.style.setProperty('--tilt-glare-x', '50%');
          item.style.setProperty('--tilt-glare-y', '50%');
        };

        item.addEventListener('mousemove', onMove);
        item.addEventListener('mouseleave', onLeave);
        item.addEventListener('blur', onLeave);

        cleanups.push(() => {
          item.removeEventListener('mousemove', onMove);
          item.removeEventListener('mouseleave', onLeave);
          item.removeEventListener('blur', onLeave);
          onLeave();
        });
      });
    }

    const parallaxItems = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    if (parallaxItems.length) {
      if (reduceMotion) {
        parallaxItems.forEach((item) => item.style.setProperty('--parallax-y', '0px'));
      } else {
        let rafId = 0;

        const updateParallax = () => {
          const viewportCenter = window.innerHeight / 2;
          parallaxItems.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const speed = Number(item.dataset.parallax ?? 0.055);
            const elementCenter = rect.top + rect.height / 2;
            const distance = (viewportCenter - elementCenter) * speed;
            const offset = clamp(distance, -24, 24);
            item.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
          });
        };

        const requestTick = () => {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(updateParallax);
        };

        requestTick();
        window.addEventListener('scroll', requestTick, { passive: true });
        window.addEventListener('resize', requestTick);

        cleanups.push(() => {
          if (rafId) cancelAnimationFrame(rafId);
          window.removeEventListener('scroll', requestTick);
          window.removeEventListener('resize', requestTick);
        });
      }
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [triggerKey]);
}
