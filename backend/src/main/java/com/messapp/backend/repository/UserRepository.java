package com.messapp.backend.repository;

import com.messapp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username); //username đã tồn tại hay chưa
    boolean existsByEmail(String email); //email đã tồn tại hay chưa
}
