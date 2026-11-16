package vn.edu.finance.controller;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import vn.edu.finance.service.*;
@RestController @RequestMapping("/api/insights") public class InsightsController {
 private final InsightsService insights;private final AccountService account;
 public InsightsController(InsightsService insights,AccountService account){this.insights=insights;this.account=account;}
 @GetMapping("/alerts") public Object alerts(@AuthenticationPrincipal OidcUser u){return insights.alerts(account.user(u));}
}
