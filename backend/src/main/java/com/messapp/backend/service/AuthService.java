package com.messapp.backend.service;

import com.messapp.backend.dto.*;
import com.messapp.backend.entity.*;
import com.messapp.backend.exception.ResourceNotFoundException;
import com.messapp.backend.repository.PasswordResetTokenRepository;
import com.messapp.backend.repository.RefreshTokenRepository;
import com.messapp.backend.repository.RoleRepository;
import com.messapp.backend.repository.UserRepository;
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
            newUser.setIsActive(true);

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
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .message("Đăng nhập bằng Google thành công")
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .build();
    }

    public AuthResponse facebookLogin(FacebookLoginRequest request) {
        String url = "https://graph.facebook.com/me?fields=id,name,email,picture&access_token=" + request.getAccessToken();
        Map<String, Object> payload = restTemplate.getForObject(url, Map.class);

        if (payload == null || payload.containsKey("error")) {
            throw new IllegalArgumentException("Facebook Access Token không hợp lệ");
        }

        String email = (String) payload.get("email");
        String name = (String) payload.get("name");
        String picture = null;

        if (payload.containsKey("picture")) {
            Map<String, Object> pictureObj = (Map<String, Object>) payload.get("picture");
            if (pictureObj.containsKey("data")) {
                Map<String, Object> dataObj = (Map<String, Object>) pictureObj.get("data");
                picture = (String) dataObj.get("url");
            }
        }

        if (email == null) {
            email = payload.get("id") + "@facebook.com";
        }

        final String finalEmail = email;
        final String finalName = name;
        final String finalPicture = picture;

        User user = userRepository.findByEmail(finalEmail).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(finalEmail);
            newUser.setUsername(finalEmail.split("@")[0] + "_" + UUID.randomUUID().toString().substring(0, 5));
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setFullName(finalName);
            newUser.setAvatarUrl(finalPicture);
            newUser.setIsActive(true);

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
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .message("Đăng nhập bằng Facebook thành công")
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

        User savedUser = saveUser(registerRequest);

        String accessToken = jwtTokenProvider.generateTokenFromUsername(savedUser.getUsername());
        String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser.getUsername());

        RefreshToken refreshTokenObject = new RefreshToken();
        refreshTokenObject.setUser(savedUser);
        refreshTokenObject.setToken(refreshToken);
        refreshTokenObject.setExpiryDate(LocalDateTime.now().plusDays(8));
        refreshTokenRepository.save(refreshTokenObject);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .avatarUrl(savedUser.getAvatarUrl())
                .coverUrl(savedUser.getCoverUrl())
                .message("Đăng ký và đăng nhập thành công")
                .roles(savedUser.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .build();
    }

    @Transactional
    public User saveUser(RegisterRequest registerRequest) {
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setIsActive(true);

        Role client = roleRepository.findByName("ROLE_CLIENT")
                .orElseThrow(() -> new ResourceNotFoundException("Lỗi hệ thống: Không tìm thấy vai trò ROLE_CLIENT"));
        user.setRoles(Set.of(client));

        return userRepository.save(user);
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
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
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