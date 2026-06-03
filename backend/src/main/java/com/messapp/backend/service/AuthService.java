package com.messapp.backend.service;

import com.messapp.backend.dto.*;
import com.messapp.backend.entity.*;
import com.messapp.backend.exception.ResourceNotFoundException;
import com.messapp.backend.repository.PasswordResetTokenRepository;
import com.messapp.backend.repository.RefreshTokenRepository;
import com.messapp.backend.repository.RoleRepository;
import com.messapp.backend.repository.UserRepository;
import com.messapp.backend.repository.VerificationTokenRepository;
import com.messapp.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class AuthService {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public AuthResponse googleLogin(GoogleLoginRequest request) {
        String url = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + request.getAccessToken();
        Map<String, Object> payload = restTemplate.getForObject(url, Map.class);

        if (payload == null || payload.containsKey("error")) {
            throw new IllegalArgumentException("Google Access Token không hợp lệ");
        }

        String email = (String) payload.get("email");
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(email.split("@")[0] + "_" + UUID.randomUUID().toString().substring(0, 5));
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // Ngẫu nhiên vì login bằng google
            newUser.setFullName(name);
            newUser.setAvatarUrl(picture);
            newUser.setActive(true);

            Role client = roleRepository.findByName("ROLE_CLIENT")
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ROLE_CLIENT"));
            Set<Role> roles = new HashSet<>();
            roles.add(client);
            newUser.setRoles(roles);

            return userRepository.save(newUser);
        });

        String accessToken = jwtTokenProvider.generateTokenFromUsername(user.getUsername());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshTokenObject = new RefreshToken();
        refreshTokenObject.setUser(user);
        refreshTokenObject.setToken(refreshToken);
        refreshTokenObject.setExpiryDate(LocalDateTime.now().plusDays(8));
        refreshTokenRepository.save(refreshTokenObject);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .message("Đăng nhập bằng Google thành công")
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .build();
    }

    public AuthResponse register(RegisterRequest registerRequest) {
        if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu không khớp");
        }

        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Người dùng đã tồn tại");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setActive(false); // Set inactive until email verified

        Role client = roleRepository.findByName("ROLE_CLIENT")
                .orElseThrow(() -> new ResourceNotFoundException("Lỗi hệ thống: Không tìm thấy vai trò ROLE_CLIENT"));
        Set<Role> roles = new HashSet<>();
        roles.add(client);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // Send verification email
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken(savedUser, token);
        verificationTokenRepository.save(verificationToken);

        String verificationLink = frontendUrl + "/verify-email?token=" + token;
        emailService.sendVerificationEmail(savedUser.getEmail(), verificationLink);

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .message("Bạn đã đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.")
                .build();
    }

    public void verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Mã xác thực không hợp lệ."));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(verificationToken);
            throw new IllegalArgumentException("Mã xác thực đã hết hạn.");
        }

        User user = userRepository.findById(verificationToken.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại."));
        
        user.setActive(true);
        userRepository.save(user);

        verificationTokenRepository.delete(verificationToken);
    }

    public AuthResponse login(LoginRequest loginRequest) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm tháy người dùng"));

        String accessToken = jwtTokenProvider.generateToken(auth);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshTokenObject = new RefreshToken();
        refreshTokenObject.setUser(user);
        refreshTokenObject.setToken(refreshToken);
        refreshTokenObject.setExpiryDate(LocalDateTime.now().plusDays(8));
        refreshTokenRepository.save(refreshTokenObject);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .message("Đăng nhập thành công")
                .roles(user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet()))
                .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenRequest.getRefreshToken())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy token"));

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw  new IllegalArgumentException("Token đã hết hạn");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtTokenProvider.generateTokenFromUsername(user.getUsername());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        refreshToken.setToken(newRefreshToken);
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(8));
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .message("Làm mới Token thành công")
                .build();
    }

    public void logout(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        refreshTokenRepository.deleteByUser(user);
    }

    public void changePassword(String username, ChangePasswordRequest changePasswordRequest) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(changePasswordRequest.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }

        if (!changePasswordRequest.getNewPassword().equals(changePasswordRequest.getConfirmNewPassword())) {
            throw new IllegalArgumentException("Vui lòng nhập khớp mật khẩu mới");
        }

        user.setPassword(passwordEncoder.encode(changePasswordRequest.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void forgotPassword(ForgotPasswordRequest forgotPasswordRequest) {
        User user = userRepository.findByEmail(forgotPasswordRequest.getEmail()).orElseThrow(null);
        if (user == null) return;

        String resetToken = UUID.randomUUID().toString();

        passwordResetTokenRepository.deleteByUser(user);

        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setUser(user);
        passwordResetToken.setToken(resetToken);
        passwordResetToken.setExpiryDate(LocalDateTime.now().plusMinutes(45));
        passwordResetTokenRepository.save(passwordResetToken);

        String resetLink = frontendUrl + "/recovery-password?token=" + resetToken;
        emailService.sendResetPasswordEmail(user.getEmail(), resetLink);
    }

    public void resetPassword(ResetPasswordRequest resetPasswordRequest) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(resetPasswordRequest.getToken())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy reset token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new IllegalArgumentException("Reset token đã hết hạn");
        }

        if (!resetPasswordRequest.getNewPassword().equals(resetPasswordRequest.getConfirmNewPassword())) {
            throw new IllegalArgumentException("Vui lòng nhập khớp mật khẩu của bạn");
        }

        User user = resetToken.getUser();

        user.setPassword(passwordEncoder.encode(resetPasswordRequest.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }
}
