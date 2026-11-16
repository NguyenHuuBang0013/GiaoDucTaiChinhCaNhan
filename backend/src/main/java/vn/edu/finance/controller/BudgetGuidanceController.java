package vn.edu.finance.controller;

import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import vn.edu.finance.service.AccountService;
import vn.edu.finance.service.BudgetGuidanceService;

@RestController @RequestMapping("/api/budget-guidance")
public class BudgetGuidanceController {
    private final BudgetGuidanceService svc;
    private final AccountService accounts;
    public BudgetGuidanceController(BudgetGuidanceService svc,AccountService accounts){this.svc=svc;this.accounts=accounts;}
    @PostMapping("/suggest") public Object suggest(@AuthenticationPrincipal OidcUser u,@RequestBody Map<String,Object> input){return svc.suggest(accounts.user(u),input);}
    @GetMapping("/history/{id}") public Object history(@AuthenticationPrincipal OidcUser u,@PathVariable long id){return svc.history(accounts.user(u),id);}
    @GetMapping("/reflection/{id}") public Object reflection(@AuthenticationPrincipal OidcUser u,@PathVariable long id){return svc.reflection(accounts.user(u),id);}
    @PutMapping("/reflection/{id}") public Object save(@AuthenticationPrincipal OidcUser u,@PathVariable long id,@RequestBody Map<String,Object> b){return svc.saveReflection(accounts.user(u),id,b);}
    @GetMapping("/trends") public Object trends(@AuthenticationPrincipal OidcUser u){return svc.trends(accounts.user(u));}
}
