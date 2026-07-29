/**
 * Test Series & Test Your Knowledge Master Data
 * Specs from BodhGanga Test Your Knowledge Documentation
 */

export const statesAndUtTestData = [
    {
        id: 'chhattisgarh',
        name: 'Chhattisgarh',
        type: 'State',
        code: 'CG',
        capital: 'Raipur',
        totalDistricts: 33,
        coveredDistrictsCount: 7,
        totalTests: 24,
        freeTestAvailable: true,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
        districts: [
            {
                id: 'balod',
                name: 'Balod',
                isAvailable: true,
                easyTestsCount: 1,
                advancedTestsCount: 1,
                masterTestsCount: 1,
                notesAvailable: true,
                price: 199,
                description: 'Explore historical heritage, Tandula dam, mining belts, and agricultural prowess of Balod district.'
            },
            {
                id: 'baloda-bazar',
                name: 'Baloda Bazar–Bhatapara',
                isAvailable: true,
                easyTestsCount: 1,
                advancedTestsCount: 1,
                masterTestsCount: 1,
                notesAvailable: true,
                price: 199,
                description: 'Known as the cement hub of Chhattisgarh with rich cultural history.'
            },
            {
                id: 'bastar',
                name: 'Bastar',
                isAvailable: true,
                easyTestsCount: 1,
                advancedTestsCount: 1,
                masterTestsCount: 1,
                notesAvailable: true,
                price: 249,
                description: 'Famous for Chitrakote waterfalls, tribal heritage, and dense forests.'
            },
            {
                id: 'bilaspur',
                name: 'Bilaspur',
                isAvailable: true,
                easyTestsCount: 1,
                advancedTestsCount: 1,
                masterTestsCount: 1,
                notesAvailable: true,
                price: 249,
                description: 'The High Court city and cultural heartland of Chhattisgarh.'
            },
            {
                id: 'durg',
                name: 'Durg',
                isAvailable: true,
                easyTestsCount: 1,
                advancedTestsCount: 1,
                masterTestsCount: 1,
                notesAvailable: true,
                price: 199,
                description: 'Major industrial and educational cluster near Bhilai Steel Plant.'
            },
            {
                id: 'raipur',
                name: 'Raipur',
                isAvailable: true,
                easyTestsCount: 1,
                advancedTestsCount: 1,
                masterTestsCount: 1,
                notesAvailable: true,
                price: 299,
                description: 'The capital district, administrative nerve center, and trade hub.'
            },
            {
                id: 'surguja',
                name: 'Surguja',
                isAvailable: true,
                easyTestsCount: 1,
                advancedTestsCount: 1,
                masterTestsCount: 1,
                notesAvailable: true,
                price: 199,
                description: 'Picturesque plateau region with Ramgarh caves and ancient art.'
            },
            { id: 'dhamtari', name: 'Dhamtari', isAvailable: false },
            { id: 'janjgir-champa', name: 'Janjgir–Champa', isAvailable: false },
            { id: 'korba', name: 'Korba', isAvailable: false },
            { id: 'raigarh', name: 'Raigarh', isAvailable: false },
            { id: 'rajanandgaon', name: 'Rajnandgaon', isAvailable: false }
        ],
        subjectTests: [
            { id: 'cg-districts', title: 'Districts of Chhattisgarh', testsCount: 5, category: 'Districts' },
            { id: 'cg-history', title: 'Chhattisgarh Ancient & Modern History', testsCount: 8, category: 'History' },
            { id: 'cg-geography', title: 'Physiography & River Systems', testsCount: 7, category: 'Geography' },
            { id: 'cg-art-culture', title: 'Tribal Art, Songs & Festivals', testsCount: 6, category: 'Art and Culture' },
            { id: 'cg-heritage', title: 'Heritage Sites & Historical Monuments', testsCount: 4, category: 'Heritage and Monuments' },
            { id: 'cg-polity', title: 'State Governance, Administration & Economy', testsCount: 6, category: 'State Polity, Administration and Economy' },
            { id: 'cg-personalities', title: 'Important Historical Personalities', testsCount: 3, category: 'Important Personalities' },
            { id: 'cg-current', title: 'Chhattisgarh State Current Affairs 2025-26', testsCount: 10, category: 'Current Affairs' },
            { id: 'cg-mock', title: 'Complete CGPSC Full Length Mock Test', testsCount: 3, category: 'Complete State Mock Test' }
        ]
    },
    {
        id: 'madhya-pradesh',
        name: 'Madhya Pradesh',
        type: 'State',
        code: 'MP',
        capital: 'Bhopal',
        totalDistricts: 55,
        coveredDistrictsCount: 5,
        totalTests: 15,
        freeTestAvailable: true,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 'uttar-pradesh',
        name: 'Uttar Pradesh',
        type: 'State',
        code: 'UP',
        capital: 'Lucknow',
        totalDistricts: 75,
        coveredDistrictsCount: 12,
        totalTests: 40,
        freeTestAvailable: true,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 'bihar',
        name: 'Bihar',
        type: 'State',
        code: 'BR',
        capital: 'Patna',
        totalDistricts: 38,
        coveredDistrictsCount: 8,
        totalTests: 20,
        freeTestAvailable: true,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 'rajasthan',
        name: 'Rajasthan',
        type: 'State',
        code: 'RJ',
        capital: 'Jaipur',
        totalDistricts: 50,
        coveredDistrictsCount: 6,
        totalTests: 18,
        freeTestAvailable: true,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 'maharashtra',
        name: 'Maharashtra',
        type: 'State',
        code: 'MH',
        capital: 'Mumbai',
        totalDistricts: 36,
        coveredDistrictsCount: 4,
        totalTests: 12,
        freeTestAvailable: true,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 'odisha',
        name: 'Odisha',
        type: 'State',
        code: 'OD',
        capital: 'Bhubaneswar',
        totalDistricts: 30,
        coveredDistrictsCount: 0,
        totalTests: 0,
        freeTestAvailable: false,
        isAvailable: false,
        image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 'delhi',
        name: 'Delhi',
        type: 'UT',
        code: 'DL',
        capital: 'New Delhi',
        totalDistricts: 11,
        coveredDistrictsCount: 11,
        totalTests: 15,
        freeTestAvailable: true,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=800'
    }
];

// Sample Question Set Generator for Balod District
export const sampleQuestionsData = {
    easy: Array.from({ length: 20 }, (_, i) => ({
        id: `easy_${i + 1}`,
        topic: ['Geography', 'History', 'Economy', 'Administration', 'Culture'][i % 5],
        difficulty: 'Easy',
        question: `[Q${i + 1}] Which key water reservoir / dam project is located in Balod district of Chhattisgarh?`,
        options: [
            'Tandula Dam',
            'Gangrel Dam',
            'Hasdeo Bango Dam',
            'Kutaghat Dam'
        ],
        correctAnswer: 0,
        explanation: 'Tandula Dam was constructed across Tandula and Sukha rivers in 1912 and is a premier irrigation reservoir in Balod district.'
    })),
    advanced: Array.from({ length: 20 }, (_, i) => ({
        id: `adv_${i + 1}`,
        topic: ['Geography', 'History', 'Economy', 'Administration', 'Culture'][i % 5],
        difficulty: 'Advanced',
        question: `[Q${i + 1}] Consider the following statements regarding the geological formation and mineral wealth of Balod District:\n1. Dalli Rajhara iron ore complex supplies hematite ore to Bhilai Steel Plant.\n2. The district belongs entirely to the Cuddapah sedimentary basin.\nWhich of the statements given above is/are correct?`,
        options: [
            '1 only',
            '2 only',
            'Both 1 and 2',
            'Neither 1 nor 2'
        ],
        correctAnswer: 0,
        explanation: 'Statement 1 is correct: Dalli Rajhara in Balod provides high-grade iron ore to Bhilai Steel Plant. Statement 2 is incorrect as Archean granite and Dharwar metamorphic rocks dominate the iron ore ridge.'
    })),
    master: Array.from({ length: 75 }, (_, i) => ({
        id: `master_${i + 1}`,
        topic: ['History', 'Geography', 'Rivers and dams', 'Economy and agriculture', 'Art and culture', 'Tribes and communities', 'Important personalities', 'Administration'][i % 8],
        difficulty: i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Moderate' : 'Difficult',
        question: `[Master Q${i + 1}] Analytical Question on ${['History', 'Geography', 'Rivers and dams', 'Economy and agriculture', 'Art and culture', 'Tribes and communities', 'Important personalities', 'Administration'][i % 8]} of Balod District`,
        options: [
            'Option A: Primary historical attribute',
            'Option B: Secondary geographical factor',
            'Option C: Administrative landmark',
            'Option D: Socio-cultural tradition'
        ],
        correctAnswer: 0,
        explanation: 'Comprehensive explanation detailing state administrative structures, tribal heritage, and physical geography.'
    }))
};

export const sampleBalodNotes = {
    title: 'Balod District Complete NDDE Study Notes',
    subtitle: 'Comprehensive Horizontal Integration Framework for CGPSC, Vyapam & State Exams',
    sections: [
        {
            heading: '1. Executive Overview & Geography',
            content: 'Balod district was carved out of Durg district on January 1, 2012. It covers an area of 3,527 km² bounded by Rajnandgaon, Durg, Dhamtari, and Kanker districts. Main rivers include Tandula and Kharun.'
        },
        {
            heading: '2. Mineral & Industrial Wealth',
            content: 'Home to the Dalli Rajhara iron ore hills, Balod plays a foundational role in India steel sector by supplying raw iron ore to the Bhilai Steel Plant (SAIL).'
        },
        {
            heading: '3. Cultural & Heritage Significance',
            content: 'Famous for Siyadevi temple surrounded by scenic forests, Jhalmala Ganga Maiya temple, and ancient megalithic sites at Sorar.'
        }
    ]
};
