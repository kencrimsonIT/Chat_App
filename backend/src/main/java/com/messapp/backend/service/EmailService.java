package com.messapp.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetPasswordEmail(String toEmail, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Yêu cầu đặt lại mật khẩu - MessApp");

            String content = "<h3>Chào bạn,</h3>"
                    + "<p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản MessApp của mình.</p>"
                    + "<p>Vui lòng nhấn vào liên kết bên dưới để tiến hành đặt lại mật khẩu:</p>"
                    + "<p><a href=\"" + resetLink + "\" style=\"background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;\">Đặt lại mật khẩu</a></p>"
                    + "<br>"
                    + "<p>Nếu liên kết trên không hoạt động, bạn có thể sao chép và dán URL sau vào trình duyệt:</p>"
                    + "<p>" + resetLink + "</p>"
                    + "<br>"
                    + "<p>Lưu ý: Liên kết này sẽ hết hạn sau 45 phút.</p>"
                    + "<p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>"
                    + "<p>Trân trọng,<br>Đội ngũ MessApp</p>";

            helper.setText(content, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }
}
