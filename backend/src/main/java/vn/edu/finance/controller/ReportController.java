package vn.edu.finance.controller;
import vn.edu.finance.service.ReportService;
import vn.edu.finance.service.AccountService;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
@RestController @RequestMapping("/api/reports") public class ReportController {
 private final ReportService f; private final AccountService account; public ReportController(ReportService f,AccountService account){this.f=f;this.account=account;}
 @GetMapping("/financial-summary") public Object summary(@AuthenticationPrincipal OidcUser u,@RequestParam String start,@RequestParam String end){return f.report(account.user(u),start,end);}
 @GetMapping("/budget-review/{id}") public Object review(@AuthenticationPrincipal OidcUser u,@PathVariable long id){return f.review(account.user(u),id);}
 @GetMapping("/monthly") public Object monthly(@AuthenticationPrincipal OidcUser u,@RequestParam int year){return f.monthly(account.user(u),year);}
}
