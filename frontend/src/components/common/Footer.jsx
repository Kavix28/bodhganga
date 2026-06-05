import { Link } from 'react-router-dom';
import { Mail, Phone, ArrowRight } from 'lucide-react';
import Logo from './Logo';

const Footer = () => {
    const year = new Date().getFullYear();

    const links = {
        Platform: [
            { label: 'States & UTs',    to: '/states' },
            { label: 'Courses',         to: '/courses' },
            { label: 'Question Bank',   to: '/question-bank' },
            { label: 'Subjects',        to: '/subjects' },
            { label: 'Digital Store',   to: '/store' },
            { label: 'Blog',            to: '/blog' },
        ],
        Exams: [
            { label: 'UPSC Preparation',       to: '/subjects' },
            { label: 'SSC CGL Portal',    to: '/subjects' },
            { label: 'State PSC Exams',  to: '/states' },
            { label: 'Railway Exams',    to: '/subjects' },
            { label: 'Banking Special',    to: '/subjects' },
            { label: 'Police recruitment',     to: '/subjects' },
        ],
        Company: [
            { label: 'About India',     to: '/about-india' },
            { label: 'Privacy Policy',  to: '/' },
            { label: 'Terms of Use',    to: '/' },
            { label: 'Contact Us',      to: 'mailto:bodhgangaacademy@gmail.com' },
            { label: 'Careers',         to: '/' },
        ],
    };

    return (
        <footer className="bg-emerald-dark text-white border-t border-gold/15">
            {/* Heritage subtle top border line */}
            <div className="h-1 bg-gradient-to-r from-emerald via-gold to-emerald" />

            {/* Main footer */}
            <div className="container-custom py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

                    {/* Brand column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link to="/" className="flex items-center group transition-all duration-300 hover:opacity-95">
                            <Logo variant="horizontal" size="md" showGlow={true} />
                        </Link>
                        <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                            India's premier premium digital academy for competitive and heritage exam preparation. Curating elite study resources for all 36 States and Union Territories.
                        </p>
                        <div className="pt-2">
                            <p className="text-gold font-bold text-base flex items-center gap-1.5">
                                India Unlocked 🇮🇳
                            </p>
                            <p className="text-white/80 font-medium text-xs tracking-wider uppercase mt-1">
                                Decoding India, District by District
                            </p>
                        </div>
                        <div className="space-y-3">
                            <a href="mailto:bodhgangaacademy@gmail.com" className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-gold hover:text-gold-light transition-colors">
                                <Mail className="w-4 h-4 text-white/50" /> bodhgangaacademy@gmail.com
                            </a>
                            <a href="tel:+916265143178" className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-gold hover:text-gold-light transition-colors">
                                <Phone className="w-4 h-4 text-white/50" /> 6265143178
                            </a>
                        </div>
                        {/* Social */}
                        <div className="flex gap-2">
                            {['𝕏', 'f', 'in', '▶'].map((s, i) => (
                                <a key={i} href="#"
                                    className="w-10 h-10 bg-white/5 hover:bg-gold border border-gold/15 hover:border-gold rounded-xl flex items-center justify-center text-xs font-bold text-white/80 hover:text-emerald-dark transition-all duration-300">
                                    {s}
                                </a>
                             ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(links).map(([title, items]) => (
                        <div key={title} className="space-y-6">
                            <h4 className="text-[11px] font-bold text-gold uppercase tracking-widest">{title}</h4>
                            <ul className="space-y-3.5">
                                {items.map(item => (
                                    <li key={item.label}>
                                        {item.to.startsWith('mailto:') || item.to.startsWith('tel:') ? (
                                            <a href={item.to}
                                                className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-gold flex items-center gap-1 group transition-colors duration-300">
                                                <span className="w-0 group-hover:w-1.5 h-0.5 bg-gold transition-all duration-300" />
                                                {item.label}
                                            </a>
                                        ) : (
                                            <Link to={item.to}
                                                className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-gold flex items-center gap-1 group transition-colors duration-300">
                                                <span className="w-0 group-hover:w-1.5 h-0.5 bg-gold transition-all duration-300" />
                                                {item.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gold/10 bg-emerald-darker/60 backdrop-blur-md">
                <div className="container-custom py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/40 font-medium">
                        © {year} BodhGanga Academy. All rights reserved. Built with pride for Bharat.
                    </p>
                    <div className="flex items-center gap-6 text-xs text-white/40 font-semibold uppercase tracking-wider">
                        <Link to="/" className="hover:text-gold transition-colors">Privacy Policy</Link>
                        <Link to="/" className="hover:text-gold transition-colors">Terms of Service</Link>
                        <Link to="/" className="hover:text-gold transition-colors">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
