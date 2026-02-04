// Accurate state coordinates for India map overlay
// Based on 1024x1024 viewBox with proper geographic projection
// Image actual dimensions match standard Mercator-like projection

export const STATE_COORDINATES = {
    // Northern states
    'Jammu and Kashmir': { x: 220, y: 140 },
    'Himachal Pradesh': { x: 260, y: 200 },
    'Punjab': { x: 240, y: 210 },
    'Uttarakhand': { x: 310, y: 230 },
    'Haryana': { x: 270, y: 250 },
    'Delhi': { x: 290, y: 260 },

    // Northwestern states
    'Rajasthan': { x: 250, y: 310 },

    // Northern plains
    'Uttar Pradesh': { x: 330, y: 310 },
    'Bihar': { x: 410, y: 330 },

    // Northeastern states
    'Sikkim': { x: 420, y: 260 },
    'Arunachal Pradesh': { x: 510, y: 220 },
    'Assam': { x: 490, y: 300 },
    'Nagaland': { x: 530, y: 300 },
    'Manipur': { x: 530, y: 340 },
    'Mizoram': { x: 515, y: 380 },
    'Tripura': { x: 490, y: 370 },
    'Meghalaya': { x: 475, y: 330 },

    // Eastern states
    'West Bengal': { x: 430, y: 370 },
    'Jharkhand': { x: 410, y: 380 },
    'Odisha': { x: 410, y: 440 },

    // Central states
    'Madhya Pradesh': { x: 310, y: 400 },
    'Chhattisgarh': { x: 380, y: 440 },

    // Western states
    'Gujarat': { x: 220, y: 395 },
    'Daman and Diu': { x: 220, y: 440 },
    'Dadra and Nagar Haveli': { x: 235, y: 450 },
    'Maharashtra': { x: 280, y: 480 },
    'Goa': { x: 258, y: 565 },

    // Southern states
    'Karnataka': { x: 290, y: 600 },
    'Telangana': { x: 320, y: 510 },
    'Andhra Pradesh': { x: 340, y: 570 },
    'Tamil Nadu': { x: 315, y: 670 },
    'Kerala': { x: 280, y: 680 },
    'Puducherry': { x: 325, y: 665 },
    'Lakshadweep': { x: 200, y: 680 },

    // Islands
    'Andaman and Nicobar Islands': { x: 530, y: 650 }
};

// State name mappings for consistency
export const STATE_NAME_ALIASES = {
    'J&K': 'Jammu and Kashmir',
    'HP': 'Himachal Pradesh',
    'UK': 'Uttarakhand',
    'HR': 'Haryana',
    'DL': 'Delhi',
    'RJ': 'Rajasthan',
    'UP': 'Uttar Pradesh',
    'BR': 'Bihar',
    'WB': 'West Bengal',
    'JH': 'Jharkhand',
    'OR': 'Odisha',
    'MP': 'Madhya Pradesh',
    'CG': 'Chhattisgarh',
    'GJ': 'Gujarat',
    'MH': 'Maharashtra',
    'GA': 'Goa',
    'KA': 'Karnataka',
    'TG': 'Telangana',
    'AP': 'Andhra Pradesh',
    'TN': 'Tamil Nadu',
    'KL': 'Kerala',
    'SK': 'Sikkim',
    'AR': 'Arunachal Pradesh',
    'AS': 'Assam',
    'NL': 'Nagaland',
    'MN': 'Manipur',
    'MZ': 'Mizoram',
    'TR': 'Tripura',
    'ML': 'Meghalaya'
};
