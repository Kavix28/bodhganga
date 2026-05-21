import { useEffect, useRef } from 'react';

const SpaceBackground = ({ theme = 'starfield' }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Particle systems for different themes
        let particles = [];
        let meteors = [];
        let planets = [];

        // Initialize based on theme
        const initTheme = () => {
            particles = [];
            meteors = [];
            planets = [];

            if (theme === 'starfield') {
                initStarfield();
            } else if (theme === 'meteor') {
                initMeteorShower();
            } else if (theme === 'planets') {
                initPlanets();
            } else if (theme === 'nebula') {
                initNebula();
            }
        };

        // STARFIELD THEME
        const initStarfield = () => {
            for (let i = 0; i < 200; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1.5 + 0.5,
                    opacity: Math.random(),
                    twinkleSpeed: Math.random() * 0.02 + 0.01,
                    depth: Math.random() * 3 + 1, // For parallax
                    vx: (Math.random() - 0.5) * 0.1,
                    vy: (Math.random() - 0.5) * 0.1
                });
            }
        };

        const drawStarfield = () => {
            // Dark space gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#0a0e27');
            gradient.addColorStop(0.5, '#1a1d3a');
            gradient.addColorStop(1, '#0f1729');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Draw stars with twinkling effect
            particles.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                star.opacity += star.twinkleSpeed;
                if (star.opacity >= 1 || star.opacity <= 0.2) {
                    star.twinkleSpeed *= -1;
                }
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();

                // Slow parallax movement
                if (!prefersReducedMotion) {
                    star.x += star.vx / star.depth;
                    star.y += star.vy / star.depth;

                    // Wrap around
                    if (star.x < 0) star.x = width;
                    if (star.x > width) star.x = 0;
                    if (star.y < 0) star.y = height;
                    if (star.y > height) star.y = 0;
                }
            });
        };

        // METEOR SHOWER THEME
        const initMeteorShower = () => {
            // Background stars
            for (let i = 0; i < 150; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1 + 0.5,
                    opacity: Math.random() * 0.8 + 0.2
                });
            }
        };

        const createMeteor = () => {
            return {
                x: Math.random() * width,
                y: -50,
                length: Math.random() * 80 + 40,
                speed: Math.random() * 8 + 6,
                opacity: Math.random() * 0.8 + 0.2,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3
            };
        };

        const drawMeteorShower = () => {
            // Dark gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#0d1117');
            gradient.addColorStop(1, '#1a1d29');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Static stars
            particles.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();
            });

            // Meteors
            if (!prefersReducedMotion && Math.random() < 0.03 && meteors.length < 5) {
                meteors.push(createMeteor());
            }

            meteors.forEach((meteor, index) => {
                const dx = Math.cos(meteor.angle) * meteor.length;
                const dy = Math.sin(meteor.angle) * meteor.length;

                // Gradient tail
                const gradient = ctx.createLinearGradient(
                    meteor.x, meteor.y,
                    meteor.x - dx, meteor.y - dy
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`);
                gradient.addColorStop(0.5, `rgba(150, 200, 255, ${meteor.opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(meteor.x, meteor.y);
                ctx.lineTo(meteor.x - dx, meteor.y - dy);
                ctx.stroke();

                if (!prefersReducedMotion) {
                    meteor.x += Math.cos(meteor.angle) * meteor.speed;
                    meteor.y += Math.sin(meteor.angle) * meteor.speed;
                }

                // Remove off-screen meteors
                if (meteor.y > height + 100 || meteor.x > width + 100) {
                    meteors.splice(index, 1);
                }
            });
        };

        // PLANETS THEME
        const initPlanets = () => {
            // Background stars
            for (let i = 0; i < 100; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1 + 0.3,
                    opacity: Math.random() * 0.7 + 0.3
                });
            }

            // Create planets
            const planetColors = [
                ['#ff6b6b', '#ee5a6f'], // Red
                ['#4ecdc4', '#44a08d'], // Teal
                ['#ffbe76', '#f0932b'], // Orange
                ['#a29bfe', '#6c5ce7'], // Purple
                ['#fd79a8', '#e84393']  // Pink
            ];

            for (let i = 0; i < 3; i++) {
                const colors = planetColors[Math.floor(Math.random() * planetColors.length)];
                planets.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 60 + 40,
                    colors: colors,
                    orbitRadius: Math.random() * 100 + 50,
                    orbitSpeed: (Math.random() - 0.5) * 0.001,
                    angle: Math.random() * Math.PI * 2,
                    centerX: Math.random() * width,
                    centerY: Math.random() * height
                });
            }
        };

        const drawPlanets = () => {
            // Dark space
            const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
            gradient.addColorStop(0, '#1a1d3a');
            gradient.addColorStop(1, '#0a0e27');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Stars
            particles.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();
            });

            // Planets
            planets.forEach(planet => {
                if (!prefersReducedMotion) {
                    planet.angle += planet.orbitSpeed;
                    planet.x = planet.centerX + Math.cos(planet.angle) * planet.orbitRadius;
                    planet.y = planet.centerY + Math.sin(planet.angle) * planet.orbitRadius;
                }

                // Planet gradient
                const planetGradient = ctx.createRadialGradient(
                    planet.x - planet.radius * 0.3,
                    planet.y - planet.radius * 0.3,
                    0,
                    planet.x,
                    planet.y,
                    planet.radius
                );
                planetGradient.addColorStop(0, planet.colors[0]);
                planetGradient.addColorStop(1, planet.colors[1]);

                // Glow
                ctx.shadowBlur = 30;
                ctx.shadowColor = planet.colors[0];
                ctx.beginPath();
                ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
                ctx.fillStyle = planetGradient;
                ctx.fill();
                ctx.shadowBlur = 0;
            });
        };

        // NEBULA THEME
        const initNebula = () => {
            for (let i = 0; i < 80; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1 + 0.5,
                    opacity: Math.random() * 0.8 + 0.2
                });
            }
        };

        const drawNebula = () => {
            // Dark base
            ctx.fillStyle = '#0a0e1a';
            ctx.fillRect(0, 0, width, height);

            // Nebula clouds
            const time = Date.now() * 0.0001;

            // Purple cloud
            const purpleGradient = ctx.createRadialGradient(
                width * 0.3 + Math.sin(time) * 50,
                height * 0.4 + Math.cos(time) * 50,
                0,
                width * 0.3,
                height * 0.4,
                400
            );
            purpleGradient.addColorStop(0, 'rgba(138, 43, 226, 0.15)');
            purpleGradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.08)');
            purpleGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = purpleGradient;
            ctx.fillRect(0, 0, width, height);

            // Pink cloud
            const pinkGradient = ctx.createRadialGradient(
                width * 0.7 + Math.cos(time * 0.7) * 60,
                height * 0.6 + Math.sin(time * 0.7) * 60,
                0,
                width * 0.7,
                height * 0.6,
                500
            );
            pinkGradient.addColorStop(0, 'rgba(255, 20, 147, 0.12)');
            pinkGradient.addColorStop(0.5, 'rgba(255, 20, 147, 0.06)');
            pinkGradient.addColorStop(1, 'rgba(255, 20, 147, 0)');
            ctx.fillStyle = pinkGradient;
            ctx.fillRect(0, 0, width, height);

            // Blue cloud
            const blueGradient = ctx.createRadialGradient(
                width * 0.5 + Math.sin(time * 1.2) * 40,
                height * 0.3 + Math.cos(time * 1.2) * 40,
                0,
                width * 0.5,
                height * 0.3,
                450
            );
            blueGradient.addColorStop(0, 'rgba(0, 191, 255, 0.1)');
            blueGradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.05)');
            blueGradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
            ctx.fillStyle = blueGradient;
            ctx.fillRect(0, 0, width, height);

            // Stars
            particles.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();
            });
        };

        // Animation loop
        const animate = () => {
            if (theme === 'starfield') {
                drawStarfield();
            } else if (theme === 'meteor') {
                drawMeteorShower();
            } else if (theme === 'planets') {
                drawPlanets();
            } else if (theme === 'nebula') {
                drawNebula();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        // Handle resize
        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initTheme();
        };

        window.addEventListener('resize', handleResize);

        // Initialize and start animation
        initTheme();
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
};

export default SpaceBackground;
