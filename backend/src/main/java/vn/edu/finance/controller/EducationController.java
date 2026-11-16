package vn.edu.finance.controller;

import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import vn.edu.finance.service.AccountService;
import vn.edu.finance.service.EducationService;

@RestController @RequestMapping("/api/education")
public class EducationController {
    private final EducationService education;
    private final AccountService accounts;
    public EducationController(EducationService education,AccountService accounts) {
        this.education=education;this.accounts=accounts;
    }
    @GetMapping("/profile") public Object profile(@AuthenticationPrincipal OidcUser u) {return education.profile(accounts.user(u));}
    @PutMapping("/profile") public Object updateProfile(@AuthenticationPrincipal OidcUser u,@RequestBody Map<String,Object> b) {return education.saveProfile(accounts.user(u),b);}
    @GetMapping("/topics") public Object topics(@AuthenticationPrincipal OidcUser u) {return education.topics(accounts.user(u));}
    @GetMapping("/assessment-questions") public Object questions(@AuthenticationPrincipal OidcUser u) {accounts.user(u);return education.assessmentQuestions();}
    @GetMapping("/assessments") public Object assessments(@AuthenticationPrincipal OidcUser u) {return education.assessments(accounts.user(u));}
    @PostMapping("/assessments") public Object submit(@AuthenticationPrincipal OidcUser u,@RequestBody Map<String,Object> b) {return education.submitAssessment(accounts.user(u),b);}
    @GetMapping("/recommendations") public Object recommendations(@AuthenticationPrincipal OidcUser u) {return education.recommendations(accounts.user(u));}
    @PostMapping("/practice") public Object practice(@AuthenticationPrincipal OidcUser u,@RequestBody Map<String,Object> b) {return education.practice(accounts.user(u),b);}
    @GetMapping("/practice/history") public Object practiceHistory(@AuthenticationPrincipal OidcUser u) {return education.practiceHistory(accounts.user(u));}
}
