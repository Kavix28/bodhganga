import { useEffect } from 'react';

export const useSEO = ({ title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl }) => {
    useEffect(() => {
        if (title) {
            document.title = `${title} | BODHGANGA Knowledge Portal`;
        }

        const updateMetaTag = (attrName, attrVal, contentVal) => {
            if (!contentVal) return;
            let metaTag = document.querySelector(`meta[${attrName}="${attrVal}"]`);
            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.setAttribute(attrName, attrVal);
                document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', contentVal);
        };

        updateMetaTag('name', 'description', description);
        updateMetaTag('name', 'keywords', keywords);
        updateMetaTag('property', 'og:title', ogTitle || title);
        updateMetaTag('property', 'og:description', ogDescription || description);
        updateMetaTag('property', 'og:image', ogImage || '/logo.png');
        updateMetaTag('property', 'og:url', ogUrl || window.location.href);
        updateMetaTag('property', 'og:type', 'website');
    }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl]);
};

