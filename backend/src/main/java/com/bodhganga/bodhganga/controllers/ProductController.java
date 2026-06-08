package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepo productRepo;

    public ProductController(ProductRepo productRepo) {
        this.productRepo = productRepo;
    }

    /**
     * Public API to get all published products
     */
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getAllPublishedProducts() {
        List<Product> products = productRepo.findByIsPublishedTrue();
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(products)
                .build());
    }

    /**
     * Public API to get products by state slug
     */
    @GetMapping("/state/{slug}")
    public ResponseEntity<ApiResponseDTO> getProductsByState(@PathVariable String slug) {
        List<Product> products = productRepo.findByStateSlugAndIsPublishedTrue(slug);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(products)
                .build());
    }

    /**
     * Public API to get products by state slug and district slug
     */
    @GetMapping("/state/{stateSlug}/district/{districtSlug}")
    public ResponseEntity<ApiResponseDTO> getProductsByStateAndDistrict(@PathVariable String stateSlug, @PathVariable String districtSlug) {
        List<Product> products = productRepo.findByStateSlugAndDistrictSlugAndIsPublishedTrue(stateSlug, districtSlug);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(products)
                .build());
    }

    /**
     * Get single product by id
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> getProductById(@PathVariable String id) {
        return productRepo.findById(id)
                .map(p -> ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(p).build()))
                .orElse(ResponseEntity.status(404).body(ApiResponseDTO.builder().success(false).message("Not Found").build()));
    }

    /**
     * Admin API to create product
     */
    @PostMapping
    public ResponseEntity<ApiResponseDTO> createProduct(@RequestBody Product product) {
        product.setPrice(product.isFree() ? 0.0 : 99.0);
        product.setCreatedAt(new Date());
        if (product.getState() != null) {
            product.setStateSlug(Product.generateSlug(product.getState()));
        }
        if (product.getDistrict() != null) {
            product.setDistrictSlug(Product.generateSlug(product.getDistrict()));
        } else {
            product.setDistrictSlug("general");
        }
        Product saved = productRepo.save(product);
        return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(saved).build());
    }

    /**
     * Admin API to update product
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> updateProduct(@PathVariable String id, @RequestBody Product product) {
        if (!productRepo.existsById(id)) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder().success(false).message("Not Found").build());
        }
        product.setPrice(product.isFree() ? 0.0 : 99.0);
        product.setId(id);
        if (product.getState() != null) {
            product.setStateSlug(Product.generateSlug(product.getState()));
        }
        if (product.getDistrict() != null) {
            product.setDistrictSlug(Product.generateSlug(product.getDistrict()));
        } else {
            product.setDistrictSlug("general");
        }
        Product saved = productRepo.save(product);
        return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(saved).build());
    }
    
    /**
     * Admin API to delete product
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> deleteProduct(@PathVariable String id) {
        productRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponseDTO.builder().success(true).build());
    }
}
