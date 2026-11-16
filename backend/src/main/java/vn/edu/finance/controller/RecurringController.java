package vn.edu.finance.controller;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import vn.edu.finance.service.*;
@RestController @RequestMapping("/api/recurring") public class RecurringController {
 private final RecurringService recurring;private final AccountService account;
 public RecurringController(RecurringService recurring,AccountService account){this.recurring=recurring;this.account=account;}
 @GetMapping public Object list(@AuthenticationPrincipal OidcUser u){return recurring.list(account.user(u));}
 @ResponseStatus(HttpStatus.CREATED) @PostMapping public Object create(@AuthenticationPrincipal OidcUser u,@RequestBody Map<String,Object>b){recurring.create(account.user(u),b);return Map.of("created",true);}
 @DeleteMapping("/{id}") public Object delete(@AuthenticationPrincipal OidcUser u,@PathVariable long id){recurring.delete(account.user(u),id);return Map.of("deleted",true);}
 @PostMapping("/post-due") public Object postDue(@AuthenticationPrincipal OidcUser u){return recurring.postDue(account.user(u));}
}
