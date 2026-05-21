import { useEffect } from 'react';

export const useSEO = ({ title, description }) => {
    useEffect(() => {
        if (title) {
            document.title = `${title} | BODHGANGA Knowledge Portal`;
        }

        if (description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = "description";
                document.head.appendChild(metaDesc);
            }
            metaDesc.content = description;
        }

        // Cleanup isn't strictly necessary for title/description if the next page overrides them, 
        // but restoring default title could happen here if deeply required.
    }, [title, description]);
};
