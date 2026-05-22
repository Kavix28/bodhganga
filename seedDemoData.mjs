import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bodhganga';

async function seedDemoData() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas / Local for seeding...');
        const db = client.db();

        // 1. Seed Demo Products (PDFs and Audios) for Phase 4 & Phase 7
        const productsCollection = db.collection('products');
        
        const demoProducts = [
            {
                title: 'UPSC & State PSC GS Economy Core - Master Notes',
                description: 'Fully updated Indian Economy syllabus mapping macro & micro developments, fiscal policies, and economic surveys.',
                stateSlug: 'all',
                type: 'PDF',
                category: 'Notes',
                price: 299.00,
                originalPrice: 799.00,
                pages: 340,
                language: 'Bilingual (Eng/Hindi)',
                rating: 4.9,
                reviewCount: 382,
                downloadCount: 4890,
                previewUrl: 'https://picsum.photos/400/250?random=p1',
                storageKey: 'demo-files/gs-economy-core.pdf',
                isPublished: true,
                isBestseller: true,
                trending: true,
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Product'
            },
            {
                title: 'Bihar BPSC 70th Civil Services History Booster',
                description: 'Specialized analysis of ancient, medieval, and modern Bihar heritage tailored for preliminary and mains exams.',
                stateSlug: 'bihar',
                type: 'PDF',
                category: 'Notes',
                price: 199.00,
                originalPrice: 499.00,
                pages: 220,
                language: 'Hindi Medium',
                rating: 4.8,
                reviewCount: 194,
                downloadCount: 2120,
                previewUrl: 'https://picsum.photos/400/250?random=p2',
                storageKey: 'demo-files/bihar-history.pdf',
                isPublished: true,
                isBestseller: true,
                trending: false,
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Product'
            },
            {
                title: 'Maharashtra MPSC GS Polity & Social Justice Guide',
                description: 'Comprehensive notes for MPSC prelims & mains, incorporating major administrative reforms and Maharashtra specific acts.',
                stateSlug: 'maharashtra',
                type: 'PDF',
                category: 'Notes',
                price: 249.00,
                originalPrice: 599.00,
                pages: 280,
                language: 'Marathi/English',
                rating: 4.9,
                reviewCount: 148,
                downloadCount: 1740,
                previewUrl: 'https://picsum.photos/400/250?random=p3',
                storageKey: 'demo-files/maharashtra-polity.pdf',
                isPublished: true,
                isBestseller: false,
                trending: true,
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Product'
            },
            {
                title: 'UPPSC Mains GS-I to GS-IV Solved Model Answers',
                description: 'Topper-curated model answers covering history, geography, social issues, and security challenges for Uttar Pradesh PSC.',
                stateSlug: 'uttar-pradesh',
                type: 'PDF',
                category: 'Question Bank',
                price: 399.00,
                originalPrice: 999.00,
                pages: 450,
                language: 'English Medium',
                rating: 5.0,
                reviewCount: 520,
                downloadCount: 6310,
                previewUrl: 'https://picsum.photos/400/250?random=p4',
                storageKey: 'demo-files/uppsc-solved-mains.pdf',
                isPublished: true,
                isBestseller: true,
                trending: true,
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Product'
            },
            {
                title: 'Rajasthan RAS General Science & Technology Pack',
                description: 'Specially formulated notes tracking basic sciences, space, biotechnology, and technological focus of Rajasthan.',
                stateSlug: 'rajasthan',
                type: 'PDF',
                category: 'Bundle',
                price: 349.00,
                originalPrice: 899.00,
                pages: 310,
                language: 'Bilingual (Eng/Hindi)',
                rating: 4.7,
                reviewCount: 89,
                downloadCount: 940,
                previewUrl: 'https://picsum.photos/400/250?random=p5',
                storageKey: 'demo-files/ras-science.pdf',
                isPublished: true,
                isBestseller: false,
                trending: false,
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Product'
            },
            {
                title: 'Union Territories Core GK & Administration Special',
                description: 'Specialized dossier detailing the unique constitutional status, history, and current affairs of all 8 Indian UTs.',
                stateSlug: 'delhi',
                type: 'PDF',
                category: 'Notes',
                price: 149.00,
                originalPrice: 399.00,
                pages: 160,
                language: 'English Medium',
                rating: 4.9,
                reviewCount: 75,
                downloadCount: 820,
                previewUrl: 'https://picsum.photos/400/250?random=p6',
                storageKey: 'demo-files/ut-core-gk.pdf',
                isPublished: true,
                isBestseller: false,
                trending: true,
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Product'
            }
        ];

        await productsCollection.deleteMany({});
        await productsCollection.insertMany(demoProducts);
        console.log('Premium demo products seeded successfully.');

        // 2. Seed Video Lectures into "content" collection (Phase 3 & Phase 7)
        const contentCollection = db.collection('content');
        const demoContent = [
            {
                title: 'Bihar Budget & Economic Survey 2025 Comprehensive Analysis',
                description: 'High-yield session mapping Bihar financial indicators, major welfare schemes, and infrastructure investments for 70th BPSC.',
                type: 'video',
                stateId: 'bihar',
                fileUrl: 'https://www.youtube.com/embed/bYg_51_yP-0',
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Content'
            },
            {
                title: 'Maharashtra Geography & Administrative Landmarks for MPSC',
                description: 'Direct mapping of core river systems, physical divisions, and regional soil distributions relevant to Maharashtra PSC.',
                type: 'video',
                stateId: 'maharashtra',
                fileUrl: 'https://www.youtube.com/embed/9o4bJ9HjB8M',
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Content'
            },
            {
                title: 'Uttar Pradesh Ancient History & Local Movements',
                description: 'Exam-oriented study of regional ancient sites, Mahajanapadas, and modern freedom fight contributions of UP aspirants.',
                type: 'video',
                stateId: 'uttar-pradesh',
                fileUrl: 'https://www.youtube.com/embed/bYg_51_yP-0',
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Content'
            },
            {
                title: 'Rajasthan Arts, Architecture & Dynastic Heritage',
                description: 'Visual roadmap of Fort architecture, Rajput schools of painting, and structural heritage for RAS Prelims and Mains.',
                type: 'video',
                stateId: 'rajasthan',
                fileUrl: 'https://www.youtube.com/embed/9o4bJ9HjB8M',
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Content'
            }
        ];

        await contentCollection.deleteMany({ type: 'video' });
        await contentCollection.insertMany(demoContent);
        console.log('Premium YouTube video lecture contents seeded successfully.');

        // 3. Seed Demo Orders & Purchases
        const user = await db.collection('users').findOne({ email: 'admin@bodhganga.in' });
        
        if (user) {
            const product = await productsCollection.findOne({ stateSlug: 'bihar' });
            
            if (product) {
                const order = {
                    razorpayOrderId: 'order_demo12345',
                    razorpayPaymentId: 'pay_demo12345',
                    razorpaySignature: 'demo_signature',
                    userId: user._id.toString(),
                    productId: product._id.toString(),
                    amount: product.price,
                    currency: 'INR',
                    status: 'PAID',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _class: 'com.bodhganga.bodhganga.entity.Order'
                };
                
                await db.collection('orders').deleteMany({});
                const orderResult = await db.collection('orders').insertOne(order);

                const purchase = {
                    userId: user._id.toString(),
                    productId: product._id.toString(),
                    orderId: orderResult.insertedId.toString(),
                    purchaseDate: new Date(),
                    downloadCount: 1,
                    _class: 'com.bodhganga.bodhganga.entity.Purchase'
                };

                await db.collection('purchases').deleteMany({});
                await db.collection('purchases').insertOne(purchase);
                
                console.log('Demo purchase logs successfully integrated into admin order index.');
            }
        } else {
            console.warn('Default admin user not yet present. Skipping custom order seeder.');
        }

    } catch (error) {
        console.error('Database seeding failed:', error);
    } finally {
        await client.close();
        console.log('Database connection cleanly released.');
    }
}

seedDemoData();
