package com.messapp.backend.controller.admin;

import com.messapp.backend.dto.admin.AdminAssignRequest;
import com.messapp.backend.dto.admin.UserDTO;
import com.messapp.backend.service.admin.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private AdminService adminService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return new ResponseEntity<>(adminService.getAllUsers(), HttpStatus.OK);
    }

    @PostMapping("/assign-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> assignAdmin(@RequestBody AdminAssignRequest request) {
        adminService.assignAdminRole(request);
        return new ResponseEntity<>("Cấp quyền ADMIN thành công", HttpStatus.OK);
    }

    @PostMapping("/revoke-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> revokeAdmin(@RequestBody AdminAssignRequest request) {
        adminService.revokeAdminRole(request);
        return new ResponseEntity<>("Thu hồi quyền ADMIN thành công", HttpStatus.OK);
    }
}
