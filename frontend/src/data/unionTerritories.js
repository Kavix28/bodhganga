/**
 * All 8 Union Territories of India
 * Data structure for BodhGanga Academy
 */

export const unionTerritories = [
    {
        id: 'andaman-nicobar',
        name: 'Andaman and Nicobar Islands',
        code: 'AN',
        capital: 'Port Blair',
        notesCount: 120,
        questionsCount: 850,
        solutionsCount: 750,
        exams: ['AN Administration', 'AN Police'],
        description: 'Study materials for Andaman and Nicobar Islands administration and related examinations.'
    },
    {
        id: 'chandigarh',
        name: 'Chandigarh',
        code: 'CH',
        capital: 'Chandigarh',
        notesCount: 195,
        questionsCount: 1450,
        solutionsCount: 1320,
        exams: ['CHT Administration', 'Chandigarh Police'],
        description: 'Preparation material for Chandigarh Union Territory administration examinations.'
    },
    {
        id: 'dnh-dd',
        name: 'Dadra and Nagar Haveli and Daman and Diu',
        code: 'DH',
        capital: 'Daman',
        notesCount: 110,
        questionsCount: 780,
        solutionsCount: 690,
        exams: ['DNH-DD Administration'],
        description: 'Study resources for Dadra and Nagar Haveli and Daman and Diu administration exams.'
    },
    {
        id: 'delhi',
        name: 'Delhi (National Capital Territory)',
        code: 'DL',
        capital: 'New Delhi',
        notesCount: 480,
        questionsCount: 3600,
        solutionsCount: 3350,
        exams: ['DSSSB', 'Delhi Police', 'DTC', 'DMRC'],
        description: 'Comprehensive resource for Delhi Subordinate Services Selection Board, Police, and other examinations.'
    },
    {
        id: 'jammu-kashmir',
        name: 'Jammu and Kashmir',
        code: 'JK',
        capital: 'Srinagar (Summer), Jammu (Winter)',
        notesCount: 320,
        questionsCount: 2400,
        solutionsCount: 2200,
        exams: ['JKPSC', 'JK Police', 'JKSSB'],
        description: 'Complete study material for Jammu and Kashmir Public Service Commission and state examinations.'
    },
    {
        id: 'ladakh',
        name: 'Ladakh',
        code: 'LA',
        capital: 'Leh',
        notesCount: 135,
        questionsCount: 920,
        solutionsCount: 820,
        exams: ['Ladakh Administration', 'Ladakh Police'],
        description: 'Preparation materials for Ladakh Union Territory administration and related exams.'
    },
    {
        id: 'lakshadweep',
        name: 'Lakshadweep',
        code: 'LD',
        capital: 'Kavaratti',
        notesCount: 95,
        questionsCount: 680,
        solutionsCount: 600,
        exams: ['Lakshadweep Administration'],
        description: 'Study materials for Lakshadweep Union Territory administration examinations.'
    },
    {
        id: 'puducherry',
        name: 'Puducherry',
        code: 'PY',
        capital: 'Puducherry',
        notesCount: 215,
        questionsCount: 1580,
        solutionsCount: 1450,
        exams: ['Puducherry PSC', 'Puducherry Police'],
        description: 'Comprehensive resource for Puducherry Public Service Commission and state-level exams.'
    }
];

export const getUTById = (id) => {
    return unionTerritories.find(ut => ut.id === id);
};

export const getUTsByName = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    return unionTerritories.filter(ut =>
        ut.name.toLowerCase().includes(term) ||
        ut.code.toLowerCase().includes(term)
    );
};

export const getTotalUTsCount = () => unionTerritories.length;
