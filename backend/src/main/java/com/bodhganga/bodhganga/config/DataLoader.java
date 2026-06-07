package com.bodhganga.bodhganga.config;

import com.bodhganga.bodhganga.entity.BlogPost;
import com.bodhganga.bodhganga.entity.Courses;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.BlogPostRepo;
import com.bodhganga.bodhganga.repo.CourseRepo;
import com.bodhganga.bodhganga.repo.ProductRepo;
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

    public DataLoader(CourseRepo courseRepo, BlogPostRepo blogPostRepo,
                      UserRepo userRepo, PasswordEncoder passwordEncoder,
                      ProductRepo productRepo) {
        this.courseRepo = courseRepo;
        this.blogPostRepo = blogPostRepo;
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.productRepo = productRepo;
    }

    @Override
    public void run(String... args) {
        // Cleanup unverified temporary users on startup
        long deletedCount1 = userRepo.deleteByIsVerified(false);
        long deletedCount2 = userRepo.deleteByEmailVerifiedFalseAndPhoneVerifiedFalse();
        log.info("Cleaned up {} unverified and {} incomplete temporary users from database.", deletedCount1, deletedCount2);

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

        // Seed products
        if (productRepo.count() == 0) {
            log.info("Loading sample products...");
            seedProducts();
        } else {
            log.info("Products already exist in database. Skipping product seed.");
        }

        // Ensure admin user exists with ADMIN role
        ensureAdminUser();
    }

    private void ensureAdminUser() {
        String adminEmail = "admin@bodhganga.in";
        String targetPhone = "9958277244";
        String targetPassword = "indiadistricst@800";

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
                "Sanskrit is not just a language — it is the foundation of Indian civilization. Discover its scientific structure, influence on modern languages, and revival in contemporary India.",
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
}
