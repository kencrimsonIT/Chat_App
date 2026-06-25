package com.messapp.backend.service;

import com.messapp.backend.entity.User;
import com.messapp.backend.exception.ResourceNotFoundException;
import com.messapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    public User updateAvatar(String username, MultipartFile file) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Map uploadResult = cloudinaryService.upload(file);
        String url = (String) uploadResult.get("url");

        user.setAvatarUrl(url);
        return userRepository.save(user);
    }

    public User updateCover(String username, MultipartFile file) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Map uploadResult = cloudinaryService.upload(file);
        String url = (String) uploadResult.get("url");

        user.setCoverUrl(url);
        return userRepository.save(user);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public List<User> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword);
    }
}
