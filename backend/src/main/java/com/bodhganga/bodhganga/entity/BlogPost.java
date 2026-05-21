package com.bodhganga.bodhganga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.Date;
import java.util.List;

@Document(collection = "blog_posts")
public class BlogPost {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private String title;
    private String content;
    private String category;
    private String featuredImage;
    private String author;
    private List<String> tags;
    @Indexed
    private String status; // PUBLISHED | DRAFT
    private Date publishedAt;
    private Date createdAt;
    private Date updatedAt;

    // Constructors
    public BlogPost() {
        this.createdAt = new Date();
        this.status = "PUBLISHED";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getFeaturedImage() { return featuredImage; }
    public void setFeaturedImage(String featuredImage) { this.featuredImage = featuredImage; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Date publishedAt) { this.publishedAt = publishedAt; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    // Builder
    public static class BlogPostBuilder {
        private BlogPost post = new BlogPost();
        public BlogPostBuilder id(String id) { post.setId(id); return this; }
        public BlogPostBuilder slug(String slug) { post.setSlug(slug); return this; }
        public BlogPostBuilder title(String title) { post.setTitle(title); return this; }
        public BlogPostBuilder content(String content) { post.setContent(content); return this; }
        public BlogPostBuilder category(String category) { post.setCategory(category); return this; }
        public BlogPostBuilder featuredImage(String img) { post.setFeaturedImage(img); return this; }
        public BlogPostBuilder author(String author) { post.setAuthor(author); return this; }
        public BlogPostBuilder tags(List<String> tags) { post.setTags(tags); return this; }
        public BlogPostBuilder status(String status) { post.setStatus(status); return this; }
        public BlogPostBuilder publishedAt(Date d) { post.setPublishedAt(d); return this; }
        public BlogPostBuilder createdAt(Date d) { post.setCreatedAt(d); return this; }
        public BlogPost build() { return post; }
    }

    public static BlogPostBuilder builder() { return new BlogPostBuilder(); }
}
