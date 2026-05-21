import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bodhganga';

async function seedDemoData() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db();

        // 1. Seed Demo Products (PDFs and Audios)
        const productsCollection = db.collection('products');
        
        const demoProducts = [
            {
                title: 'Andaman & Nicobar Islands - Complete History (PDF)',
                description: 'A comprehensive guide covering the rich history and geography of the Andaman and Nicobar Islands.',
                stateSlug: 'andaman-and-nicobar',
                type: 'PDF',
                price: 199.00,
                previewUrl: 'https://picsum.photos/400/250?random=1',
                storageKey: 'demo-files/andaman-history.pdf',
                isPublished: true,
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Product'
            },
            {
                title: 'Kerala PSC - Audio Course',
                description: 'Full audio preparation course for Kerala PSC examinations.',
                stateSlug: 'kerala',
                type: 'AUDIO',
                price: 499.00,
                previewUrl: 'https://picsum.photos/400/250?random=2',
                storageKey: 'demo-files/kerala-psc.mp3',
                isPublished: true,
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Product'
            },
            {
                title: 'UP Police Constable - Practice Set (PDF)',
                description: '10 full-length practice sets with detailed solutions.',
                stateSlug: 'uttar-pradesh',
                type: 'PDF',
                price: 149.00,
                previewUrl: 'https://picsum.photos/400/250?random=3',
                storageKey: 'demo-files/up-police.pdf',
                isPublished: true,
                createdAt: new Date(),
                _class: 'com.bodhganga.bodhganga.entity.Product'
            }
        ];

        await productsCollection.deleteMany({});
        await productsCollection.insertMany(demoProducts);
        console.log('Demo products seeded successfully.');

        // 2. Seed Demo Orders (Assuming we have a user with email admin@bodhganga.in)
        const user = await db.collection('users').findOne({ email: 'admin@bodhganga.in' });
        
        if (user) {
            const product = await productsCollection.findOne({ stateSlug: 'kerala' });
            
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
                
                console.log('Demo order and purchase seeded successfully.');
            }
        } else {
            console.warn('Admin user not found, skipping order seeding.');
        }

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await client.close();
    }
}

seedDemoData();
