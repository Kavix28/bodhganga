/**
 * SectionWrapper — Consistent section padding and optional heading
 */
export default function SectionWrapper({ heading, subheading, children, className = '', id }) {
    return (
        <section id={id} className={`py-[24px] ${className}`}>
            <div className="container">
                {(heading || subheading) && (
                    <div className="mb-[16px]">
                        {subheading && (
                            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-1">
                                {subheading}
                            </p>
                        )}
                        {heading && (
                            <h2 className="text-2xl font-semibold text-gray-800 border-b-2 border-orange-400 inline-block pb-1">
                                {heading}
                            </h2>
                        )}
                    </div>
                )}
                {children}
            </div>
        </section>
    );
}
