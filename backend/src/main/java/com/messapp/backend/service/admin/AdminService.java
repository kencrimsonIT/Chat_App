package com.messapp.backend.service.admin;

import com.messapp.backend.dto.admin.AdminAssignRequest;
import com.messapp.backend.entity.Role;
import com.messapp.backend.entity.User;
import com.messapp.backend.exception.ResourceNotFoundException;
import com.messapp.backend.repository.RoleRepository;
import com.messapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    public void assignAdminRole(AdminAssignRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role ADMIN"));

        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"))) {
            throw new IllegalArgumentException("Người dùng đã có quyền ADMIN");
        }

        user.getRoles().add(adminRole);
        userRepository.save(user);
    }

    public void revokeAdminRole(AdminAssignRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role ADMIN"));

        user.getRoles().remove(adminRole);
        userRepository.save(user);
    }
}
