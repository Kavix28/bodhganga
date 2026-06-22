package com.bodhganga.bodhganga.config;

import com.bodhganga.bodhganga.entity.BlogPost;
import com.bodhganga.bodhganga.entity.Courses;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.repo.BlogPostRepo;
import com.bodhganga.bodhganga.repo.CourseRepo;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.StateRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Data loader to populate sample courses and products in the database on startup
 */
@Component
public class DataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    private final CourseRepo courseRepo;
    private final BlogPostRepo blogPostRepo;
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final ProductRepo productRepo;
    private final StateRepo stateRepo;
    private final org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    public DataLoader(CourseRepo courseRepo, BlogPostRepo blogPostRepo,
                      UserRepo userRepo, PasswordEncoder passwordEncoder,
                      ProductRepo productRepo, StateRepo stateRepo,
                      org.springframework.data.mongodb.core.MongoTemplate mongoTemplate) {
        this.courseRepo = courseRepo;
        this.blogPostRepo = blogPostRepo;
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.productRepo = productRepo;
        this.stateRepo = stateRepo;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) {
        // Cleanup unverified temporary users on startup
        long deletedCount1 = userRepo.deleteByIsVerified(false);
        long deletedCount2 = userRepo.deleteByEmailVerifiedFalseAndPhoneVerifiedFalse();
        log.info("Cleaned up {} unverified and {} incomplete temporary users from database.", deletedCount1, deletedCount2);

        // Seed states
        if (stateRepo.count() == 0) {
            log.info("Loading sample states and UTs data...");
            seedStates();
        } else {
            log.info("States already exist in database. Skipping state seed.");
        }

        // Seed courses
        if (courseRepo.count() == 0) {
            log.info("Loading sample course data...");
            seedCourses();
        } else {
            log.info("Courses already exist in database. Skipping data load.");
        }

        // Seed blog posts
        if (blogPostRepo.count() == 0) {
            log.info("Loading sample blog posts...");
            seedBlogPosts();
        } else {
            log.info("Blog posts already exist in database. Skipping blog seed.");
        }

        // Sample product seeding disabled — products managed via Google Drive pipeline

        // Run idempotent product migration
        migrateImportedProducts();

        // Ensure admin user exists with ADMIN role
        ensureAdminUser();
    }

    private void ensureAdminUser() {
        String adminEmail = "admin@bodhganga.in";
        String targetPhone = "9958277244";
        String targetPassword = "BodhGanga@2026";

        userRepo.findByEmail(adminEmail).ifPresentOrElse(
            user -> {
                boolean changed = false;
                if (!"ADMIN".equals(user.getRole())) {
                    user.setRole("ADMIN");
                    changed = true;
                }
                if (!targetPhone.equals(user.getPhoneNo())) {
                    user.setPhoneNo(targetPhone);
                    changed = true;
                }
                if (!passwordEncoder.matches(targetPassword, user.getHashedPassword())) {
                    user.setHashedPassword(passwordEncoder.encode(targetPassword));
                    changed = true;
                }
                if (changed) {
                    userRepo.save(user);
                    log.info("Updated existing admin user credentials in MongoDB: email={}, phone={}", adminEmail, targetPhone);
                } else {
                    log.info("Admin user already exists and is up to date: {}", adminEmail);
                }
            },
            () -> {
                User admin = User.builder()
                    .name("Admin")
                    .email(adminEmail)
                    .phoneNo(targetPhone)
                    .hashedPassword(passwordEncoder.encode(targetPassword))
                    .role("ADMIN")
                    .isVerified(true)
                    .isActive(true)
                    .forcePasswordReset(true)
                    .createdAt(new Date())
                    .build();
                userRepo.save(admin);
                log.info("Created admin user with target credentials: {}", adminEmail);
            }
        );
    }

    private void seedCourses() {

        List<Courses> sampleCourses = Arrays.asList(
                createCourse(
                        "Introduction to Indian History",
                        "Explore the rich tapestry of Indian history from ancient civilizations to modern times. Learn about the Indus Valley Civilization, Mauryan Empire, Mughal Dynasty, and the Indian independence movement.",
                        "Dr. Ramesh Kumar",
                        "History",
                        40.0,
                        0.0,
                        "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800",
                        "Hindi/English",
                        45,
                        4.7,
                        1250),
                createCourse(
                        "Yoga and Meditation Fundamentals",
                        "Master the ancient practices of yoga and meditation. Learn asanas, pranayama, and meditation techniques to achieve physical, mental, and spiritual well-being.",
                        "Swami Ananda",
                        "Yoga & Wellness",
                        30.0,
                        0.0,
                        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
                        "Hindi/English",
                        32,
                        4.9,
                        2100),
                createCourse(
                        "Sanskrit Language Basics",
                        "Learn the foundation of Sanskrit, the ancient language of India. Master Devanagari script, basic grammar, and common phrases used in traditional texts.",
                        "Prof. Lakshmi Devi",
                        "Sanskrit",
                        50.0,
                        0.0,
                        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
                        "Hindi/English",
                        60,
                        4.5,
                        890),
                createCourse(
                        "Vedic Mathematics",
                        "Discover the ancient Indian system of mathematics. Learn mental calculation techniques from the Vedas that make complex calculations simple and fast.",
                        "Dr. Arvind Sharma",
                        "Mathematics",
                        25.0,
                        0.0,
                        "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800",
                        "Hindi/English",
                        28,
                        4.8,
                        1560),
                createCourse(
                        "Indian Classical Music",
                        "Explore the beauty of Indian classical music with Ragas, Talas, and traditional instruments like Sitar, Tabla, and Veena. Perfect for beginners.",
                        "Ustad Rahman Khan",
                        "Music",
                        45.0,
                        0.0,
                        "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800",
                        "Hindi/English",
                        50,
                        4.6,
                        780),
                createCourse(
                        "Ayurveda and Natural Healing",
                        "Learn the principles of Ayurveda, India's ancient system of medicine. Understand doshas, natural remedies, and holistic health practices.",
                        "Vaidya Sunita Patel",
                        "Ayurveda",
                        35.0,
                        0.0,
                        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800",
                        "Hindi/English",
                        38,
                        4.7,
                        1340),
                createCourse(
                        "Bhagavad Gita Study",
                        "Deep dive into the teachings of the Bhagavad Gita. Understand karma yoga, bhakti yoga, and the path to self-realization through Lord Krishna's wisdom.",
                        "Swami Vidyananda",
                        "Philosophy",
                        42.0,
                        0.0,
                        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800",
                        "Hindi/English",
                        48,
                        4.9,
                        1920),
                createCourse(
                        "Indian Art and Sculpture",
                        "Explore the diverse art forms of India including temple architecture, bronze sculptures, miniature paintings, and contemporary Indian art.",
                        "Dr. Kavita Menon",
                        "Art",
                        30.0,
                        0.0,
                        "https://images.unsplash.com/photo-1580853039692-835f8d0a8b68?w=800",
                        "Hindi/English",
                        35,
                        4.6,
                        650),
                createCourse(
                        "Kathak Dance Basics",
                        "Learn the graceful moves of Kathak, one of India's eight classical dance forms. Master footwork, spins, and expressive storytelling through dance.",
                        "Guru Nandini Sharma",
                        "Dance",
                        40.0,
                        0.0,
                        "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=800",
                        "Hindi/English",
                        44,
                        4.8,
                        920),
                createCourse(
                        "Traditional Indian Cooking",
                        "Master authentic Indian cuisine from different regions. Learn traditional recipes, spice blending, and cooking techniques passed down through generations.",
                        "Chef Anjali Verma",
                        "Cooking",
                        20.0,
                        0.0,
                        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
                        "Hindi/English",
                        25,
                        4.7,
                        1580));

        courseRepo.saveAll(sampleCourses);
        log.info("Successfully loaded {} sample courses", sampleCourses.size());
    }

    private void seedBlogPosts() {
        List<BlogPost> posts = Arrays.asList(
            createBlogPost(
                "Understanding India's Five Year Plans",
                "understanding-indias-five-year-plans",
                "A comprehensive overview of India's economic planning framework from the first Five Year Plan in 1951 to the NITI Aayog era. Learn how these plans shaped India's development trajectory.",
                "History & Governance",
                "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800",
                "Dr. Ramesh Kumar",
                new String[]{"History", "Economics", "Governance"}),
            createBlogPost(
                "The Art of Yoga: Ancient Wisdom for Modern Life",
                "art-of-yoga-ancient-wisdom-modern-life",
                "Explore how ancient yogic practices developed over thousands of years in India can be applied to contemporary challenges of stress, mental health, and physical wellness.",
                "Yoga & Wellness",
                "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
                "Swami Ananda",
                new String[]{"Yoga", "Wellness", "Health"}),
            createBlogPost(
                "Sanskrit: The Language of the Gods",
                "sanskrit-language-of-gods",
                "Sanskrit is not just a language â€” it is the foundation of Indian civilization. Discover its scientific structure, influence on modern languages, and revival in contemporary India.",
                "Sanskrit",
                "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
                "Prof. Lakshmi Devi",
                new String[]{"Sanskrit", "Language", "Culture"}),
            createBlogPost(
                "Vedic Mathematics: Mental Calculation Techniques",
                "vedic-mathematics-mental-calculation",
                "Vedic Mathematics offers 16 sutras (aphorisms) that enable rapid mental calculations. This guide introduces the most useful techniques for students preparing for competitive exams.",
                "Mathematics",
                "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800",
                "Dr. Arvind Sharma",
                new String[]{"Mathematics", "Vedic", "Education"}),
            createBlogPost(
                "Ayurveda in the 21st Century",
                "ayurveda-21st-century",
                "Modern medicine is beginning to validate what Ayurveda has known for millennia. Explore how Ayurvedic principles are being integrated into contemporary healthcare practices worldwide.",
                "Ayurveda",
                "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800",
                "Vaidya Sunita Patel",
                new String[]{"Ayurveda", "Healthcare", "Natural Healing"})
        );

        blogPostRepo.saveAll(posts);
        log.info("Successfully loaded {} sample blog posts", posts.size());
    }

    private BlogPost createBlogPost(String title, String slug, String content,
                                     String category, String featuredImage,
                                     String author, String[] tags) {
        BlogPost post = new BlogPost();
        post.setId(UUID.randomUUID().toString());
        post.setTitle(title);
        post.setSlug(slug);
        post.setContent(content);
        post.setCategory(category);
        post.setFeaturedImage(featuredImage);
        post.setAuthor(author);
        post.setTags(Arrays.asList(tags));
        post.setStatus("PUBLISHED");
        post.setCreatedAt(new Date());
        post.setPublishedAt(new Date());
        return post;
    }

    private Courses createCourse(String title, String description, String instructor,
            String category, double duration, double price,
            String thumbnail, String language, int lectures,
            double rating, int enrolled) {
        Courses course = new Courses();
        course.setId(UUID.randomUUID().toString());
        course.setCourseTitle(title);
        course.setDescription(description);
        course.setInstructorName(instructor);
        course.setCourseCategory(category);
        course.setCourseDuration(duration);
        course.setCoursePrice(price);
        course.setThumbnailUrl(thumbnail);
        course.setLanguage(language);
        course.setTotalLectures(lectures);
        course.setRating(rating);
        course.setEnrolledStudents(enrolled);
        course.setCreatedAt(new Date());
        course.setUpdatedAt(new Date());
        return course;
    }

    private void seedProducts() {
        List<Product> products = Arrays.asList(
            createProduct("Rajasthan PSC Complete History Notes", "Comprehensive PDF notes covering Ancient, Medieval, and Modern History of Rajasthan for RPSC exams.", "Rajasthan", "Notes", 99.0, "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800", "rpsc-history-notes.pdf"),
            createProduct("Bihar Special Geography & Economy Blueprint", "Key geography topics and economy analysis of Bihar, tailormade for BPSC civil services preparation.", "Bihar", "Notes", 99.0, "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800", "bpsc-geography-economy.pdf"),
            createProduct("Uttar Pradesh General Knowledge Question Bank", "Over 1000 high-yield multiple choice questions with detailed explanations for UPPSC and subordinate exams.", "Uttar Pradesh", "Question Bank", 99.0, "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800", "uppsc-gk-question-bank.pdf"),
            createProduct("Madhya Pradesh Tribe & Culture Companion", "Specialized guide to tribes, folk dances, art forms, and cultural heritage of MP for MPPSC candidates.", "Madhya Pradesh", "Notes", 99.0, "https://images.unsplash.com/photo-1580853039692-835f8d0a8b68?w=800", "mppsc-tribes-culture.pdf"),
            createProduct("Ultimate General Studies Mock Test Series", "Full-length mock test papers with detailed answers covering history, polity, geography, and general science.", "All India", "Bundle", 99.0, "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800", "gs-mock-test-series.pdf")
        );

        productRepo.saveAll(products);
        log.info("Successfully loaded {} sample products into database", products.size());
    }

    private Product createProduct(String title, String description, String state, String type, Double price, String previewUrl, String storageKey) {
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle(title);
        p.setDescription(description);
        p.setState(state);
        p.setStateSlug(Product.generateSlug(state));
        p.setDistrict("general");
        p.setDistrictSlug("general");
        p.setType("PDF"); // Matches categories or files
        p.setPrice(99.0);
        p.setFree(false);
        p.setPreviewUrl(previewUrl);
        p.setStorageKey(storageKey);
        p.setPublished(true);
        p.setCreatedAt(new Date());
        return p;
    }

    private void seedStates() {
        List<State> states = Arrays.asList(
            createState("andhra-pradesh", "AP", "Andhra Pradesh", "Amaravati", "Comprehensive preparation material for Andhra Pradesh State Government Exams including APPSC, Police, Forest, and Revenue services.", "STATE", Arrays.asList("Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Chittoor", "East Godavari", "Eluru", "Guntur", "Kakinada", "Konaseema", "Krishna", "Kurnool", "Manyam", "NTR", "Nandyal", "Palnadu", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa")),
            createState("arunachal-pradesh", "AR", "Arunachal Pradesh", "Itanagar", "Study materials for Arunachal Pradesh Public Service Commission and state-level examinations.", "STATE", Arrays.asList("Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang")),
            createState("assam", "AS", "Assam", "Dispur", "Complete study resource for Assam Public Service Commission and various state government examinations.", "STATE", Arrays.asList("Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong")),
            createState("bihar", "BR", "Bihar", "Patna", "Extensive preparation material for Bihar PSC, Police, Sub-Inspector, and Staff Selection Commission examinations.", "STATE", Arrays.asList("Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran")),
            createState("chhattisgarh", "CT", "Chhattisgarh", "Raipur", "Comprehensive notes and questions for Chhattisgarh Public Service Commission and state exams.", "STATE", Arrays.asList("Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Korea", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja")),
            createState("goa", "GA", "Goa", "Panaji", "Study materials for Goa Public Service Commission and state government examinations.", "STATE", Arrays.asList("North Goa", "South Goa")),
            createState("gujarat", "GJ", "Gujarat", "Gandhinagar", "Complete resource for Gujarat PSC, Police, Transport, and Staff Selection Board examinations.", "STATE", Arrays.asList("Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad")),
            createState("haryana", "HR", "Haryana", "Chandigarh", "Preparation material for Haryana Public Service Commission and Staff Selection Commission exams.", "STATE", Arrays.asList("Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar")),
            createState("himachal-pradesh", "HP", "Himachal Pradesh", "Shimla", "Complete preparation portal for Himachal Pradesh PSC and sub-ordinate exams.", "STATE", Arrays.asList("Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una")),
            createState("jharkhand", "JH", "Jharkhand", "Ranchi", "Study resources for JPSC, JSSC, and state-level government jobs.", "STATE", Arrays.asList("Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum")),
            createState("karnataka", "KA", "Karnataka", "Bengaluru", "Preparation portal for KPSC, Karnataka Police, and state government jobs.", "STATE", Arrays.asList("Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir")),
            createState("kerala", "KL", "Kerala", "Thiruvananthapuram", "Extensive guide for Kerala PSC, KAS, and sub-ordinate recruitment examinations.", "STATE", Arrays.asList("Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad")),
            createState("madhya-pradesh", "MP", "Madhya Pradesh", "Bhopal", "Comprehensive notes and blueprint for MPPSC and Vyapam exams.", "STATE", Arrays.asList("Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha")),
            createState("maharashtra", "MH", "Maharashtra", "Mumbai", "Study notes and booster sets for MPSC Prelims & Mains curriculum.", "STATE", Arrays.asList("Ahmednagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal")),
            createState("manipur", "MN", "Manipur", "Imphal", "Study materials for Manipur Public Service Commission and state-level examinations.", "STATE", Arrays.asList("Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul")),
            createState("meghalaya", "ML", "Meghalaya", "Shillong", "Preparation portal for Meghalaya Public Service Commission and sub-ordinate exams.", "STATE", Arrays.asList("East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills")),
            createState("mizoram", "MZ", "Mizoram", "Aizawl", "Study notes and resources for Mizoram Public Service Commission examinations.", "STATE", Arrays.asList("Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip")),
            createState("nagaland", "NL", "Nagaland", "Kohima", "Complete prep guide for Nagaland Public Service Commission examinations.", "STATE", Arrays.asList("ChÃ¼moukedim", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "TseminyÃ¼", "Tuensang", "Wokha", "Zunheboto")),
            createState("odisha", "OR", "Odisha", "Bhubaneswar", "Comprehensive prep material for OPSC and Odisha State Government exams.", "STATE", Arrays.asList("Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh")),
            createState("punjab", "PB", "Punjab", "Chandigarh", "Complete study material for PPSC and Punjab state examinations.", "STATE", Arrays.asList("Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran")),
            createState("rajasthan", "RJ", "Rajasthan", "Jaipur", "RAS Prelims and Mains study textbooks and question bank modules.", "STATE", Arrays.asList("Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Modhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur")),
            createState("sikkim", "SK", "Sikkim", "Gangtok", "Study resources for Sikkim Public Service Commission and state-level exams.", "STATE", Arrays.asList("Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng", "Gangtok")),
            createState("tamil-nadu", "TN", "Tamil Nadu", "Chennai", "Comprehensive notes and question banks for TNPSC exams.", "STATE", Arrays.asList("Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar")),
            createState("telangana", "TG", "Telangana", "Hyderabad", "Study materials and model answers for TSPSC civil services exams.", "STATE", Arrays.asList("Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupally", "Jogulamba Gadwal", "Kama Reddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri")),
            createState("tripura", "TR", "Tripura", "Agartala", "Complete prep resources for TPSC and state government exams.", "STATE", Arrays.asList("Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura")),
            createState("uttar-pradesh", "UP", "Uttar Pradesh", "Lucknow", "UPPSC civil service mains solved answers and booster notes.", "STATE", Arrays.asList("Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Bara Banki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shrawasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi")),
            createState("uttarakhand", "UK", "Uttarakhand", "Dehradun", "Complete prep portal for UKPSC and state government exams.", "STATE", Arrays.asList("Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi")),
            createState("west-bengal", "WB", "West Bengal", "Kolkata", "WBCS Mains solved textbooks and General Knowledge companion.", "STATE", Arrays.asList("Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur")),
            
            // UTs
            createState("andaman-nicobar", "AN", "Andaman and Nicobar Islands", "Port Blair", "Study materials for Andaman and Nicobar Islands administration and related examinations.", "UT", Arrays.asList("Nicobar", "North and Middle Andaman", "South Andaman")),
            createState("chandigarh", "CH", "Chandigarh", "Chandigarh", "Preparation material for Chandigarh Union Territory administration examinations.", "UT", Arrays.asList("Chandigarh")),
            createState("dnh-dd", "DH", "Dadra and Nagar Haveli and Daman and Diu", "Daman", "Study resources for Dadra and Nagar Haveli and Daman and Diu administration exams.", "UT", Arrays.asList("Dadra and Nagar Haveli", "Daman", "Diu")),
            createState("delhi", "DL", "Delhi (National Capital Territory)", "New Delhi", "Comprehensive resource for Delhi Subordinate Services Selection Board, Police, and other examinations.", "UT", Arrays.asList("Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi")),
            createState("jammu-kashmir", "JK", "Jammu and Kashmir", "Srinagar (Summer), Jammu (Winter)", "Complete study material for Jammu and Kashmir Public Service Commission and state examinations.", "UT", Arrays.asList("Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Mandy", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur")),
            createState("ladakh", "LA", "Ladakh", "Leh", "Preparation materials for Ladakh Union Territory administration and related exams.", "UT", Arrays.asList("Kargil", "Leh")),
            createState("lakshadweep", "LD", "Lakshadweep", "Kavaratti", "Study materials for Lakshadweep Union Territory administration examinations.", "UT", Arrays.asList("Lakshadweep")),
            createState("puducherry", "PY", "Puducherry", "Puducherry", "Comprehensive resource for Puducherry Public Service Commission and state-level exams.", "UT", Arrays.asList("Karaikal", "Mahe", "Puducherry", "Yanam"))
        );
        stateRepo.saveAll(states);
        log.info("Successfully seeded {} State/UT records into database", states.size());
    }

    private State createState(String id, String code, String name, String capital, String desc, String type, List<String> districts) {
        State s = new State();
        s.setId(id);
        s.setCode(code);
        s.setName(name);
        s.setCapital(capital);
        s.setDescription(desc);
        s.setType(type);
        s.setDistricts(districts);
        s.setCreatedAt(new Date());
        s.setUpdatedAt(new Date());
        return s;
    }

    private void migrateImportedProducts() {
        log.info("Running duplicate resolution and migration script for imported products...");
        List<Product> products = productRepo.findByImportedFromDrive(true); // FIXED: was findAll()
        
        // Group by googleDriveFileId
        java.util.Map<String, java.util.List<Product>> byDriveId = new java.util.HashMap<>();
        // Group by s3Key
        java.util.Map<String, java.util.List<Product>> byS3Key = new java.util.HashMap<>();
        // Group by fileName (scoped by state/district)
        java.util.Map<String, java.util.List<Product>> byFileName = new java.util.HashMap<>();

        for (Product p : products) {
            boolean isImported = Boolean.TRUE.equals(p.getImportedFromDrive()) || "Google Drive".equals(p.getSource());
            if (!isImported) continue;

            String driveId = p.getGoogleDriveFileId();
            if (driveId != null && !driveId.trim().isEmpty()) {
                byDriveId.computeIfAbsent(driveId.trim(), k -> new java.util.ArrayList<>()).add(p);
            }

            String s3Key = p.getS3Key();
            if (s3Key != null && !s3Key.trim().isEmpty()) {
                byS3Key.computeIfAbsent(s3Key.trim(), k -> new java.util.ArrayList<>()).add(p);
            }

            String fileName = p.getFileName();
            if (fileName != null && !fileName.trim().isEmpty()) {
                byFileName.computeIfAbsent(fileName.trim(), k -> new java.util.ArrayList<>()).add(p);
            }
        }

        java.util.Set<String> deletedIds = new java.util.HashSet<>();

        // Resolver helper to handle each list of duplicate products
        java.util.function.Consumer<java.util.List<Product>> resolver = list -> {
            if (list.size() <= 1) return;
            
            // Sort by createdAt ascending (oldest first)
            list.sort(java.util.Comparator.comparing(p -> p.getCreatedAt() != null ? p.getCreatedAt() : new Date(0)));
            
            // Find the oldest one that hasn't already been deleted
            Product oldest = null;
            int startIndex = 0;
            for (int i = 0; i < list.size(); i++) {
                if (!deletedIds.contains(list.get(i).getId())) {
                    oldest = list.get(i);
                    startIndex = i;
                    break;
                }
            }
            if (oldest == null || startIndex >= list.size() - 1) return; // No duplicates left

            // Backfill googleDriveFileId to oldest if possible
            if (oldest.getGoogleDriveFileId() == null || oldest.getGoogleDriveFileId().trim().isEmpty()) {
                for (int i = startIndex + 1; i < list.size(); i++) {
                    Product dup = list.get(i);
                    if (dup.getGoogleDriveFileId() != null && !dup.getGoogleDriveFileId().trim().isEmpty()) {
                        oldest.setGoogleDriveFileId(dup.getGoogleDriveFileId());
                        productRepo.save(oldest);
                        log.info("Backfilled googleDriveFileId {} to oldest product {}", dup.getGoogleDriveFileId(), oldest.getId());
                        break;
                    }
                }
            }

            // Delete newer duplicates
            for (int i = startIndex + 1; i < list.size(); i++) {
                Product dup = list.get(i);
                if (!deletedIds.contains(dup.getId())) {
                    productRepo.delete(dup);
                    deletedIds.add(dup.getId());
                    log.info("Deleted duplicate product record: id={}, title={}, createdAt={}", dup.getId(), dup.getTitle(), dup.getCreatedAt());
                }
            }
        };

        // Resolve duplicates
        for (java.util.List<Product> group : byDriveId.values()) {
            resolver.accept(group);
        }
        for (java.util.List<Product> group : byS3Key.values()) {
            resolver.accept(group);
        }
        for (java.util.List<Product> group : byFileName.values()) {
            java.util.Map<String, java.util.List<Product>> subGroup = new java.util.HashMap<>();
            for (Product p : group) {
                String pathKey = (p.getState() != null ? p.getState() : "") + "|" + (p.getDistrict() != null ? p.getDistrict() : "");
                subGroup.computeIfAbsent(pathKey, k -> new java.util.ArrayList<>()).add(p);
            }
            for (java.util.List<Product> sg : subGroup.values()) {
                resolver.accept(sg);
            }
        }

        // Backfill metadata on imported-from-Drive products and auto-publish any that are still unpublished
        // FIXED: Only load imported products that need backfill — not the entire collection
        // This avoids OOM at scale (was productRepo.findAll())
        List<Product> remainingProducts = productRepo.findByImportedFromDrive(true);
        boolean changedAny = false;
        for (Product p : remainingProducts) {
            boolean changed = false;
            boolean isImported = true; // Already filtered to importedFromDrive=true
            
            if (isImported) {
                if (!Boolean.TRUE.equals(p.getImportedFromDrive())) {
                    p.setImportedFromDrive(true);
                    changed = true;
                }
                if (!p.isPublished()) {
                    p.setPublished(true);
                    changed = true;
                }
                if (p.getState() == null || p.getState().isEmpty()) {
                    p.setState("general");
                    changed = true;
                }
                if (p.getStateSlug() == null || p.getStateSlug().isEmpty()) {
                    p.setStateSlug(Product.generateSlug(p.getState()));
                    changed = true;
                }
                if (p.getDistrict() == null || p.getDistrict().isEmpty()) {
                    p.setDistrict("general");
                    changed = true;
                }
                if (p.getDistrictSlug() == null || p.getDistrictSlug().isEmpty()) {
                    p.setDistrictSlug(Product.generateSlug(p.getDistrict()));
                    changed = true;
                }
                if (p.getMimeType() == null || p.getMimeType().isEmpty()) {
                    String mt = Product.determineMimeType(p.getFileName() != null ? p.getFileName() : p.getStorageKey());
                    p.setMimeType(mt);
                    changed = true;
                }
                if (p.getContentType() == null || p.getContentType().isEmpty()) {
                    String ct = Product.determineContentType(p.getMimeType(), p.getFileName() != null ? p.getFileName() : p.getStorageKey());
                    p.setContentType(ct);
                    p.setType(ct);
                    changed = true;
                }
                if (p.getOriginalFileName() == null || p.getOriginalFileName().isEmpty()) {
                    p.setOriginalFileName(p.getFileName() != null ? p.getFileName() : p.getStorageKey());
                    changed = true;
                }
                if (p.getDisplayTitle() == null || p.getDisplayTitle().isEmpty()) {
                    p.setDisplayTitle(Product.stripExtension(p.getTitle() != null ? p.getTitle() : p.getOriginalFileName()));
                    p.setTitle(p.getDisplayTitle());
                    changed = true;
                }
                if (p.isFree() && (p.getPrice() == null || p.getPrice() != 0.0)) {
                    p.setPrice(0.0);
                    changed = true;
                } else if (!p.isFree() && (p.getPrice() == null || p.getPrice() != 99.0)) {
                    p.setPrice(99.0);
                    changed = true;
                }
                if (p.getIngestionStatus() == null) {
                    p.setIngestionStatus(IngestionStatus.COMPLETED);
                    changed = true;
                }
                if (p.getFileExtension() == null || p.getFileExtension().isEmpty()) {
                    p.setFileExtension(Product.getFileExtension(p.getFileName() != null ? p.getFileName() : p.getStorageKey()));
                    changed = true;
                }
                if (p.getUpdatedAt() == null) {
                    p.setUpdatedAt(p.getCreatedAt() != null ? p.getCreatedAt() : new Date());
                    changed = true;
                }
            }

            if (changed) {
                productRepo.save(p);
                changedAny = true;
            }
        }

        if (changedAny) {
            log.info("Migration completed successfully (updated products).");
        } else {
            log.info("Migration completed: all products are already up to date.");
        }

        // Programmatically enforce unique sparse indexes in MongoDB to guarantee uniqueness.
        // Drop any existing conflicting index first (IndexOptionsConflict code 85) before re-creating.
        ensureUniqueSparseIndex("googleDriveFileId");
        ensureUniqueSparseIndex("s3Key");
        ensureUniqueSparseIndex("sourceFileId");
    }

    /**
     * Safely ensures a unique sparse index on a given field in the products collection.
     * If an existing index with the same key but different options (e.g. non-sparse) is found,
     * it is dropped first to avoid IndexOptionsConflict (error code 85).
     */
    private void ensureUniqueSparseIndex(String fieldName) {
        org.springframework.data.mongodb.core.index.IndexOperations indexOps = mongoTemplate.indexOps(Product.class);
        try {
            // Attempt to create the sparse unique index directly
            indexOps.ensureIndex(new org.springframework.data.mongodb.core.index.Index()
                .named(fieldName)
                .on(fieldName, org.springframework.data.domain.Sort.Direction.ASC)
                .unique()
                .sparse());
            log.info("Unique sparse index on '{}' verified/created successfully.", fieldName);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("IndexOptionsConflict") || msg.contains("already exists with a different name") || msg.contains("code 85")) {
                // Drop all indexes whose key includes this field, then recreate
                log.warn("IndexOptionsConflict for field '{}'. Dropping conflicting index and retrying.", fieldName);
                try {
                    indexOps.dropIndex(fieldName);
                    log.info("Dropped conflicting index '{}' successfully.", fieldName);
                } catch (Exception dropEx) {
                    log.warn("Could not drop index '{}' by name ({}), trying field-based drop.", fieldName, dropEx.getMessage());
                    // Fallback: fetch all indexes, find any that covers this field, and drop by name
                    try {
                        for (org.springframework.data.mongodb.core.index.IndexInfo info : indexOps.getIndexInfo()) {
                            boolean coversField = info.getIndexFields().stream()
                                .anyMatch(f -> fieldName.equals(f.getKey()));
                            if (coversField && !info.getName().equals("_id_")) {
                                indexOps.dropIndex(info.getName());
                                log.info("Dropped conflicting index '{}' covering field '{}'.", info.getName(), fieldName);
                            }
                        }
                    } catch (Exception scanEx) {
                        log.error("Failed to scan and drop indexes for field '{}': {}", fieldName, scanEx.getMessage());
                    }
                }
                // Retry creation after drop
                try {
                    indexOps.ensureIndex(new org.springframework.data.mongodb.core.index.Index()
                        .named(fieldName)
                        .on(fieldName, org.springframework.data.domain.Sort.Direction.ASC)
                        .unique()
                        .sparse());
                    log.info("Unique sparse index on '{}' created successfully after drop.", fieldName);
                } catch (Exception retryEx) {
                    log.error("Failed to create unique sparse index on '{}' after drop: {}", fieldName, retryEx.getMessage());
                }
            } else {
                log.error("Failed to create unique sparse index on '{}': {}", fieldName, e.getMessage());
            }
        }
    }
}
