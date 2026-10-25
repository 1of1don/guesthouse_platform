package com.guesthub.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider,
                        @Value("${app.mail.enabled:false}") boolean enabled) {
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
    }

    public void sendReset(String to, String resetUrl) {
        // Always log the link so the forgot-password flow is testable without SMTP
        log.info("\n[DEV] Password reset link for {}:\n{}\n", to, resetUrl);

        if (!enabled) return;
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("MAIL_ENABLED=true but no mail sender - set MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD in .env");
            return;
        }
        try {
            var message = sender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(to);
            helper.setFrom("Mi Casa Su Casa <no-reply@micasasucasa.app>");
            helper.setSubject("Reset your Mi Casa Su Casa password");
            helper.setText("<p>You requested a password reset.</p>"
                    + "<p><a href=\"" + resetUrl + "\">Reset your password</a> (valid for 1 hour)</p>", true);
            sender.send(message);
            log.info("[EMAIL] Reset email sent to {}", to);
        } catch (Exception e) {
            log.warn("Could not send reset email: {}", e.getMessage());
        }
    }
}
